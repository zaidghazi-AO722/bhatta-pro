# Dynamic Dashboard Charts

This file adds only the requested dynamic chart layer. It uses Recharts and does not modify the existing dashboard, backend, RBAC, tenant isolation, or security code.

## Install

```bash
npm install recharts
```

## Use

```jsx
import DynamicCharts from './DynamicCharts';

<DynamicCharts darkMode={isDarkMode} liveData={liveData} />
```

`liveData` should be an array such as:

```js
[
  { time: '10:00', value: 42 },
  { time: '10:05', value: 55 },
]
```

When `liveData` is supplied, the component renders the latest data supplied by the parent. Connect that prop to an existing WebSocket, SSE stream, or API polling layer for production real-time updates.

When `liveData` is omitted, a small local demo stream updates every three seconds so the animation can be previewed without changing application data.
