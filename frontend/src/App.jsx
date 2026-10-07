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
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Profil from './pages/Profil';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return Boolean(localStorage.getItem('token') || localStorage.getItem('access_token'));
}

function isAdminAuthenticated() {
  const user = getCurrentUser();
  return isAuthenticated() && user?.role === 'admin';
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return getCurrentUser()?.role === 'admin' ? <Navigate to="/admin" replace /> : children;
}

function ProtectedAdminRoute({ children }) {
  return isAdminAuthenticated() ? children : <Navigate to="/admin/login" replace />;
}

function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to={getCurrentUser()?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : children;
}

function AdminLoginRoute() {
  return isAdminAuthenticated() ? <Navigate to="/admin" replace /> : <AdminLogin />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/lupa-pin" element={<PublicRoute><LupaPin /></PublicRoute>} />
      <Route path="/admin/login" element={<AdminLoginRoute />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
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