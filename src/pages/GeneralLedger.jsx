import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatDate } from '../utils/accounting';

export default function GeneralLedger() {
  const { state } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Build ref map: journal id → "JU-01", "JU-02", etc.
  const sortedJournals = useMemo(() => {
    return [...state.journals].sort((a, b) => a.date.localeCompare(b.date));
  }, [state.journals]);

  const refMap = useMemo(() => {
    const map = {};
    sortedJournals.forEach((j, idx) => {
      map[j.id] = `JU-${String(idx + 1).padStart(2, '0')}`;
    });
    return map;
  }, [sortedJournals]);

  // Filter journals by date range
  const filteredJournals = useMemo(() => {
    return sortedJournals.filter(j => {
      if (startDate && j.date < startDate) return false;
      if (endDate && j.date > endDate) return false;
      return true;
    });
  }, [sortedJournals, startDate, endDate]);

  // Get accounts that have transactions or opening balances
  const activeAccounts = useMemo(() => {
    const activeCodes = new Set();

    // Accounts with opening balances
    Object.entries(state.openingBalances).forEach(([code, b]) => {
      if (b.debit > 0 || b.kredit > 0) activeCodes.add(code);
    });

    // Accounts used in journals
    filteredJournals.forEach(j => {
      j.entries.forEach(e => activeCodes.add(e.accountCode));
    });

    return state.accounts
      .filter(a => activeCodes.has(a.code))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [state.accounts, state.openingBalances, filteredJournals]);

  // Calculate ledger for one account
  function calculateLedger(account) {
    const ob = state.openingBalances[account.code] || { debit: 0, kredit: 0 };
    const isDebitNormal = account.normalBalance === 'debit';

    // Opening balance saldo
    let saldo = isDebitNormal ? (ob.debit - ob.kredit) : (ob.kredit - ob.debit);

    const rows = [];

    // Saldo Awal row
    rows.push({
      date: null,
      description: 'Saldo Awal',
      ref: 'SA',
      debit: 0,
      kredit: 0,
      saldo: saldo,
      isSaldoAwal: true,
    });

    let totalDebit = 0;
    let totalKredit = 0;

    // Journal entries
    filteredJournals.forEach(journal => {
      journal.entries.forEach(entry => {
        if (entry.accountCode !== account.code) return;

        const debit = entry.debit || 0;
        const kredit = entry.kredit || 0;

        if (isDebitNormal) {
          saldo = saldo + debit - kredit;
        } else {
          saldo = saldo - debit + kredit;
        }

        totalDebit += debit;
        totalKredit += kredit;

        rows.push({
          date: journal.date,
          description: journal.description,
          ref: refMap[journal.id] || '-',
          debit,
          kredit,
          saldo,
        });
      });
    });

    return { rows, totalDebit, totalKredit, finalSaldo: saldo };
  }

  // Period label
  const periodLabel = useMemo(() => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return `${months[s.getMonth()]} ${s.getFullYear()}`;
      }
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) return `Mulai ${formatDate(startDate)}`;
    if (endDate) return `Sampai ${formatDate(endDate)}`;
    return 'Semua Periode';
  }, [startDate, endDate]);

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Buku Besar</h1>
          <div className="subtitle">General Ledger - Rekap per akun</div>
        </div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}>
          🖨️ Cetak
        </button>
      </div>

      <div className="content-body">
        <div className="date-filter no-print">
          <label>Dari:</label>
          <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>Sampai:</label>
          <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          {(startDate || endDate) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setStartDate(''); setEndDate(''); }}>✕ Reset</button>
          )}
        </div>

        {activeAccounts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📒</div>
              <h3>Belum Ada Data</h3>
              <p>Buku besar akan otomatis terisi saat Anda membuat jurnal</p>
            </div>
          </div>
        ) : (
          activeAccounts.map(account => {
            const ledger = calculateLedger(account);
            return (
              <div key={account.code} className="report-container" style={{ marginBottom: 28, pageBreakAfter: 'always' }}>
                {/* Header */}
                <div className="report-header" style={{ paddingBottom: 12 }}>
                  <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.08em' }}>BUKU BESAR</h2>
                  {state.company.name && (
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-700)', marginTop: 4 }}>
                      {state.company.name}
                    </div>
                  )}
                  <div className="report-date">Periode: {periodLabel}</div>
                </div>

                {/* Account info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Nama Akun : </span>
                    <strong>{account.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Kode Akun : </span>
                    <strong>{account.code}</strong>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr style={{ background: '#e8d5b8' }}>
                        <th style={{ width: 120 }}>Tanggal</th>
                        <th>Keterangan</th>
                        <th style={{ width: 80 }} className="text-center">Ref</th>
                        <th style={{ width: 140 }} className="text-right">Debit (Rp)</th>
                        <th style={{ width: 140 }} className="text-right">Kredit (Rp)</th>
                        <th style={{ width: 160 }} className="text-right">Saldo (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.rows.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {row.isSaldoAwal ? '' : formatDate(row.date)}
                          </td>
                          <td style={{ fontWeight: row.isSaldoAwal ? 500 : 400 }}>{row.description}</td>
                          <td className="text-center" style={{ color: 'var(--gray-500)' }}>{row.ref}</td>
                          <td className="number">
                            {row.isSaldoAwal ? '-' : (row.debit > 0 ? formatRupiah(row.debit) : '-')}
                          </td>
                          <td className="number">
                            {row.isSaldoAwal ? '-' : (row.kredit > 0 ? formatRupiah(row.kredit) : '-')}
                          </td>
                          <td className="number" style={{ fontWeight: 600, color: row.saldo < 0 ? 'var(--danger)' : 'var(--gray-800)' }}>
                            {formatRupiah(Math.abs(row.saldo))}
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr style={{ background: '#e8d5b8', fontWeight: 700 }}>
                        <td></td>
                        <td style={{ fontWeight: 700, textAlign: 'center' }}>TOTAL</td>
                        <td></td>
                        <td className="number" style={{ fontWeight: 700 }}>{formatRupiah(ledger.totalDebit)}</td>
                        <td className="number" style={{ fontWeight: 700 }}>{formatRupiah(ledger.totalKredit)}</td>
                        <td className="number" style={{ fontWeight: 700, color: ledger.finalSaldo < 0 ? 'var(--danger)' : 'var(--primary-700)' }}>
                          {formatRupiah(Math.abs(ledger.finalSaldo))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
