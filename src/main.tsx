import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import "./index.css";
import { configureAmplify } from "./configureAmplify";
import App from "./App";

configureAmplify();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
