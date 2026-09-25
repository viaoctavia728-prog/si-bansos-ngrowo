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
import { getCurrentUser } from './api';

function ProtectedRoute({ children }) {
  return getCurrentUser() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lupa-pin" element={<LupaPin />} />
      <Route path="/beranda" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<Navigate to="/beranda" replace />} />
      <Route path="/cek-bansos" element={<ProtectedRoute><CekBansos /></ProtectedRoute>} />
      <Route path="/pengaduan" element={<ProtectedRoute><Pengaduan /></ProtectedRoute>} />
      <Route path="/detail-laporan" element={<ProtectedRoute><DetailLaporan /></ProtectedRoute>} />
      <Route path="/tracking" element={<ProtectedRoute><DetailLaporan /></ProtectedRoute>} />
      <Route path="/jadwal" element={<ProtectedRoute><Jadwal /></ProtectedRoute>} />
      <Route path="/info" element={<Navigate to="/jadwal" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;