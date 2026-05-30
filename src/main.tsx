import { createRoot } from "react-dom/client";

// Global error handlers for uncaught exceptions
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global uncaught error:", { message, source, lineno, colno, error });
  // Sentry.captureException(error) would go here
};

window.addEventListener('unhandledrejection', function (event) {
  console.error("Unhandled promise rejection:", event.reason);
  // Sentry.captureException(event.reason) would go here
});

import "./i18n";
import App from "./App";
import "./index.css";
import "./design-system/tokens.css";

createRoot(document.getElementById("root")!).render(<App />);
