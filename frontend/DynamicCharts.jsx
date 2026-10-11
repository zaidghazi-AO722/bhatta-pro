import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Dynamic dashboard chart layer only.
 * - Animates when mounted.
 * - Accepts liveData from a parent/websocket/API.
 * - Falls back to a small demo stream when liveData is not supplied.
 * - Automatically switches gradient/tooltip styling with darkMode.
 */
export default function DynamicCharts({ liveData, darkMode = false }) {
  const [data, setData] = useState(() => liveData ?? demoData());

  useEffect(() => {
    if (liveData) setData(liveData);
  }, [liveData]);

  // Demo-only live updates. Remove this effect when the application supplies liveData.
  useEffect(() => {
    if (liveData) return undefined;
    const timer = setInterval(() => {
      setData((current) => {
        const next = current.slice(1);
        const last = current[current.length - 1];
        const value = Math.max(0, last.value + Math.round((Math.random() - 0.45) * 18));
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return [...next, { time, value }];
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [liveData]);

  const theme = useMemo(() => ({
    text: darkMode ? '#dbeafe' : '#334155',
    grid: darkMode ? 'rgba(148,163,184,.16)' : 'rgba(100,116,139,.14)',
    tooltipBg: darkMode ? 'rgba(15,23,42,.94)' : 'rgba(255,255,255,.94)',
    tooltipBorder: darkMode ? 'rgba(148,163,184,.25)' : 'rgba(148,163,184,.25)',
    gradientStart: darkMode ? '#60a5fa' : '#2563eb',
    gradientEnd: darkMode ? '#a78bfa' : '#7c3aed',
  }), [darkMode]);

  return (
    <div className="w-full rounded-3xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/30">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Live Activity</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Animated real-time dashboard metric</p>
        </div>
        <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="dashboardChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.gradientStart} stopOpacity={0.45} />
                <stop offset="100%" stopColor={theme.gradientEnd} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis dataKey="time" tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} width={38} />
            <Tooltip
              cursor={{ stroke: theme.gradientStart, strokeOpacity: 0.35 }}
              contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 14, backdropFilter: 'blur(12px)' }}
              labelStyle={{ color: theme.text }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.gradientStart}
              strokeWidth={3}
              fill="url(#dashboardChartGradient)"
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function demoData() {
  return [
    { time: '10:00', value: 42 },
    { time: '10:05', value: 55 },
    { time: '10:10', value: 49 },
    { time: '10:15', value: 72 },
    { time: '10:20', value: 66 },
    { time: '10:25', value: 84 },
    { time: '10:30', value: 78 },
    { time: '10:35', value: 93 },
  ];
}
