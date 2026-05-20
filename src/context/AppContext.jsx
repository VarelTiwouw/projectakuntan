import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { defaultAccounts } from '../data/chartOfAccounts';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

const initialState = {
  company: { id: null, name: '', address: '', phone: '', email: '' },
  accounts: defaultAccounts,
  openingBalances: {},
  journals: [],
  isSetupComplete: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_COMPANY':
      return { ...state, company: action.payload, isSetupComplete: true };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };
    case 'SET_OPENING_BALANCES':
      return { ...state, openingBalances: action.payload };
    case 'SET_JOURNALS':
      return { ...state, journals: action.payload };
    case 'ADD_JOURNAL':
      return { ...state, journals: [...state.journals, action.payload] };
    case 'UPDATE_JOURNAL':
      return { ...state, journals: state.journals.map(j => j.id === action.payload.id ? action.payload : j) };
    case 'DELETE_JOURNAL':
      return { ...state, journals: state.journals.filter(j => j.id !== action.payload) };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'RESET_ALL':
      return { ...initialState };
    default:
      return state;
  }
}

// ====== SUPABASE HELPERS ======

async function loadCompany() {
  const { data } = await supabase.from('companies').select('*').limit(1).single();
  if (!data) return null;
  return { id: data.id, name: data.name || '', address: data.address || '', phone: data.phone || '', email: data.email || '' };
}

async function saveCompany(company) {
  if (company.id) {
    const { data } = await supabase.from('companies').update({ name: company.name, address: company.address, phone: company.phone, email: company.email }).eq('id', company.id).select().single();
    return data;
  } else {
    const { data } = await supabase.from('companies').insert({ name: company.name, address: company.address, phone: company.phone, email: company.email }).select().single();
    return data;
  }
}

async function loadAccounts(companyId) {
  const { data, error } = await supabase.from('accounts').select('*').eq('company_id', companyId).order('code');
  if (error || !data || data.length === 0) return null;
  return data.map(a => ({ id: a.id, code: a.code, name: a.name, type: a.type, category: a.category, normalBalance: a.normal_balance }));
}

async function seedDefaultAccounts(companyId) {
  const rows = defaultAccounts.map(a => ({ company_id: companyId, code: a.code, name: a.name, type: a.type, category: a.category, normal_balance: a.normalBalance }));
  const { data, error } = await supabase.from('accounts').insert(rows).select();
  if (error) { console.error('Error seeding accounts:', error); return defaultAccounts; }
  return data.map(a => ({ id: a.id, code: a.code, name: a.name, type: a.type, category: a.category, normalBalance: a.normal_balance }));
}

async function loadOpeningBalances(companyId) {
  const { data } = await supabase.from('opening_balances').select('*').eq('company_id', companyId);
  const balances = {};
  (data || []).forEach(row => { balances[row.account_code] = { debit: Number(row.debit) || 0, kredit: Number(row.kredit) || 0 }; });
  return balances;
}

async function saveOpeningBalances(companyId, balances) {
  await supabase.from('opening_balances').delete().eq('company_id', companyId);
  const rows = Object.entries(balances).filter(([, b]) => b.debit > 0 || b.kredit > 0).map(([code, b]) => ({ company_id: companyId, account_code: code, debit: b.debit || 0, kredit: b.kredit || 0 }));
  if (rows.length > 0) await supabase.from('opening_balances').insert(rows);
}

async function loadJournals(companyId) {
  const { data: journals } = await supabase.from('journals').select('*').eq('company_id', companyId).order('date', { ascending: true });
  if (!journals || journals.length === 0) return [];
  const journalIds = journals.map(j => j.id);
  const { data: entries } = await supabase.from('journal_entries').select('*').in('journal_id', journalIds);
  return journals.map(j => ({
    id: j.id, date: j.date, description: j.description,
    entries: (entries || []).filter(e => e.journal_id === j.id).map(e => ({ id: e.id, accountCode: e.account_code, debit: Number(e.debit) || 0, kredit: Number(e.kredit) || 0 })),
  }));
}

async function saveJournal(companyId, journal) {
  const { data } = await supabase.from('journals').insert({ company_id: companyId, date: journal.date, description: journal.description }).select().single();
  if (!data) return null;
  const entries = journal.entries.map(e => ({ journal_id: data.id, account_code: e.accountCode, debit: e.debit || 0, kredit: e.kredit || 0 }));
  await supabase.from('journal_entries').insert(entries);
  return { ...journal, id: data.id };
}

async function updateJournalDB(journal) {
  await supabase.from('journals').update({ date: journal.date, description: journal.description }).eq('id', journal.id);
  await supabase.from('journal_entries').delete().eq('journal_id', journal.id);
  const entries = journal.entries.map(e => ({ journal_id: journal.id, account_code: e.accountCode, debit: e.debit || 0, kredit: e.kredit || 0 }));
  await supabase.from('journal_entries').insert(entries);
}

async function deleteJournalDB(journalId) {
  await supabase.from('journals').delete().eq('id', journalId);
}

// ====== PROVIDER ======

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const company = await loadCompany();
        if (company) {
          let accounts = defaultAccounts;
          try {
            const loaded = await loadAccounts(company.id);
            if (loaded) {
              accounts = loaded;
            } else {
              const seeded = await seedDefaultAccounts(company.id);
              if (seeded) accounts = seeded;
            }
          } catch (err) {
            console.error('Error loading accounts (using defaults):', err);
          }
          const [openingBalances, journals] = await Promise.all([loadOpeningBalances(company.id), loadJournals(company.id)]);
          dispatch({ type: 'LOAD_STATE', payload: { company, accounts, openingBalances, journals, isSetupComplete: true } });
        }
      } catch (err) { console.error('Error loading data:', err); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const supabaseDispatch = useCallback(async (action) => {
    switch (action.type) {
      case 'SET_COMPANY': {
        const saved = await saveCompany(action.payload);
        if (saved) {
          dispatch({ type: 'SET_COMPANY', payload: { ...action.payload, id: saved.id } });
          // Seed accounts if new company
          if (!action.payload.id) {
            const accounts = await seedDefaultAccounts(saved.id);
            dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
          }
        }
        return;
      }
      case 'ADD_ACCOUNT': {
        const companyId = state.company.id;
        let newAccount = { ...action.payload, id: action.payload.id || crypto.randomUUID() };
        if (companyId) {
          try {
            const { data, error } = await supabase.from('accounts').insert({
              company_id: companyId, code: action.payload.code, name: action.payload.name,
              type: action.payload.type, category: action.payload.category, normal_balance: action.payload.normalBalance,
            }).select().single();
            if (!error && data) {
              newAccount = { id: data.id, code: data.code, name: data.name, type: data.type, category: data.category, normalBalance: data.normal_balance };
            } else if (error) {
              console.error('Supabase error adding account:', error);
            }
          } catch (err) {
            console.error('Error adding account to Supabase:', err);
          }
        }
        dispatch({ type: 'ADD_ACCOUNT', payload: newAccount });
        return;
      }
      case 'DELETE_ACCOUNT': {
        await supabase.from('accounts').delete().eq('id', action.payload);
        dispatch(action);
        return;
      }
      case 'SET_OPENING_BALANCES': {
        if (state.company.id) await saveOpeningBalances(state.company.id, action.payload);
        dispatch(action);
        return;
      }
      case 'ADD_JOURNAL': {
        if (state.company.id) {
          const saved = await saveJournal(state.company.id, action.payload);
          if (saved) { dispatch({ type: 'ADD_JOURNAL', payload: saved }); return; }
        }
        dispatch(action);
        return;
      }
      case 'UPDATE_JOURNAL': {
        await updateJournalDB(action.payload);
        dispatch(action);
        return;
      }
      case 'DELETE_JOURNAL': {
        await deleteJournalDB(action.payload);
        dispatch(action);
        return;
      }
      case 'RESET_OPENING_BALANCES': {
        if (state.company.id) await supabase.from('opening_balances').delete().eq('company_id', state.company.id);
        dispatch({ type: 'SET_OPENING_BALANCES', payload: {} });
        return;
      }
      case 'RESET_ALL': {
        const companyId = state.company.id;
        if (companyId) {
          const { data: journals } = await supabase.from('journals').select('id').eq('company_id', companyId);
          if (journals && journals.length > 0) {
            await supabase.from('journal_entries').delete().in('journal_id', journals.map(j => j.id));
            await supabase.from('journals').delete().eq('company_id', companyId);
          }
          await supabase.from('opening_balances').delete().eq('company_id', companyId);
          await supabase.from('accounts').delete().eq('company_id', companyId);
          await supabase.from('companies').delete().eq('id', companyId);
        }
        dispatch(action);
        return;
      }
      default:
        dispatch(action);
    }
  }, [state.company.id]);

  return (
    <AppContext.Provider value={{ state, dispatch: supabaseDispatch, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
