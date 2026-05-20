import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateCashFlow, formatRupiah, formatPeriod } from '../utils/accounting';

export default function CashFlow() {
  const { state } = useApp();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const data = generateCashFlow(state.accounts, state.journals, state.openingBalances, startDate, endDate);

  return (
    <>
      <div className="content-header no-print">
        <div>
          <h1>Laporan Arus Kas</h1>
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

        {state.journals.length === 0 && Object.keys(state.openingBalances).length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">💵</div>
              <h3>Belum Ada Data</h3>
              <p>Isi saldo awal dan buat jurnal terlebih dahulu</p>
            </div>
          </div>
        ) : (
          <div className="report-container">
            <div className="report-header">
              {state.company.name && <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>{state.company.name}</div>}
              <h2>LAPORAN ARUS KAS</h2>
              <div className="report-date">Periode {formatPeriod(startDate, endDate)}</div>
            </div>

            <div className="report-body">
              {/* Arus Kas Operasi */}
              <div className="report-section">
                <div className="report-section-title">Arus Kas dari Aktivitas Operasi</div>
                {data.operatingActivities.items.length > 0 ? (
                  data.operatingActivities.items.map((item, i) => (
                    <div className="report-line" key={i}>
                      <span className="account-name">{item.name}</span>
                      <span className="account-amount" style={{ color: item.amount >= 0 ? 'var(--gray-800)' : 'var(--danger)' }}>
                        {formatRupiah(item.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="report-line">
                    <span className="account-name" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Tidak ada aktivitas operasi</span>
                    <span className="account-amount">Rp 0</span>
                  </div>
                )}
                <div className="report-line subtotal">
                  <span className="account-name">Arus Kas Bersih Operasi</span>
                  <span className="account-amount">{formatRupiah(data.operatingActivities.total)}</span>
                </div>
              </div>

              {/* Arus Kas Investasi */}
              <div className="report-section">
                <div className="report-section-title">Arus Kas dari Aktivitas Investasi</div>
                {data.investingActivities.items.length > 0 ? (
                  data.investingActivities.items.map((item, i) => (
                    <div className="report-line" key={i}>
                      <span className="account-name">{item.name}</span>
                      <span className="account-amount" style={{ color: item.amount >= 0 ? 'var(--gray-800)' : 'var(--danger)' }}>
                        {formatRupiah(item.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="report-line">
                    <span className="account-name" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Tidak ada aktivitas investasi</span>
                    <span className="account-amount">Rp 0</span>
                  </div>
                )}
                <div className="report-line subtotal">
                  <span className="account-name">Arus Kas Bersih Investasi</span>
                  <span className="account-amount">{formatRupiah(data.investingActivities.total)}</span>
                </div>
              </div>

              {/* Arus Kas Pendanaan */}
              <div className="report-section">
                <div className="report-section-title">Arus Kas dari Aktivitas Pendanaan</div>
                {data.financingActivities.items.length > 0 ? (
                  data.financingActivities.items.map((item, i) => (
                    <div className="report-line" key={i}>
                      <span className="account-name">{item.name}</span>
                      <span className="account-amount" style={{ color: item.amount >= 0 ? 'var(--gray-800)' : 'var(--danger)' }}>
                        {formatRupiah(item.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="report-line">
                    <span className="account-name" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Tidak ada aktivitas pendanaan</span>
                    <span className="account-amount">Rp 0</span>
                  </div>
                )}
                <div className="report-line subtotal">
                  <span className="account-name">Arus Kas Bersih Pendanaan</span>
                  <span className="account-amount">{formatRupiah(data.financingActivities.total)}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="report-section" style={{ borderTop: '2px solid var(--gray-300)', paddingTop: 16 }}>
                <div className="report-line">
                  <span className="account-name" style={{ paddingLeft: 0, fontWeight: 600 }}>Kenaikan (Penurunan) Kas Bersih</span>
                  <span className="account-amount" style={{ fontWeight: 600, color: data.netChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatRupiah(data.netChange)}
                  </span>
                </div>
                <div className="report-line">
                  <span className="account-name" style={{ paddingLeft: 0 }}>Saldo Kas Awal Periode</span>
                  <span className="account-amount">{formatRupiah(data.beginningCash)}</span>
                </div>
                <div className="report-line grand-total">
                  <span className="account-name" style={{ paddingLeft: 0 }}>Saldo Kas Akhir Periode</span>
                  <span className="account-amount">{formatRupiah(data.endingCash)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
