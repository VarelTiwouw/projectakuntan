import { ACCOUNT_TYPES } from '../data/chartOfAccounts';

/**
 * Format number to Indonesian Rupiah
 */
export function formatRupiah(number) {
  if (number === 0) return 'Rp 0';
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(number));
  return `${number < 0 ? '-' : ''}Rp ${formatted}`;
}

/**
 * Parse rupiah string back to number
 */
export function parseRupiah(str) {
  if (!str) return 0;
  const cleaned = str.toString().replace(/[^\d-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format number input with thousand separators
 */
export function formatNumberInput(value) {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : value;
  if (isNaN(num) || num === 0) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Parse formatted number string to integer
 */
export function parseFormattedNumber(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/\D/g, ''), 10) || 0;
}

/**
 * Calculate account balance based on opening balance and journal entries
 * @param {string} accountCode - Account code
 * @param {Array} accounts - All accounts
 * @param {Array} journals - All journal entries
 * @param {Object} openingBalances - Opening balances {accountCode: {debit, kredit}}
 * @param {string} startDate - Optional start date filter (YYYY-MM-DD)
 * @param {string} endDate - Optional end date filter (YYYY-MM-DD)
 */
export function calculateAccountBalance(accountCode, accounts, journals, openingBalances, startDate = null, endDate = null) {
  const account = accounts.find(a => a.code === accountCode);
  if (!account) return 0;

  // Opening balance
  const ob = openingBalances[accountCode] || { debit: 0, kredit: 0 };
  let totalDebit = ob.debit || 0;
  let totalKredit = ob.kredit || 0;

  // Filter journals by date range
  const filteredJournals = journals.filter(j => {
    if (startDate && j.date < startDate) return false;
    if (endDate && j.date > endDate) return false;
    return true;
  });

  // Sum journal entries for this account
  filteredJournals.forEach(journal => {
    journal.entries.forEach(entry => {
      if (entry.accountCode === accountCode) {
        totalDebit += entry.debit || 0;
        totalKredit += entry.kredit || 0;
      }
    });
  });

  // Calculate balance based on normal balance side
  if (account.normalBalance === 'debit') {
    return totalDebit - totalKredit;
  } else {
    return totalKredit - totalDebit;
  }
}

/**
 * Generate Balance Sheet data
 */
export function generateBalanceSheet(accounts, journals, openingBalances, endDate) {
  const result = {
    date: endDate,
    assets: { items: [], total: 0 },
    liabilities: { items: [], total: 0 },
    equity: { items: [], total: 0 },
  };

  accounts.forEach(account => {
    const balance = calculateAccountBalance(account.code, accounts, journals, openingBalances, null, endDate);
    
    if (balance === 0 && !(openingBalances[account.code]?.debit || openingBalances[account.code]?.kredit)) return;

    const item = { code: account.code, name: account.name, balance, category: account.category };

    if (account.type === ACCOUNT_TYPES.ASSET) {
      result.assets.items.push(item);
      // Contra assets reduce total assets
      if (account.category === 'Aset Tetap (Kontra)') {
        result.assets.total -= Math.abs(balance);
      } else {
        result.assets.total += balance;
      }
    } else if (account.type === ACCOUNT_TYPES.LIABILITY) {
      result.liabilities.items.push(item);
      result.liabilities.total += balance;
    } else if (account.type === ACCOUNT_TYPES.EQUITY) {
      result.equity.items.push(item);
      result.equity.total += balance;
    }
  });

  // Add net income to equity
  const netIncome = calculateNetIncome(accounts, journals, openingBalances, null, endDate);
  if (netIncome !== 0) {
    result.equity.items.push({ code: '-', name: 'Laba Bersih Periode Berjalan', balance: netIncome, category: 'Ekuitas' });
    result.equity.total += netIncome;
  }

  return result;
}

/**
 * Calculate net income (Pendapatan - Beban)
 */
export function calculateNetIncome(accounts, journals, openingBalances, startDate = null, endDate = null) {
  let totalRevenue = 0;
  let totalExpense = 0;

  accounts.forEach(account => {
    const balance = calculateAccountBalance(account.code, accounts, journals, openingBalances, startDate, endDate);
    if (account.type === ACCOUNT_TYPES.REVENUE) {
      totalRevenue += balance;
    } else if (account.type === ACCOUNT_TYPES.EXPENSE) {
      totalExpense += balance;
    }
  });

  return totalRevenue - totalExpense;
}

/**
 * Generate Income Statement data
 */
export function generateIncomeStatement(accounts, journals, openingBalances, startDate, endDate) {
  const result = {
    startDate,
    endDate,
    revenue: { items: [], total: 0 },
    expenses: { items: [], total: 0 },
    netIncome: 0,
  };

  accounts.forEach(account => {
    // For income statement, we only want movements in the period (not opening balances)
    const balance = calculateAccountBalance(account.code, accounts, journals, {}, startDate, endDate);

    if (balance === 0) return;

    const item = { code: account.code, name: account.name, balance };

    if (account.type === ACCOUNT_TYPES.REVENUE) {
      result.revenue.items.push(item);
      result.revenue.total += balance;
    } else if (account.type === ACCOUNT_TYPES.EXPENSE) {
      result.expenses.items.push(item);
      result.expenses.total += balance;
    }
  });

  result.netIncome = result.revenue.total - result.expenses.total;
  return result;
}

/**
 * Generate Cash Flow Statement data
 * Uses direct method (simplified)
 */
export function generateCashFlow(accounts, journals, openingBalances, startDate, endDate) {
  const cashAccounts = ['1-10001', '1-10002']; // Kas & Bank BCA

  const result = {
    startDate,
    endDate,
    operatingActivities: { items: [], total: 0 },
    investingActivities: { items: [], total: 0 },
    financingActivities: { items: [], total: 0 },
    netChange: 0,
    beginningCash: 0,
    endingCash: 0,
  };

  // Calculate beginning cash balance
  cashAccounts.forEach(code => {
    const ob = openingBalances[code] || { debit: 0, kredit: 0 };
    result.beginningCash += (ob.debit || 0) - (ob.kredit || 0);
  });

  // Add journal entries before start date to beginning cash
  if (startDate) {
    journals.filter(j => j.date < startDate).forEach(journal => {
      journal.entries.forEach(entry => {
        if (cashAccounts.includes(entry.accountCode)) {
          result.beginningCash += (entry.debit || 0) - (entry.kredit || 0);
        }
      });
    });
  }

  // Filter journals in the period
  const periodJournals = journals.filter(j => {
    if (startDate && j.date < startDate) return false;
    if (endDate && j.date > endDate) return false;
    return true;
  });

  // Categorize cash movements
  periodJournals.forEach(journal => {
    journal.entries.forEach(entry => {
      if (!cashAccounts.includes(entry.accountCode)) return;

      const cashChange = (entry.debit || 0) - (entry.kredit || 0);
      if (cashChange === 0) return;

      // Find the contra entry to determine category
      const contraEntries = journal.entries.filter(e => e.accountCode !== entry.accountCode);
      
      contraEntries.forEach(contra => {
        const contraAccount = accounts.find(a => a.code === contra.accountCode);
        if (!contraAccount) return;

        const description = `${journal.description} (${contraAccount.name})`;

        if (contraAccount.type === ACCOUNT_TYPES.REVENUE || 
            contraAccount.type === ACCOUNT_TYPES.EXPENSE ||
            contraAccount.category === 'Aset Lancar' && contraAccount.code !== '1-10001' && contraAccount.code !== '1-10002' ||
            contraAccount.category === 'Kewajiban Lancar') {
          // Operating activities
          result.operatingActivities.items.push({ name: description, amount: cashChange });
          result.operatingActivities.total += cashChange;
        } else if (contraAccount.category === 'Aset Tetap' || contraAccount.category === 'Aset Tetap (Kontra)') {
          // Investing activities
          result.investingActivities.items.push({ name: description, amount: cashChange });
          result.investingActivities.total += cashChange;
        } else if (contraAccount.type === ACCOUNT_TYPES.EQUITY || 
                   contraAccount.category === 'Kewajiban Jangka Panjang') {
          // Financing activities
          result.financingActivities.items.push({ name: description, amount: cashChange });
          result.financingActivities.total += cashChange;
        }
      });
    });
  });

  result.netChange = result.operatingActivities.total + result.investingActivities.total + result.financingActivities.total;
  result.endingCash = result.beginningCash + result.netChange;

  return result;
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date to Indonesian format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format date to period format
 */
export function formatPeriod(startDate, endDate) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const s = new Date(startDate);
  const e = new Date(endDate);
  
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${months[s.getMonth()]} ${s.getFullYear()}`;
  }
  
  return `${months[s.getMonth()]} ${s.getFullYear()} - ${months[e.getMonth()]} ${e.getFullYear()}`;
}
