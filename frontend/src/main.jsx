import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { SocketProvider } from "./services/SocketContext";

/**
 * Punto de entrada de la aplicación React.
 * Renderiza el componente principal `App` dentro del DOM.
 */
createRoot(document.getElementById("root")).render(
    <SocketProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SocketProvider>
);