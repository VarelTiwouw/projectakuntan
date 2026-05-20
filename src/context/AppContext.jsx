import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { defaultAccounts } from '../data/chartOfAccounts';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

const initialState = {
  company: {
    id: null,
    name: '',
    address: '',
    phone: '',
    email: '',
  },
  accounts: defaultAccounts,
  openingBalances: {},
  journals: [],
  isSetupComplete: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_COMPANY':
      return { ...state, company: action.payload, isSetupComplete: true };

    case 'SET_OPENING_BALANCES':
      return { ...state, openingBalances: action.payload };

    case 'SET_JOURNALS':
      return { ...state, journals: action.payload };

    case 'ADD_JOURNAL':
      return { ...state, journals: [...state.journals, action.payload] };

    case 'UPDATE_JOURNAL':
      return {
        ...state,
        journals: state.journals.map(j =>
          j.id === action.payload.id ? action.payload : j
        ),
      };

    case 'DELETE_JOURNAL':
      return {
        ...state,
        journals: state.journals.filter(j => j.id !== action.payload),
      };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    case 'RESET_ALL':
      return { ...initialState };

    default:
      return state;
  }
}

// ====== SUPABASE HELPER FUNCTIONS ======

// Get or create the single company record
async function loadCompany() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
  };
}

async function saveCompany(company) {
  if (company.id) {
    // Update existing
    const { data, error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
      })
      .eq('id', company.id)
      .select()
      .single();
    if (error) console.error('Error updating company:', error);
    return data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
      })
      .select()
      .single();
    if (error) console.error('Error inserting company:', error);
    return data;
  }
}

async function loadOpeningBalances(companyId) {
  const { data, error } = await supabase
    .from('opening_balances')
    .select('*')
    .eq('company_id', companyId);

  if (error) { console.error('Error loading opening balances:', error); return {}; }

  const balances = {};
  (data || []).forEach(row => {
    balances[row.account_code] = {
      debit: Number(row.debit) || 0,
      kredit: Number(row.kredit) || 0,
    };
  });
  return balances;
}

async function saveOpeningBalances(companyId, balances) {
  // Delete existing balances for this company
  await supabase.from('opening_balances').delete().eq('company_id', companyId);

  // Insert new balances (only non-zero ones)
  const rows = Object.entries(balances)
    .filter(([, b]) => b.debit > 0 || b.kredit > 0)
    .map(([code, b]) => ({
      company_id: companyId,
      account_code: code,
      debit: b.debit || 0,
      kredit: b.kredit || 0,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from('opening_balances').insert(rows);
    if (error) console.error('Error saving opening balances:', error);
  }
}

async function loadJournals(companyId) {
  const { data: journals, error } = await supabase
    .from('journals')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: true });

  if (error) { console.error('Error loading journals:', error); return []; }

  // Load entries for all journals
  const journalIds = (journals || []).map(j => j.id);
  if (journalIds.length === 0) return [];

  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('*')
    .in('journal_id', journalIds);

  if (entriesError) console.error('Error loading journal entries:', entriesError);

  // Combine journals with their entries
  return (journals || []).map(j => ({
    id: j.id,
    date: j.date,
    description: j.description,
    entries: (entries || [])
      .filter(e => e.journal_id === j.id)
      .map(e => ({
        id: e.id,
        accountCode: e.account_code,
        debit: Number(e.debit) || 0,
        kredit: Number(e.kredit) || 0,
      })),
  }));
}

async function saveJournal(companyId, journal) {
  // Insert the journal header
  const { data, error } = await supabase
    .from('journals')
    .insert({
      company_id: companyId,
      date: journal.date,
      description: journal.description,
    })
    .select()
    .single();

  if (error) { console.error('Error saving journal:', error); return null; }

  // Insert journal entries
  const entries = journal.entries.map(e => ({
    journal_id: data.id,
    account_code: e.accountCode,
    debit: e.debit || 0,
    kredit: e.kredit || 0,
  }));

  const { error: entriesError } = await supabase.from('journal_entries').insert(entries);
  if (entriesError) console.error('Error saving journal entries:', entriesError);

  // Return the journal with DB id
  return {
    ...journal,
    id: data.id,
  };
}

async function updateJournal(journal) {
  // Update journal header
  const { error } = await supabase
    .from('journals')
    .update({
      date: journal.date,
      description: journal.description,
    })
    .eq('id', journal.id);

  if (error) console.error('Error updating journal:', error);

  // Delete old entries and insert new ones
  await supabase.from('journal_entries').delete().eq('journal_id', journal.id);

  const entries = journal.entries.map(e => ({
    journal_id: journal.id,
    account_code: e.accountCode,
    debit: e.debit || 0,
    kredit: e.kredit || 0,
  }));

  const { error: entriesError } = await supabase.from('journal_entries').insert(entries);
  if (entriesError) console.error('Error updating journal entries:', entriesError);
}

async function deleteJournal(journalId) {
  // Entries will be cascade-deleted because of FK constraint
  const { error } = await supabase.from('journals').delete().eq('id', journalId);
  if (error) console.error('Error deleting journal:', error);
}

// ====== PROVIDER ======

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const company = await loadCompany();
        if (company) {
          const [openingBalances, journals] = await Promise.all([
            loadOpeningBalances(company.id),
            loadJournals(company.id),
          ]);

          dispatch({
            type: 'LOAD_STATE',
            payload: {
              company,
              openingBalances,
              journals,
              isSetupComplete: true,
            },
          });
        }
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Wrapped dispatch that also saves to Supabase
  const supabaseDispatch = useCallback(async (action) => {
    switch (action.type) {
      case 'SET_COMPANY': {
        const saved = await saveCompany(action.payload);
        if (saved) {
          dispatch({ type: 'SET_COMPANY', payload: { ...action.payload, id: saved.id } });
        }
        return;
      }

      case 'SET_OPENING_BALANCES': {
        const companyId = state.company.id;
        if (companyId) {
          await saveOpeningBalances(companyId, action.payload);
        }
        dispatch(action);
        return;
      }

      case 'ADD_JOURNAL': {
        const companyId = state.company.id;
        if (companyId) {
          const savedJournal = await saveJournal(companyId, action.payload);
          if (savedJournal) {
            dispatch({ type: 'ADD_JOURNAL', payload: savedJournal });
            return;
          }
        }
        dispatch(action);
        return;
      }

      case 'UPDATE_JOURNAL': {
        await updateJournal(action.payload);
        dispatch(action);
        return;
      }

      case 'DELETE_JOURNAL': {
        await deleteJournal(action.payload);
        dispatch(action);
        return;
      }

      case 'RESET_ALL': {
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
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
