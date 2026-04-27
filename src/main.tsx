import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App";
import "./index.css";
import "./design-system/tokens.css";

createRoot(document.getElementById("root")!).render(<App />);
