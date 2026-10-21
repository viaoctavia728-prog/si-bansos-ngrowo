import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Halaman Khusus Warga (Modular)
import Login from './pages/warga/Login';
import Register from './pages/warga/Register';
import LupaPin from './pages/warga/LupaPin';
import Dashboard from './pages/warga/Dashboard';
import CekBansos from './pages/warga/CekBansos';
import Pengaduan from './pages/warga/Pengaduan';
import DetailLaporan from './pages/warga/DetailLaporan';
import Jadwal from './pages/warga/Jadwal';
import Info from './pages/warga/Info';
import Profil from './pages/warga/Profil';

// Halaman & Portal Admin (Modular)
import AdminPortal from './pages/admin/AdminPortal';

function getCitizenUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isCitizenAuthenticated() {
  const user = getCitizenUser();
  const token = localStorage.getItem('citizen_access_token')
    || localStorage.getItem('token')
    || localStorage.getItem('access_token');
  return Boolean(token && (user?.role === 'user' || user?.role === 'warga'));
}

function ProtectedRoute({ children }) {
  return isCitizenAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  return isCitizenAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/lupa-pin" element={<PublicRoute><LupaPin /></PublicRoute>} />
      <Route path="/admin/*" element={<AdminPortal />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
      <Route path="/cek-bansos" element={<ProtectedRoute><CekBansos /></ProtectedRoute>} />
      <Route path="/pengaduan" element={<ProtectedRoute><Pengaduan /></ProtectedRoute>} />
      <Route path="/detail-laporan" element={<ProtectedRoute><DetailLaporan /></ProtectedRoute>} />
      <Route path="/tracking" element={<ProtectedRoute><DetailLaporan /></ProtectedRoute>} />
      <Route path="/jadwal" element={<ProtectedRoute><Jadwal /></ProtectedRoute>} />
      <Route path="/info" element={<ProtectedRoute><Info /></ProtectedRoute>} />
      <Route path="/info-bansos" element={<Info />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;