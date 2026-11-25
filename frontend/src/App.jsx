import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CompanyProvider } from './context/CompanyContext.jsx';
import { ReceiptDraftProvider } from './context/ReceiptDraftContext.jsx';
import GenerateReceiptPage from './pages/GenerateReceiptPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ReceiptDetailPage from './pages/ReceiptDetailPage.jsx';
import ReceiptPreviewPage from './pages/ReceiptPreviewPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-codenap-canvas print:block print:min-h-0 print:bg-white">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col print:block">
          <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:py-6 print:m-0 print:max-w-none print:p-0">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <ReceiptDraftProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <AuthenticatedLayout>
                    <GenerateReceiptPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/generate"
                element={
                  <AuthenticatedLayout>
                    <GenerateReceiptPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/preview"
                element={
                  <AuthenticatedLayout>
                    <ReceiptPreviewPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/history"
                element={
                  <AuthenticatedLayout>
                    <HistoryPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/receipts/:id"
                element={
                  <AuthenticatedLayout>
                    <ReceiptDetailPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <AuthenticatedLayout>
                    <SettingsPage />
                  </AuthenticatedLayout>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ReceiptDraftProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
