import React, { useEffect, useMemo, useState } from 'react';

/**
 * Premium SaaS dashboard presentation layer only.
 * Does not alter authentication, RBAC, tenant isolation, or business logic.
 */
export default function PremiumDashboard({ role = 'OWNER', userName = 'User' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const nav = useMemo(() => role === 'OWNER'
    ? ['Overview', 'Store Setup', 'Staff Accounts', 'Tax Settings', 'Invoices']
    : role === 'MANAGER'
      ? ['Overview', 'Operations', 'Sales', 'Inventory', 'Reports']
      : ['POS', 'New Sale', 'Customers', 'Transactions'],
  [role]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Dynamic background graphics */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 animate-pulse rounded-full bg-violet-500/10 blur-3xl [animation-delay:700ms]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-pulse rounded-full bg-blue-500/10 blur-3xl [animation-delay:1200ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Animated glass sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} hidden shrink-0 border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl transition-[width] duration-500 ease-out md:flex md:flex-col`}>
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-cyan-500/10">◆</div>
            {sidebarOpen && <div className="min-w-0"><div className="font-semibold tracking-wide">Bhatta OS</div><div className="text-xs text-slate-400">{role} workspace</div></div>}
          </div>
          <nav className="flex-1 space-y-2 p-3">
            {nav.map((item, i) => (
              <button key={item} className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/5 ${i === 0 ? 'border-white/15 bg-white/10' : 'border-transparent text-slate-400'}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-cyan-300 transition-transform duration-300 group-hover:scale-110">{i + 1}</span>
                {sidebarOpen && <span className="truncate">{item}</span>}
              </button>
            ))}
          </nav>
          <div className="border-t border-white/10 p-3">
            <button className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10">
              {sidebarOpen ? <><div className="text-sm font-medium">{userName}</div><div className="text-xs text-slate-400">Secure session</div></> : <span className="text-sm">●</span>}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 backdrop-blur-2xl sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(v => !v)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 active:scale-95 md:hidden">☰</button>
              <div><div className="text-sm text-slate-400">Workspace</div><h1 className="text-xl font-semibold">{role === 'OWNER' ? 'Business Dashboard' : `${role} Dashboard`}</h1></div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">● Secure</span>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-95">Profile</button>
            </div>
          </header>

          <section className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            {loading ? <SkeletonDashboard /> : <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {['Total Sales', 'Inventory', 'Customers', 'Net Balance'].map((label, i) => (
                  <div key={label} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                    <div className="text-sm text-slate-400">{label}</div><div className="mt-3 text-2xl font-semibold">{['Rs 1.24M', '48,920', '1,284', 'Rs 682K'][i]}</div>
                    <div className="mt-2 text-xs text-emerald-300">+{[12, 8, 14, 6][i]}% from last period</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
                  <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Performance</h2><p className="text-xs text-slate-400">Dynamic activity overview</p></div><button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10">Last 30 days</button></div>
                  <div className="flex h-56 items-end gap-2 rounded-2xl bg-black/10 p-4">
                    {[38,55,42,72,64,84,58,92,76,88,70,96,81,100,87,94,72,90,78,98].map((h, i) => <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-400/20 to-cyan-300/80 transition-all duration-500 hover:from-violet-400/40 hover:to-violet-300" style={{ height: `${h}%` }} />)}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
                  <h2 className="font-semibold">Quick Actions</h2><p className="mt-1 text-xs text-slate-400">Role-controlled shortcuts</p>
                  <div className="mt-5 space-y-3">{['Create entry', 'View reports', 'Manage settings'].map(a => <button key={a} className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/10 hover:shadow-xl"><span>{a}</span><span className="transition-transform group-hover:translate-x-1">→</span></button>)}</div>
                </div>
              </div>
            </>}
          </section>
        </main>
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-3xl border border-white/10 bg-white/[0.06]" />)}</div>
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><div className="h-80 rounded-3xl border border-white/10 bg-white/[0.06]" /><div className="h-80 rounded-3xl border border-white/10 bg-white/[0.06]" /></div>
  </div>;
}
