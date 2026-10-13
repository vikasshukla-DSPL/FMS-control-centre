import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { AdminDataProvider } from './AdminData.jsx';
import { ToastProvider } from './ui.jsx';
import Login from './Login.jsx';
import Shell from './Shell.jsx';
import Home from './pages/Home.jsx';
import FmsManager from './pages/FmsManager.jsx';
import Departments from './pages/Departments.jsx';
import CompanyEditor from './pages/CompanyEditor.jsx';
import Products from './pages/Products.jsx';
import PageText from './pages/PageText.jsx';
import Backup from './pages/Backup.jsx';
import './admin.css';

function RequireAuth() {
  const { status } = useAuth();
  if (status === 'checking') return <div className="boot" role="status"><span /> Checking sign in</div>;
  if (status === 'out') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

export default function AdminApp() {
  useEffect(() => {
    document.title = 'Dynemech MIS admin';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
      document.title = 'Dynemech | FMS Control Centre';
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminDataProvider><Shell /></AdminDataProvider>}>
              <Route index element={<Home />} />
              <Route path="fms" element={<FmsManager />} />
              <Route path="departments" element={<Departments />} />
              <Route path="company" element={<CompanyEditor />} />
              <Route path="products" element={<Products />} />
              <Route path="text" element={<PageText />} />
              <Route path="backup" element={<Backup />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
