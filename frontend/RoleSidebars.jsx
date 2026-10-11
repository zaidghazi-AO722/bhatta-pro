import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  ScrollText,
  DatabaseBackup,
  Wrench,
  Store,
  Users,
  ReceiptText,
  FilePenLine,
  HardDriveDownload,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react';

const superAdminItems = [
  { label: 'Tenant Management', icon: Building2 },
  { label: 'License Matrix', icon: CreditCard },
  { label: 'System Logs', icon: ScrollText },
  { label: 'Server Backups', icon: DatabaseBackup },
  { label: 'Maintenance Mode', icon: Wrench },
];

const ownerItems = [
  { label: 'Store Setup', icon: Store },
  { label: 'Staff Accounts', icon: Users },
  { label: 'Tax Settings', icon: ReceiptText },
  { label: 'Invoice Customizer', icon: FilePenLine },
  { label: 'Local Backup', icon: HardDriveDownload },
];

function Sidebar({ role, items, activeItem, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);
  const isSuperAdmin = role === 'Super Admin';

  return (
    <aside
      className={`relative flex min-h-screen flex-col border-r border-white/10 bg-slate-950 text-slate-100 shadow-2xl transition-all duration-300 ${
        collapsed ? 'w-[84px]' : 'w-[280px]'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_38%)] pointer-events-none" />

      <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-5">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/20 ring-1 ring-blue-400/30">
              <ShieldCheck className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Bhatta System</p>
              <p className="text-xs text-slate-400">{isSuperAdmin ? 'Platform Control' : 'Business Control'}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <div className="relative px-4 pt-5">
        {!collapsed && (
          <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {isSuperAdmin ? 'System Administration' : 'Business Administration'}
          </div>
        )}
        <nav className="space-y-1.5">
          {items.map(({ label, icon: Icon }) => {
            const active = activeItem === label;
            return (
              <button
                key={label}
                onClick={() => onSelect(label)}
                title={collapsed ? label : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-[19px] w-[19px] shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative mt-auto border-t border-white/10 p-4">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ShieldCheck size={15} className="text-emerald-400" />
              {isSuperAdmin ? 'Master access' : 'Tenant protected'}
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              {isSuperAdmin
                ? 'Platform-wide controls only.'
                : 'Business settings stay inside this tenant.'}
            </p>
          </div>
        )}
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
          <Settings size={18} />
          {!collapsed && 'Account Settings'}
        </button>
        <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-300">
          <LogOut size={18} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}

export function SuperAdminSidebar(props) {
  return <Sidebar role="Super Admin" items={superAdminItems} {...props} />;
}

export function BusinessOwnerSidebar(props) {
  return <Sidebar role="Business Owner" items={ownerItems} {...props} />;
}

export default function RoleSidebarsPreview() {
  const [activeSuper, setActiveSuper] = useState('Tenant Management');
  const [activeOwner, setActiveOwner] = useState('Store Setup');

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 p-4">
            <p className="text-sm font-semibold">Layout 1</p>
            <p className="text-xs text-slate-500">Super Admin Panel</p>
          </div>
          <div className="h-[620px] overflow-hidden">
            <SuperAdminSidebar activeItem={activeSuper} onSelect={setActiveSuper} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 p-4">
            <p className="text-sm font-semibold">Layout 2</p>
            <p className="text-xs text-slate-500">Business Owner Panel</p>
          </div>
          <div className="h-[620px] overflow-hidden">
            <BusinessOwnerSidebar activeItem={activeOwner} onSelect={setActiveOwner} />
          </div>
        </section>
      </div>
    </div>
  );
}
