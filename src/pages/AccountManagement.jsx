import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ACCOUNT_TYPES, ACCOUNT_CATEGORIES } from '../data/chartOfAccounts';

const typeOptions = Object.entries(ACCOUNT_TYPES).map(([, v]) => v);
const categoryMap = {
  [ACCOUNT_TYPES.ASSET]: ['Aset Lancar', 'Aset Tetap', 'Aset Tetap (Kontra)'],
  [ACCOUNT_TYPES.LIABILITY]: ['Kewajiban Lancar', 'Kewajiban Jangka Panjang'],
  [ACCOUNT_TYPES.EQUITY]: ['Ekuitas'],
  [ACCOUNT_TYPES.REVENUE]: ['Pendapatan Usaha'],
  [ACCOUNT_TYPES.EXPENSE]: ['Beban Operasional'],
};

const emptyForm = { code: '', name: '', type: ACCOUNT_TYPES.ASSET, category: 'Aset Lancar', normalBalance: 'debit' };

export default function AccountManagement() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const grouped = {};
  typeOptions.forEach(type => { grouped[type] = state.accounts.filter(a => a.type === type); });

  const handleTypeChange = (type) => {
    const cats = categoryMap[type] || [];
    const normalBalance = (type === ACCOUNT_TYPES.ASSET || type === ACCOUNT_TYPES.EXPENSE) ? 'debit' : 'kredit';
    setForm(prev => ({ ...prev, type, category: cats[0] || '', normalBalance }));
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) { setError('Kode akun harus diisi'); return; }
    if (!form.name.trim()) { setError('Nama akun harus diisi'); return; }
    if (state.accounts.some(a => a.code === form.code.trim())) { setError('Kode akun sudah digunakan'); return; }

    await dispatch({ type: 'ADD_ACCOUNT', payload: { ...form, code: form.code.trim(), name: form.name.trim() } });
    setSuccess(`Akun "${form.name}" berhasil ditambahkan!`);
    setForm({ ...emptyForm });
    setShowModal(false);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async (account) => {
    const usedInJournals = state.journals.some(j => j.entries.some(e => e.accountCode === account.code));
    const usedInOB = state.openingBalances[account.code];
    if (usedInJournals || usedInOB) {
      alert('Akun ini tidak bisa dihapus karena sudah digunakan dalam jurnal atau saldo awal.');
      return;
    }
    if (!window.confirm(`Hapus akun "${account.code} - ${account.name}"?`)) return;
    await dispatch({ type: 'DELETE_ACCOUNT', payload: account.id });
    setSuccess(`Akun "${account.name}" berhasil dihapus`);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Daftar Akun</h1>
          <div className="subtitle">Kelola chart of accounts perusahaan</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>
          + Tambah Akun
        </button>
      </div>

      <div className="content-body">
        {success && <div className="alert alert-success">✅ {success}</div>}

        {typeOptions.map(type => (
          <div className="card" key={type} style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>{type} ({grouped[type]?.length || 0})</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th style={{ width: 120 }}>Kode</th>
                    <th>Nama Akun</th>
                    <th>Kategori</th>
                    <th style={{ width: 100 }}>Normal</th>
                    <th style={{ width: 80 }} className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(grouped[type] || []).map((acc, i) => (
                    <tr key={acc.code}>
                      <td style={{ color: 'var(--gray-400)' }}>{i + 1}</td>
                      <td><span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{acc.code}</span></td>
                      <td style={{ fontWeight: 500 }}>{acc.name}</td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{acc.category}</td>
                      <td>
                        <span className={`badge ${acc.normalBalance === 'debit' ? 'badge-success' : 'badge-danger'}`}>
                          {acc.normalBalance}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(acc)} title="Hapus" style={{ color: 'var(--danger)' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {(!grouped[type] || grouped[type].length === 0) && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 20 }}>Belum ada akun</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Akun Baru</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">❌ {error}</div>}

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">Kode Akun *</label>
                  <input type="text" className="form-input" placeholder="Contoh: 1-10006" value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Akun *</label>
                  <input type="text" className="form-input" placeholder="Contoh: Kas Kecil" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">Jenis Akun</label>
                  <select className="form-select" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                    {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}>
                    {(categoryMap[form.type] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Saldo Normal</label>
                <select className="form-select" value={form.normalBalance} onChange={e => setForm(prev => ({ ...prev, normalBalance: e.target.value }))}>
                  <option value="debit">Debit</option>
                  <option value="kredit">Kredit</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>✕ Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>💾 Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
