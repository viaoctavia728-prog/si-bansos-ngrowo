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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lupa-pin" element={<LupaPin />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cek-bansos" element={<CekBansos />} />
      <Route path="/pengaduan" element={<Pengaduan />} />
      <Route path="/detail-laporan" element={<DetailLaporan />} />
      <Route path="/tracking" element={<DetailLaporan />} />
      <Route path="/jadwal" element={<Jadwal />} />
      <Route path="/info" element={<Navigate to="/jadwal" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;