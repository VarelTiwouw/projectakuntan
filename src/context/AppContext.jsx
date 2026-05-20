import { createContext, useContext, useReducer, useEffect } from 'react';
import { defaultAccounts } from '../data/chartOfAccounts';

const AppContext = createContext(null);

const STORAGE_KEY = 'akuntansi-app-data';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
  }
  return null;
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
}

const initialState = {
  company: {
    name: '',
    address: '',
    phone: '',
    email: '',
  },
  accounts: defaultAccounts,
  openingBalances: {}, // { accountCode: { debit: number, kredit: number } }
  journals: [], // { id, date, description, entries: [{ accountCode, debit, kredit }] }
  isSetupComplete: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_COMPANY':
      return { ...state, company: action.payload, isSetupComplete: true };
    
    case 'SET_OPENING_BALANCES':
      return { ...state, openingBalances: action.payload };
    
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

    case 'RESET_ALL':
      return { ...initialState };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const savedState = loadFromStorage();
  const [state, dispatch] = useReducer(appReducer, savedState || initialState);

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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
