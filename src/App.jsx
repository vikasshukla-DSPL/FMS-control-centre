import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Overview from './pages/Overview.jsx';
import Registry from './pages/Registry.jsx';
import Company from './pages/Company.jsx';
import { DataProvider } from './context/DataContext.jsx';

// The admin panel is a separate bundle: visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function PublicSite() {
  return (
    <DataProvider>
      <div className="app-shell">
        <ScrollToTop />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/company" element={<Company />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </DataProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="boot" role="status"><span /> Loading admin</div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<PublicSite />} />
    </Routes>
  );
}
