import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function CompanySetup() {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [saved, setSaved] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (state.company.name) {
      setForm(state.company);
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_COMPANY', payload: { ...form, id: state.company.id } });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetAll = async () => {
    setResetting(true);
    await dispatch({ type: 'RESET_ALL' });
    setForm({ name: '', address: '', phone: '', email: '' });
    setShowResetModal(false);
    setResetting(false);
    window.location.reload();
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Informasi Perusahaan</h1>
          <div className="subtitle">Atur data perusahaan Anda</div>
        </div>
      </div>
      <div className="content-body">
        {saved && (
          <div className="alert alert-success">
            ✅ Data perusahaan berhasil disimpan!
          </div>
        )}

        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header">
            <h2>Data Perusahaan</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Nama Perusahaan *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Contoh: PT Maju Bersama"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat</label>
                <textarea
                  name="address"
                  className="form-input form-textarea"
                  placeholder="Alamat lengkap perusahaan"
                  value={form.address}
                  onChange={handleChange}
                  style={{ minHeight: 80 }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nomor Telepon</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="08xxxxxxxxxx"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="email@perusahaan.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button type="submit" className="btn btn-primary btn-lg">
                💾 Simpan
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        {state.company.id && (
          <div className="card" style={{ maxWidth: 640, marginTop: 24, borderColor: 'var(--danger)' }}>
            <div className="card-header" style={{ borderBottomColor: '#fee2e2' }}>
              <h2 style={{ color: 'var(--danger)' }}>⚠️ Zona Berbahaya</h2>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 16 }}>
                Menghapus semua data akan menghilangkan <strong>data perusahaan, saldo awal, dan semua jurnal</strong> secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
              </p>
              <button
                className="btn btn-danger"
                onClick={() => setShowResetModal(true)}
              >
                🗑️ Hapus Semua Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>⚠️ Konfirmasi Hapus</h3>
              <button className="btn btn-ghost" onClick={() => setShowResetModal(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                ❌ Peringatan: Semua data akan dihapus permanen!
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 8 }}>
                Data yang akan dihapus:
              </p>
              <ul style={{ fontSize: '0.875rem', color: 'var(--gray-700)', paddingLeft: 20, marginBottom: 16 }}>
                <li>Data perusahaan</li>
                <li>Semua saldo awal ({Object.keys(state.openingBalances).length} akun)</li>
                <li>Semua jurnal ({state.journals.length} transaksi)</li>
              </ul>
              <p style={{ fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 600 }}>
                Apakah Anda yakin ingin melanjutkan?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)} disabled={resetting}>
                ✕ Batal
              </button>
              <button className="btn btn-danger" onClick={handleResetAll} disabled={resetting}>
                {resetting ? '⏳ Menghapus...' : '🗑️ Ya, Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
