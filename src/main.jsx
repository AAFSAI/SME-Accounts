import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import {
  cleanupDevelopmentServiceWorkers,
  registerServiceWorker
} from "./services/notifications";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

cleanupDevelopmentServiceWorkers();
registerServiceWorker();
