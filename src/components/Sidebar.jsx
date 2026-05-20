import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

export default function Sidebar() {
  const { state } = useApp();
  const location = useLocation();
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith('/laporan'));

  const isReportActive = location.pathname.startsWith('/laporan');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📊</div>
        <div>
          <div className="logo-text">AkuntansiApp</div>
          <div className="logo-subtext">Sistem Akuntansi</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu Utama</div>

        <NavLink to="/perusahaan" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="icon">🏢</span>
          <span>Informasi Perusahaan</span>
        </NavLink>

        <NavLink to="/saldo-awal" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="icon">💰</span>
          <span>Saldo Awal</span>
        </NavLink>

        <NavLink to="/jurnal" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="icon">📝</span>
          <span>Jurnal Umum</span>
        </NavLink>

        <div className="sidebar-section-label">Laporan Keuangan</div>

        <button
          className={`sidebar-item ${isReportActive ? 'active' : ''}`}
          onClick={() => setReportsOpen(!reportsOpen)}
          style={{ width: '100%' }}
        >
          <span className="icon">📊</span>
          <span>Laporan</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', transition: 'transform 0.2s', transform: reportsOpen ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
        </button>

        {reportsOpen && (
          <div className="sidebar-sub-items">
            <NavLink to="/laporan/neraca" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span className="icon">📋</span>
              <span>Neraca</span>
            </NavLink>
            <NavLink to="/laporan/laba-rugi" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span className="icon">📈</span>
              <span>Laba Rugi</span>
            </NavLink>
            <NavLink to="/laporan/arus-kas" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span className="icon">💵</span>
              <span>Arus Kas</span>
            </NavLink>
          </div>
        )}
      </nav>

      {state.company.name && (
        <div className="sidebar-footer">
          <div className="sidebar-company">
            <div className="company-avatar">
              {state.company.name.charAt(0).toUpperCase()}
            </div>
            <div className="company-name">{state.company.name}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
