import { Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLogin from '../pages/admin/AdminLogin';
import { adminAuthService } from '../services/admin/adminAuth';

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
      <Route index element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}
