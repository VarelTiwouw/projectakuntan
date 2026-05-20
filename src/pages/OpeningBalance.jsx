import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatNumberInput, parseFormattedNumber, formatRupiah } from '../utils/accounting';

export default function OpeningBalance() {
  const { state, dispatch } = useApp();
  const [balances, setBalances] = useState({});
  const [saved, setSaved] = useState(false);
  const [showZero, setShowZero] = useState(false);

  useEffect(() => {
    // Initialize balances from state
    const initial = {};
    state.accounts.forEach(acc => {
      const existing = state.openingBalances[acc.code] || { debit: 0, kredit: 0 };
      initial[acc.code] = {
        debit: existing.debit || 0,
        kredit: existing.kredit || 0,
      };
    });
    setBalances(initial);
  }, []);

  const handleChange = (code, side, value) => {
    const num = parseFormattedNumber(value);
    setBalances(prev => ({
      ...prev,
      [code]: { ...prev[code], [side]: num },
    }));
    setSaved(false);
  };

  const totalDebit = Object.values(balances).reduce((sum, b) => sum + (b.debit || 0), 0);
  const totalKredit = Object.values(balances).reduce((sum, b) => sum + (b.kredit || 0), 0);
  const isBalanced = totalDebit === totalKredit;

  const handleSave = () => {
    if (!isBalanced) return;
    dispatch({ type: 'SET_OPENING_BALANCES', payload: balances });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus semua saldo awal?')) return;
    const reset = {};
    state.accounts.forEach(acc => {
      reset[acc.code] = { debit: 0, kredit: 0 };
    });
    setBalances(reset);
    dispatch({ type: 'RESET_OPENING_BALANCES' });
    setSaved(false);
  };

  const filteredAccounts = showZero
    ? state.accounts
    : state.accounts.filter(acc => {
        const b = balances[acc.code];
        return !b || b.debit > 0 || b.kredit > 0 || !state.openingBalances[acc.code];
      });

  // Always show all accounts if no opening balances set yet
  const displayAccounts = Object.keys(state.openingBalances).length === 0 ? state.accounts : filteredAccounts;

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Saldo Awal</h1>
          <div className="subtitle">Konfirmasi saldo akun awal perusahaan</div>
        </div>
      </div>
      <div className="content-body">
        {saved && (
          <div className="alert alert-success">
            ✅ Saldo awal berhasil disimpan!
          </div>
        )}

        {!isBalanced && totalDebit + totalKredit > 0 && (
          <div className="alert alert-warning">
            ⚠️ Total Debit dan Kredit belum seimbang. Selisih: {formatRupiah(Math.abs(totalDebit - totalKredit))}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Saldo Awal Akun</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--gray-600)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showZero}
                onChange={(e) => setShowZero(e.target.checked)}
                style={{ accentColor: 'var(--primary-500)' }}
              />
              Tampilkan balance yang nol
            </label>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>No</th>
                  <th>Akun</th>
                  <th className="text-right" style={{ width: 180 }}>Debit</th>
                  <th className="text-right" style={{ width: 180 }}>Kredit</th>
                </tr>
              </thead>
              <tbody>
                {displayAccounts.map((acc, i) => (
                  <tr key={acc.code}>
                    <td style={{ color: 'var(--gray-400)' }}>{i + 1}</td>
                    <td>
                      <span style={{ color: 'var(--gray-500)', marginRight: 8 }}>{acc.code}</span>
                      <span style={{ fontWeight: 500 }}>{acc.name}</span>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ textAlign: 'right', maxWidth: 160 }}
                        value={balances[acc.code]?.debit ? formatNumberInput(balances[acc.code].debit) : ''}
                        onChange={(e) => handleChange(acc.code, 'debit', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ textAlign: 'right', maxWidth: 160 }}
                        value={balances[acc.code]?.kredit ? formatNumberInput(balances[acc.code].kredit) : ''}
                        onChange={(e) => handleChange(acc.code, 'kredit', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td></td>
                  <td style={{ fontWeight: 700 }}>Total</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                    {formatRupiah(totalDebit)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                    {formatRupiah(totalKredit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <button className="btn btn-secondary" onClick={handleReset}>
              ✕ Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!isBalanced}
              style={{ opacity: isBalanced ? 1 : 0.5 }}
            >
              💾 Simpan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
