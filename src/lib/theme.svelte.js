// Light / dark theme. Light is easier to read in direct sunlight.
// The choice is saved on this device; with no saved choice the phone's
// own setting is used. index.html applies it before the page draws.

const KEY = 'possession-clock-theme';
const BAR = { dark: '#111418', light: '#eef1f5' }; // browser bar color per theme

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // storage unavailable
  }
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function apply(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[theme]);
}

class Theme {
  current = $state(initial());

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    apply(this.current);
    try {
      localStorage.setItem(KEY, this.current);
    } catch {
      // storage unavailable: still switches for this visit
    }
  }
}

export const theme = new Theme();
apply(theme.current);
