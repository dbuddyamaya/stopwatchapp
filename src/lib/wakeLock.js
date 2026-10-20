// Keeps the phone screen on while a watch is running (where supported).

let lock = null;

export async function setWakeLock(on) {
  try {
    if (on && !lock && 'wakeLock' in navigator) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => (lock = null));
    } else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    // not supported or denied
  }
}

/** The browser drops the lock when the page is hidden; call this when it's visible again. */
export function resetWakeLock(on) {
  lock = null;
  return setWakeLock(on);
}
