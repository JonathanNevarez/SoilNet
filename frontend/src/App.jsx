import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Nodes from "./pages/Nodes";
import Prediction from "./pages/Prediction";
import Profile from "./pages/Profile";
import NodeDetail from "./pages/NodeDetail";

import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

/**
 * Componente principal de la aplicación que define las rutas.
 * @returns {JSX.Element} El enrutador de la aplicación.
 */
export default function App() {
  return (
    <Routes>

      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas para rol "user" */}
      <Route
        element={
          <ProtectedRoute role="user">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/nodos" element={<Nodes />} />
        <Route path="/nodos/:nodeId" element={<NodeDetail />} />
        <Route path="/prediccion" element={<Prediction />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>

      {/* Ruta protegida para rol "admin" */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/home" />} />

    </Routes>
  );
}
