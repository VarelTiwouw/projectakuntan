import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateBalanceSheet, formatRupiah, formatDate } from '../utils/accounting';

export default function BalanceSheet() {
  const { state } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const [endDate, setEndDate] = useState(today);

  const data = generateBalanceSheet(state.accounts, state.journals, state.openingBalances, endDate);

  const totalLiabilitiesEquity = data.liabilities.total + data.equity.total;

  return (
    <>
      <div className="content-header no-print">
        <div>
          <h1>Neraca</h1>
          <div className="subtitle">Laporan Posisi Keuangan</div>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          🖨️ Cetak
        </button>
      </div>

      <div className="content-body">
        <div className="date-filter no-print">
          <label>Per Tanggal:</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        {state.journals.length === 0 && Object.keys(state.openingBalances).length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Belum Ada Data</h3>
              <p>Isi saldo awal dan buat jurnal terlebih dahulu</p>
            </div>
          </div>
        ) : (
          <div className="report-container">
            <div className="report-header">
              {state.company.name && <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>{state.company.name}</div>}
              <h2>NERACA</h2>
              <div className="report-date">Per {formatDate(endDate)}</div>
            </div>

            <div className="report-body">
              {/* ASET */}
              <div className="report-section">
                <div className="report-section-title">Aset</div>
                {data.assets.items.map(item => (
                  <div className="report-line" key={item.code}>
                    <span className="account-name">{item.name}</span>
                    <span className="account-amount">{formatRupiah(item.balance)}</span>
                  </div>
                ))}
                <div className="report-line subtotal">
                  <span className="account-name">Total Aset</span>
                  <span className="account-amount">{formatRupiah(data.assets.total)}</span>
                </div>
              </div>

              {/* KEWAJIBAN */}
              <div className="report-section">
                <div className="report-section-title">Kewajiban</div>
                {data.liabilities.items.length > 0 ? (
                  data.liabilities.items.map(item => (
                    <div className="report-line" key={item.code}>
                      <span className="account-name">{item.name}</span>
                      <span className="account-amount">{formatRupiah(item.balance)}</span>
                    </div>
                  ))
                ) : (
                  <div className="report-line">
                    <span className="account-name" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Tidak ada kewajiban</span>
                    <span className="account-amount">Rp 0</span>
                  </div>
                )}
                <div className="report-line subtotal">
                  <span className="account-name">Total Kewajiban</span>
                  <span className="account-amount">{formatRupiah(data.liabilities.total)}</span>
                </div>
              </div>

              {/* MODAL */}
              <div className="report-section">
                <div className="report-section-title">Modal</div>
                {data.equity.items.map(item => (
                  <div className="report-line" key={item.code}>
                    <span className="account-name">{item.name}</span>
                    <span className="account-amount">{formatRupiah(item.balance)}</span>
                  </div>
                ))}
                <div className="report-line subtotal">
                  <span className="account-name">Total Modal</span>
                  <span className="account-amount">{formatRupiah(data.equity.total)}</span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="report-line grand-total">
                <span className="account-name" style={{ fontWeight: 700 }}>Total Kewajiban + Modal</span>
                <span className="account-amount">{formatRupiah(totalLiabilitiesEquity)}</span>
              </div>

              {data.assets.total !== totalLiabilitiesEquity && (
                <div className="alert alert-danger" style={{ marginTop: 16 }}>
                  ⚠️ Neraca tidak seimbang! Aset ({formatRupiah(data.assets.total)}) ≠ Kewajiban + Modal ({formatRupiah(totalLiabilitiesEquity)})
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
