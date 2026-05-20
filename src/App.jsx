import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import CompanySetup from './pages/CompanySetup';
import OpeningBalance from './pages/OpeningBalance';
import JournalEntry from './pages/JournalEntry';
import BalanceSheet from './pages/BalanceSheet';
import IncomeStatement from './pages/IncomeStatement';
import CashFlow from './pages/CashFlow';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
