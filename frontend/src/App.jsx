import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import LupaPin from './pages/LupaPin';
import Dashboard from './pages/Dashboard';
import CekBansos from './pages/CekBansos';
import Pengaduan from './pages/Pengaduan';
import DetailLaporan from './pages/DetailLaporan';
import Jadwal from './pages/Jadwal';
import Info from './pages/Info';
import Profil from './pages/Profil';
import AdminPortal from './admin/AdminPortal';

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;