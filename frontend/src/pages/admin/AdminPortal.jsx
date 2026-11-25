import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import { adminAuthService } from '../../services/admin/adminAuth';
import AdminLayout from './AdminLayout';
import AdminOverview from './AdminOverview';
import AdminPengaduan from './AdminPengaduan';
import AdminWarga from './AdminWarga';
import AdminAuditLog from './AdminAuditLog';
import AdminPenerima from './AdminPenerima';
import AdminJadwal from './AdminJadwal';

function AdminLoginRoute() {
  return adminAuthService.isAuthenticated()
    ? <Navigate to="/admin" replace />
    : <AdminLogin />;
}

function ProtectedAdminRoute({ children }) {
  return adminAuthService.isAuthenticated()
    ? children
    : <Navigate to="/admin/login" replace />;
}

export default function AdminPortal() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginRoute />} />
      <Route
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="dashboard" element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="pengaduan" element={<AdminPengaduan />} />
        <Route path="warga" element={<AdminWarga />} />
        <Route path="penerima" element={<AdminPenerima />} />
        <Route path="jadwal" element={<AdminJadwal />} />
        <Route path="notifikasi" element={<Navigate to="/admin/jadwal#broadcast" replace />} />
        <Route path="notifications" element={<Navigate to="/admin/jadwal#broadcast" replace />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
        <Route path="audit-logs" element={<AdminAuditLog />} />
        <Route path="profil" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="profile" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
