import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/enchanted.css"; // V5 luxury journal styles

// Unregister any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  // Listen for SW messages (e.g., self-destruct notification)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UNREGISTERED') {
      console.log('[Main] SW unregistered, reloading page...');
      window.location.reload();
    }
  });

  // Force SW update check and unregister all SWs
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      // Force update check - this will download the new self-destruct SW
      registration.update().catch(() => {});
      // Also try to unregister directly
      registration.unregister().then(() => {
        console.log('[Main] Service Worker unregistered');
      });
    }
  });

  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
        console.log('[Main] Cache deleted:', name);
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
