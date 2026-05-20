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
    dispatch({ type: 'SET_COMPANY', payload: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
      </div>
    </>
  );
}
