/* Tiny synchronous initialization prevents a theme flash. Storage may be blocked. */
try {
  const theme=localStorage.getItem('invariant:theme');
  if(theme==='dark'||theme==='light') document.documentElement.dataset.theme=theme;
} catch { /* The default theme remains fully usable. */ }
