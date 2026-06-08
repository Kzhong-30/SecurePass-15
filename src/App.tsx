import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UnlockPage from '@/pages/UnlockPage';
import VaultPage from '@/pages/VaultPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UnlockPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
