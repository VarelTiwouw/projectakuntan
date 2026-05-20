import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateIncomeStatement, formatRupiah, formatPeriod } from '../utils/accounting';

export default function IncomeStatement() {
  const { state } = useApp();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const data = generateIncomeStatement(state.accounts, state.journals, state.openingBalances, startDate, endDate);

  return (
    <>
      <div className="content-header no-print">
        <div>
          <h1>Laporan Laba Rugi</h1>
          <div className="subtitle">Periode {formatPeriod(startDate, endDate)}</div>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          🖨️ Cetak
        </button>
      </div>

      <div className="content-body">
        <div className="date-filter no-print">
          <label>Dari:</label>
          <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>Sampai:</label>
          <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        {state.journals.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <h3>Belum Ada Data</h3>
              <p>Buat jurnal terlebih dahulu untuk melihat laporan laba rugi</p>
            </div>
          </div>
        ) : (
          <div className="report-container">
            <div className="report-header">
              {state.company.name && <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>{state.company.name}</div>}
              <h2>LAPORAN LABA RUGI</h2>
              <div className="report-date">Periode {formatPeriod(startDate, endDate)}</div>
            </div>

            <div className="report-body">
              {/* PENDAPATAN */}
              <div className="report-section">
                <div className="report-section-title">Pendapatan</div>
                {data.revenue.items.length > 0 ? (
                  data.revenue.items.map(item => (
                    <div className="report-line" key={item.code}>
                      <span className="account-name">{item.name}</span>
                      <span className="account-amount">{formatRupiah(item.balance)}</span>
                    </div>
                  ))
                ) : (
                  <div className="report-line">
                    <span className="account-name" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Tidak ada pendapatan di periode ini</span>
                    <span className="account-amount">Rp 0</span>
                  </div>
                )}
                <div className="report-line subtotal">
                  <span className="account-name">Total Pendapatan</span>
                  <span className="account-amount">{formatRupiah(data.revenue.total)}</span>
                </div>
              </div>

              {/* BEBAN */}
              <div className="report-section">
                <div className="report-section-title" style={{ color: 'var(--danger)' }}>Beban</div>
                {data.expenses.items.length > 0 ? (
                  data.expenses.items.map(item => (
                    <div className="report-line" key={item.code}>
                      <span className="account-name">{item.name}</span>
                      <span className="account-amount">{formatRupiah(item.balance)}</span>
                    </div>
                  ))
                ) : (
                  <div className="report-line">
                    <span className="account-name" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Tidak ada beban di periode ini</span>
                    <span className="account-amount">Rp 0</span>
                  </div>
                )}
                <div className="report-line subtotal">
                  <span className="account-name">Total Beban</span>
                  <span className="account-amount" style={{ color: 'var(--danger)' }}>{formatRupiah(data.expenses.total)}</span>
                </div>
              </div>

              {/* LABA BERSIH */}
              <div className="report-line net-income">
                <span className="account-name" style={{ paddingLeft: 0 }}>Laba Bersih</span>
                <span className={`account-amount ${data.netIncome < 0 ? 'negative' : ''}`}>
                  {formatRupiah(data.netIncome)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
