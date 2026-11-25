import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  History,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext.jsx';

const NAV_GROUPS = [
  {
    label: 'Payroll Operations',
    items: [
      {
        to: '/',
        label: 'Generate Receipt',
        icon: FilePlus2,
        match: (pathname) => pathname === '/' || pathname === '/generate',
      },
      {
        to: '/preview',
        label: 'Receipt Preview',
        icon: FileText,
        match: (pathname) => pathname === '/preview',
      },
      {
        to: '/history',
        label: 'Receipt History',
        icon: History,
        match: (pathname) =>
          pathname === '/history' || pathname.startsWith('/receipts/'),
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        to: '/settings',
        label: 'Company & Branding',
        icon: Building2,
        match: (pathname) => pathname === '/settings',
      },
    ],
  },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) {
  const location = useLocation();
  const { company, logoSrc } = useCompany();

  function renderNavContent(isCompact) {
    return (
      <div className="flex h-full flex-col bg-white">
        {/* Brand Header */}
        <div
          className={`flex h-14 shrink-0 items-center border-b border-codenap-border px-3 ${
            isCompact ? 'justify-center' : 'justify-between gap-2.5'
          }`}
        >
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex min-w-0 items-center gap-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-codenap-borderStrong bg-codenap-navy text-xs font-bold tracking-wider text-white">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${company.companyName} logo`}
                  className="h-full w-full bg-white object-contain p-0.5"
                />
              ) : (
                'CN'
              )}
            </div>
            {!isCompact ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-codenap-navy">
                  Codenap Admin
                </p>
                <p className="truncate text-[11px] font-medium text-slate-500">
                  Payroll &amp; Receipts
                </p>
              </div>
            ) : null}
          </NavLink>

          {!isCompact ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation drawer"
              className="rounded-md p-1 text-slate-400 hover:bg-codenap-tint hover:text-codenap-navy lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!isCompact ? (
                <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.match(location.pathname);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onCloseMobile}
                      title={isCompact ? item.label : undefined}
                      className={`group relative flex items-center rounded-md text-[13px] font-medium transition ${
                        isCompact
                          ? 'justify-center px-2 py-2.5'
                          : 'gap-2.5 px-2.5 py-2'
                      } ${
                        active
                          ? 'bg-codenap-tint font-semibold text-codenap-navy'
                          : 'text-slate-600 hover:bg-codenap-subtle hover:text-codenap-navy'
                      }`}
                    >
                      {active ? (
                        <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-codenap-navy" />
                      ) : null}
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active
                            ? 'text-codenap-navy'
                            : 'text-slate-400 group-hover:text-codenap-steel'
                        }`}
                      />
                      {!isCompact ? (
                        <span className="truncate">{item.label}</span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Collapse Control */}
        <div className="border-t border-codenap-border p-2.5">
          {!isCompact ? (
            <div className="mb-2 rounded-md border border-codenap-border bg-codenap-subtle px-2.5 py-2">
              <p className="truncate text-[11px] font-semibold text-codenap-navy">
                {company.companyName || 'Codenap IT Services Pvt. Ltd.'}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                Prefix: {company.receiptPrefix || 'CNP'} &bull; INR
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden w-full items-center justify-center gap-2 rounded-md border border-codenap-border bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-codenap-subtle hover:text-codenap-navy lg:flex"
          >
            {isCompact ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`no-print hidden shrink-0 border-r border-codenap-border bg-white transition-all duration-200 lg:block print:hidden ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderNavContent(collapsed)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen ? (
        <div className="no-print fixed inset-0 z-40 flex lg:hidden print:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-64 border-r border-codenap-border bg-white">
            {renderNavContent(false)}
          </aside>
        </div>
      ) : null}
    </>
  );
}
