import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { HostProvider } from "./HostContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <HostProvider>
        <App />
      </HostProvider>
    </BrowserRouter>
  </StrictMode>,
);
