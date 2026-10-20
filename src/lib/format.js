// Time formatting helpers. All inputs are milliseconds.

const pad = (n) => String(n).padStart(2, '0');

/** "m:ss.t" (or "h:mm:ss.t" past an hour), used for totals. */
export function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  const mm = h > 0 ? pad(m) : String(m);
  return `${h > 0 ? h + ':' : ''}${mm}:${pad(s)}.${tenths}`;
}

/** "mm:ss.cc", the digital readout inside a watch face. */
export function formatDial(ms) {
  const total = Math.floor(ms / 10);
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}
