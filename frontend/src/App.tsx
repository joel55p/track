import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import TecnicoLayout from "@/layouts/TecnicoLayout";
import SupervisorLayout from "@/layouts/SupervisorLayout";
import LoginPage from "@/pages/LoginPage";
import RutaDiariaPage from "@/pages/tecnico/RutaDiariaPage";
import MapaRutaPage from "@/pages/tecnico/MapaRutaPage";
import AsistenciaPage from "@/pages/tecnico/AsistenciaPage";
import ActivosPage from "@/pages/tecnico/ActivosPage";
import DashboardPage from "@/pages/supervisor/DashboardPage";
import AlertasPage from "@/pages/supervisor/AlertasPage";
import ReasignarPage from "@/pages/supervisor/ReasignarPage";
import ActivosTiempoRealPage from "@/pages/supervisor/ActivosTiempoRealPage";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Cargando…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "tecnico") return <Navigate to="/tecnico/ruta" replace />;
  return <Navigate to="/supervisor" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tecnico" element={<TecnicoLayout />}>
        <Route path="ruta" element={<RutaDiariaPage />} />
        <Route path="mapa" element={<MapaRutaPage />} />
        <Route path="asistencia" element={<AsistenciaPage />} />
        <Route path="activos" element={<ActivosPage />} />
      </Route>
      <Route path="/supervisor" element={<SupervisorLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="alertas" element={<AlertasPage />} />
        <Route path="reasignar" element={<ReasignarPage />} />
        <Route path="inventario" element={<ActivosTiempoRealPage />} />
        <Route path="activos" element={<Navigate to="/supervisor/inventario" replace />} />
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
