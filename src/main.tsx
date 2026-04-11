import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@aws-amplify/ui-react/styles.css";
import "./index.css";
import { configureAmplify } from "./configureAmplify";
import App from "./App";

configureAmplify();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
