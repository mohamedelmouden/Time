const c = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { bg: c('bg'), bg2: c('bg2'), card: c('card'), tx: c('tx'), tx2: c('tx2'), track: c('track'), line: c('line'), flame: '#FF8A32', gold: '#FFC15A', ok: '#43C982', bad: '#EF6464' } } },
};
