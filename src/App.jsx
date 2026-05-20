import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import CompanySetup from './pages/CompanySetup';
import OpeningBalance from './pages/OpeningBalance';
import JournalEntry from './pages/JournalEntry';
import BalanceSheet from './pages/BalanceSheet';
import IncomeStatement from './pages/IncomeStatement';
import CashFlow from './pages/CashFlow';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--content-bg)',
      gap: '16px',
    }}>
      <div style={{ fontSize: '48px' }}>📊</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-700)' }}>
        Memuat data...
      </div>
      <div style={{
        width: '200px',
        height: '4px',
        background: 'var(--gray-200)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, var(--primary-400), var(--primary-600))',
          borderRadius: '4px',
          animation: 'loadingBar 1.2s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useApp();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/perusahaan" replace />} />
        <Route path="perusahaan" element={<CompanySetup />} />
        <Route path="saldo-awal" element={<OpeningBalance />} />
        <Route path="jurnal" element={<JournalEntry />} />
        <Route path="laporan/neraca" element={<BalanceSheet />} />
        <Route path="laporan/laba-rugi" element={<IncomeStatement />} />
        <Route path="laporan/arus-kas" element={<CashFlow />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
