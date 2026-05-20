import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatNumberInput, parseFormattedNumber, generateId, formatDate } from '../utils/accounting';

const emptyEntry = () => ({ id: generateId(), accountCode: '', debit: 0, kredit: 0 });

const emptyJournal = () => ({
  id: generateId(),
  date: new Date().toISOString().split('T')[0],
  description: '',
  entries: [emptyEntry(), emptyEntry()],
});

export default function JournalEntry() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [form, setForm] = useState(emptyJournal());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openAddModal = () => {
    setForm(emptyJournal());
    setEditingJournal(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (journal) => {
    setForm({ ...journal, entries: journal.entries.map(e => ({ ...e })) });
    setEditingJournal(journal.id);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingJournal(null);
    setError('');
  };

  const addEntry = () => {
    setForm(prev => ({ ...prev, entries: [...prev.entries, emptyEntry()] }));
  };

  const removeEntry = (entryId) => {
    if (form.entries.length <= 2) return;
    setForm(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== entryId) }));
  };

  const updateEntry = (entryId, field, value) => {
    setForm(prev => ({
      ...prev,
      entries: prev.entries.map(e =>
        e.id === entryId ? { ...e, [field]: field === 'accountCode' ? value : parseFormattedNumber(value) } : e
      ),
    }));
  };

  const totalDebit = form.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalKredit = form.entries.reduce((sum, e) => sum + (e.kredit || 0), 0);

  const handleSave = () => {
    if (!form.date) { setError('Tanggal harus diisi'); return; }
    if (!form.description.trim()) { setError('Keterangan harus diisi'); return; }
    
    const validEntries = form.entries.filter(e => e.accountCode && (e.debit > 0 || e.kredit > 0));
    if (validEntries.length < 2) { setError('Minimal 2 baris jurnal dengan akun dan nominal'); return; }
    if (totalDebit !== totalKredit) { setError('Total Debit dan Kredit harus seimbang'); return; }
    if (totalDebit === 0) { setError('Total Debit/Kredit tidak boleh 0'); return; }

    const journalData = { ...form, entries: validEntries };

    if (editingJournal) {
      dispatch({ type: 'UPDATE_JOURNAL', payload: journalData });
      setSuccess('Jurnal berhasil diperbarui!');
    } else {
      dispatch({ type: 'ADD_JOURNAL', payload: journalData });
      setSuccess('Jurnal berhasil disimpan!');
    }

    closeModal();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
      dispatch({ type: 'DELETE_JOURNAL', payload: id });
      setSuccess('Jurnal berhasil dihapus');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Jurnal Umum</h1>
          <div className="subtitle">Catat semua transaksi keuangan perusahaan</div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Buat Jurnal Baru
        </button>
      </div>

      <div className="content-body">
        {success && <div className="alert alert-success">✅ {success}</div>}

        {state.journals.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Belum Ada Jurnal</h3>
              <p>Mulai catat transaksi keuangan perusahaan Anda</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                + Buat Jurnal Baru
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2>Daftar Jurnal ({state.journals.length} transaksi)</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th style={{ width: 120 }}>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Akun</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Kredit</th>
                    <th style={{ width: 100 }} className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {[...state.journals].sort((a, b) => a.date.localeCompare(b.date)).map((journal, idx) => (
                    journal.entries.map((entry, eIdx) => {
                      const account = state.accounts.find(a => a.code === entry.accountCode);
                      return (
                        <tr key={`${journal.id}-${eIdx}`}>
                          {eIdx === 0 && (
                            <>
                              <td rowSpan={journal.entries.length} style={{ verticalAlign: 'top', color: 'var(--gray-400)' }}>{idx + 1}</td>
                              <td rowSpan={journal.entries.length} style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>{formatDate(journal.date)}</td>
                              <td rowSpan={journal.entries.length} style={{ verticalAlign: 'top' }}>{journal.description}</td>
                            </>
                          )}
                          <td>
                            <span style={{ color: 'var(--gray-400)', marginRight: 4, fontSize: '0.8rem' }}>{entry.accountCode}</span>
                            {account?.name || '-'}
                          </td>
                          <td className="number">{entry.debit ? formatRupiah(entry.debit) : '-'}</td>
                          <td className="number">{entry.kredit ? formatRupiah(entry.kredit) : '-'}</td>
                          {eIdx === 0 && (
                            <td rowSpan={journal.entries.length} style={{ verticalAlign: 'top', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(journal)} title="Edit">✏️</button>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(journal.id)} title="Hapus" style={{ color: 'var(--danger)' }}>🗑️</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingJournal ? 'Edit Jurnal' : 'Buat Jurnal Baru'}</h3>
              <button className="btn btn-ghost" onClick={closeModal} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">❌ {error}</div>}

              <div className="form-row" style={{ marginBottom: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tanggal</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Keterangan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Deskripsi transaksi"
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Detail Jurnal</label>
              </div>

              {form.entries.map((entry, i) => (
                <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 36px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <select
                    className="form-select"
                    value={entry.accountCode}
                    onChange={e => updateEntry(entry.id, 'accountCode', e.target.value)}
                  >
                    <option value="">Pilih akun</option>
                    {state.accounts.map(acc => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Debit"
                    style={{ textAlign: 'right' }}
                    value={entry.debit ? formatNumberInput(entry.debit) : ''}
                    onChange={e => updateEntry(entry.id, 'debit', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Kredit"
                    style={{ textAlign: 'right' }}
                    value={entry.kredit ? formatNumberInput(entry.kredit) : ''}
                    onChange={e => updateEntry(entry.id, 'kredit', e.target.value)}
                  />
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => removeEntry(entry.id)}
                    style={{ color: form.entries.length > 2 ? 'var(--danger)' : 'var(--gray-300)' }}
                    disabled={form.entries.length <= 2}
                  >
                    🗑️
                  </button>
                </div>
              ))}

              <button className="btn btn-secondary btn-sm" onClick={addEntry} style={{ marginTop: 8 }}>
                + Tambah Baris
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--gray-200)', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--gray-500)', marginRight: 8 }}>Total Debit:</span>
                  <strong>{formatRupiah(totalDebit)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', marginRight: 8 }}>Total Kredit:</span>
                  <strong>{formatRupiah(totalKredit)}</strong>
                </div>
              </div>

              {totalDebit > 0 && totalKredit > 0 && totalDebit !== totalKredit && (
                <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                  ⚠️ Selisih: {formatRupiah(Math.abs(totalDebit - totalKredit))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>✕ Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
