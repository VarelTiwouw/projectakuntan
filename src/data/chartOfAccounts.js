// Default Chart of Accounts for the accounting application
// Kode akun mengikuti format Kledo: X-XXXXX

export const ACCOUNT_TYPES = {
  ASSET: 'Aset',
  LIABILITY: 'Kewajiban',
  EQUITY: 'Modal',
  REVENUE: 'Pendapatan',
  EXPENSE: 'Beban',
};

export const ACCOUNT_CATEGORIES = {
  CURRENT_ASSET: 'Aset Lancar',
  FIXED_ASSET: 'Aset Tetap',
  CONTRA_ASSET: 'Aset Tetap (Kontra)',
  CURRENT_LIABILITY: 'Kewajiban Lancar',
  LONG_TERM_LIABILITY: 'Kewajiban Jangka Panjang',
  EQUITY: 'Ekuitas',
  OPERATING_REVENUE: 'Pendapatan Usaha',
  OPERATING_EXPENSE: 'Beban Operasional',
};

export const defaultAccounts = [
  // ASET
  { code: '1-10001', name: 'Kas', type: ACCOUNT_TYPES.ASSET, category: ACCOUNT_CATEGORIES.CURRENT_ASSET, normalBalance: 'debit' },
  { code: '1-10002', name: 'Bank BCA', type: ACCOUNT_TYPES.ASSET, category: ACCOUNT_CATEGORIES.CURRENT_ASSET, normalBalance: 'debit' },
  { code: '1-10003', name: 'Piutang Usaha', type: ACCOUNT_TYPES.ASSET, category: ACCOUNT_CATEGORIES.CURRENT_ASSET, normalBalance: 'debit' },
  { code: '1-10004', name: 'Persediaan Barang', type: ACCOUNT_TYPES.ASSET, category: ACCOUNT_CATEGORIES.CURRENT_ASSET, normalBalance: 'debit' },
  { code: '1-10005', name: 'Perlengkapan', type: ACCOUNT_TYPES.ASSET, category: ACCOUNT_CATEGORIES.CURRENT_ASSET, normalBalance: 'debit' },
  { code: '1-20001', name: 'Peralatan', type: ACCOUNT_TYPES.ASSET, category: ACCOUNT_CATEGORIES.FIXED_ASSET, normalBalance: 'debit' },
  { code: '1-20002', name: 'Akumulasi Penyusutan Peralatan', type: ACCOUNT_TYPES.ASSET, category: ACCOUNT_CATEGORIES.CONTRA_ASSET, normalBalance: 'kredit' },

  // KEWAJIBAN
  { code: '2-10001', name: 'Hutang Usaha', type: ACCOUNT_TYPES.LIABILITY, category: ACCOUNT_CATEGORIES.CURRENT_LIABILITY, normalBalance: 'kredit' },
  { code: '2-10002', name: 'Hutang Bank', type: ACCOUNT_TYPES.LIABILITY, category: ACCOUNT_CATEGORIES.LONG_TERM_LIABILITY, normalBalance: 'kredit' },

  // MODAL
  { code: '3-10001', name: 'Modal Pemilik', type: ACCOUNT_TYPES.EQUITY, category: ACCOUNT_CATEGORIES.EQUITY, normalBalance: 'kredit' },
  { code: '3-10002', name: 'Laba Ditahan', type: ACCOUNT_TYPES.EQUITY, category: ACCOUNT_CATEGORIES.EQUITY, normalBalance: 'kredit' },
  { code: '3-30999', name: 'Ekuitas Saldo Awal', type: ACCOUNT_TYPES.EQUITY, category: ACCOUNT_CATEGORIES.EQUITY, normalBalance: 'kredit' },

  // PENDAPATAN
  { code: '4-10001', name: 'Pendapatan Penjualan', type: ACCOUNT_TYPES.REVENUE, category: ACCOUNT_CATEGORIES.OPERATING_REVENUE, normalBalance: 'kredit' },
  { code: '4-10002', name: 'Pendapatan Jasa', type: ACCOUNT_TYPES.REVENUE, category: ACCOUNT_CATEGORIES.OPERATING_REVENUE, normalBalance: 'kredit' },

  // BEBAN
  { code: '5-10001', name: 'Beban Gaji', type: ACCOUNT_TYPES.EXPENSE, category: ACCOUNT_CATEGORIES.OPERATING_EXPENSE, normalBalance: 'debit' },
  { code: '5-10002', name: 'Beban Sewa', type: ACCOUNT_TYPES.EXPENSE, category: ACCOUNT_CATEGORIES.OPERATING_EXPENSE, normalBalance: 'debit' },
  { code: '5-10003', name: 'Beban Listrik & Air', type: ACCOUNT_TYPES.EXPENSE, category: ACCOUNT_CATEGORIES.OPERATING_EXPENSE, normalBalance: 'debit' },
  { code: '5-10004', name: 'Beban Perlengkapan', type: ACCOUNT_TYPES.EXPENSE, category: ACCOUNT_CATEGORIES.OPERATING_EXPENSE, normalBalance: 'debit' },
  { code: '5-10005', name: 'Beban Transportasi', type: ACCOUNT_TYPES.EXPENSE, category: ACCOUNT_CATEGORIES.OPERATING_EXPENSE, normalBalance: 'debit' },
  { code: '5-10006', name: 'Beban Penyusutan', type: ACCOUNT_TYPES.EXPENSE, category: ACCOUNT_CATEGORIES.OPERATING_EXPENSE, normalBalance: 'debit' },
];
