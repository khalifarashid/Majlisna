import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { I18nProvider } from './i18n/I18nProvider';
import { StoreProvider, useStore } from './store/StoreProvider';
import { ToastProvider } from './components/Toasts';
import { AppHeader, PrototypeFooter, roleFromPath } from './components/AppHeader';
import { Landing } from './views/Landing';
import { ResidentApp } from './views/resident/ResidentApp';
import { StaffDashboard } from './views/staff/StaffDashboard';
import { VendorPortal } from './views/vendor/VendorPortal';
import { BusinessDashboard } from './views/business/BusinessDashboard';
import { SettingsPage } from './views/Settings';

function Shell({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();
  const { state, dispatch } = useStore();
  // Keep the stored role in step with the URL, so a shared link opens the right view.
  useEffect(() => {
    const r = roleFromPath(pathname);
    if (r && r !== state.role) dispatch({ type: 'setRole', role: r });
  }, [pathname, state.role, dispatch]);
  const section = pathname.split('/')[1];
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main>{children ?? <Outlet />}</main>
      <PrototypeFooter />
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <ToastProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route element={<Shell />}>
                <Route path="/r/*" element={<ResidentApp />} />
                <Route path="/staff" element={<StaffDashboard />} />
                <Route path="/vendor" element={<VendorPortal />} />
                <Route path="/business" element={<BusinessDashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </StoreProvider>
    </I18nProvider>
  );
}
