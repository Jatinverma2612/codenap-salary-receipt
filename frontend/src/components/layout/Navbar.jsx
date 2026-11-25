import { LogOut, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function resolveHeaderMeta(pathname) {
  if (pathname === '/' || pathname === '/generate') {
    return {
      section: 'Payroll Operations',
      title: 'Generate Receipt',
    };
  }
  if (pathname === '/preview') {
    return {
      section: 'Payroll Operations',
      title: 'Receipt Preview',
    };
  }
  if (pathname === '/history') {
    return {
      section: 'Payroll Operations',
      title: 'Receipt History',
    };
  }
  if (pathname.startsWith('/receipts/')) {
    return {
      section: 'Receipt History',
      title: 'Receipt Detail',
    };
  }
  if (pathname === '/settings') {
    return {
      section: 'Administration',
      title: 'Company & Branding',
    };
  }
  return {
    section: 'Workspace',
    title: 'Admin Portal',
  };
}

function getInitials(name) {
  if (!name) {
    return 'AD';
  }
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'AD';
}

export default function Navbar({ onOpenMobileMenu }) {
  const location = useLocation();
  const { user, logoutUser } = useAuth();
  const meta = resolveHeaderMeta(location.pathname);

  return (
    <header className="no-print sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-codenap-border bg-white px-4 sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded-md border border-codenap-border bg-white p-1.5 text-slate-600 hover:bg-codenap-subtle hover:text-codenap-navy lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span className="hidden sm:inline">{meta.section}</span>
            <span className="hidden sm:inline">/</span>
            <span className="truncate text-slate-500">{meta.title}</span>
          </div>
          <h1 className="truncate text-sm font-bold text-codenap-navy sm:text-base">
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-codenap-tint text-[11px] font-bold text-codenap-navy">
            {getInitials(user?.name)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-slate-800">
              {user?.name}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
              {user?.role}
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-codenap-border" />

        <button
          type="button"
          onClick={logoutUser}
          className="inline-flex items-center gap-1.5 rounded-md border border-codenap-borderStrong bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
