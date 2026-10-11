import React, { useEffect, useMemo, useState } from 'react';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17) % 100}%`,
  top: `${(i * 29) % 100}%`,
  delay: `${(i % 6) * 0.45}s`,
  duration: `${5 + (i % 5)}s`,
}));

function InlineLottie({ state }) {
  const success = state === 'success';
  return (
    <div className={`lottie-state ${success ? 'is-success' : 'is-error'}`} aria-label={success ? 'Success' : 'Error'}>
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <circle className="lottie-ring" cx="32" cy="32" r="24" />
        {success ? <path className="lottie-mark" d="M20 33l8 8 17-18" /> : <path className="lottie-mark" d="M23 23l18 18M41 23L23 41" />}
      </svg>
    </div>
  );
}

export function VisualMicroInteractions({ metrics = [], status = 'success', darkMode = false }) {
  const [active, setActive] = useState(0);
  const safeMetrics = useMemo(() => metrics.length ? metrics : [
    { label: 'System Health', value: '98%', detail: 'Operational' },
    { label: 'Active Users', value: '1,248', detail: 'Live now' },
    { label: 'Requests', value: '8.4K', detail: 'Last hour' },
  ], [metrics]);

  useEffect(() => {
    const timer = setInterval(() => setActive((v) => (v + 1) % safeMetrics.length), 3200);
    return () => clearInterval(timer);
  }, [safeMetrics.length]);

  return (
    <section className={`visual-dashboard ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="particle-field" aria-hidden="true">
        {PARTICLES.map((p) => <span key={p.id} style={p} />)}
      </div>

      <div className="status-card glass-panel">
        <InlineLottie state={status === 'error' ? 'error' : 'success'} />
        <div><strong>{status === 'error' ? 'Action needs attention' : 'All systems operational'}</strong><small>Live security and platform status</small></div>
      </div>

      <div className="metric-grid">
        {safeMetrics.map((metric, index) => (
          <button
            type="button"
            key={`${metric.label}-${index}`}
            className={`metric-card glass-panel ${index === active ? 'metric-active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
          >
            <span className="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14" /></svg></span>
            <span className="metric-copy"><small>{metric.label}</small><strong>{metric.value}</strong><em>{metric.detail}</em></span>
            <span className="metric-arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default VisualMicroInteractions;
