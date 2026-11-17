import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import './app.css';
import App from './App.svelte';

// Offline support. When a new version has been downloaded the page reloads
// itself to switch to it (all clocks and scores are saved, so nothing is lost).
// Phones often resume the app without reloading, so also check for a new
// version every time the app is opened or brought back to the front.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) registration.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', check);
    setInterval(check, 30 * 60 * 1000);
  }
});

export default mount(App, { target: document.getElementById('app') });
