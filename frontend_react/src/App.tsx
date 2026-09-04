import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ninos from "./pages/Ninos";
import NinoNuevo from "./pages/NinoNuevo";
import NinoDetalle from "./pages/NinoDetalle";
import Padrinos from "./pages/Padrinos";
import PadrinoNuevo from "./pages/PadrinoNuevo";
import PadrinoDetalle from "./pages/PadrinoDetalle";
import Asignaciones from "./pages/Asignaciones";
import AsignacionNueva from "./pages/AsignacionNueva";
import AsignacionDetalle from "./pages/AsignacionDetalle";
import Cartas from "./pages/Cartas";
import CartaNueva from "./pages/CartaNueva";
import CartaDetalle from "./pages/CartaDetalle";
import Regalos from "./pages/Regalos";
import Entregas from "./pages/Entregas";
import Ubicaciones from "./pages/Ubicaciones";
import UbicacionNueva from "./pages/UbicacionNueva";
import UbicacionDetalle from "./pages/UbicacionDetalle";
import Eventos from "./pages/Eventos";
import EventoNuevo from "./pages/EventoNuevo";
import Usuarios from "./pages/Usuarios";
import UsuarioNuevo from "./pages/UsuarioNuevo";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Ruta pública — Login */}
          <Route path="/login" element={<Login />} />

          {/* Redirigir raíz a dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Rutas protegidas — requieren sesión activa */}
          <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/ninos" element={<ProtectedRoute><AdminLayout><Ninos /></AdminLayout></ProtectedRoute>} />
          <Route path="/ninos/nuevo" element={<ProtectedRoute><AdminLayout><NinoNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/ninos/:id" element={<ProtectedRoute><AdminLayout><NinoDetalle /></AdminLayout></ProtectedRoute>} />
          <Route path="/ninos/:id/editar" element={<ProtectedRoute><AdminLayout><NinoNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/padrinos" element={<ProtectedRoute><AdminLayout><Padrinos /></AdminLayout></ProtectedRoute>} />
          <Route path="/padrinos/nuevo" element={<ProtectedRoute><AdminLayout><PadrinoNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/padrinos/:id" element={<ProtectedRoute><AdminLayout><PadrinoDetalle /></AdminLayout></ProtectedRoute>} />
          <Route path="/padrinos/:id/editar" element={<ProtectedRoute><AdminLayout><PadrinoNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/asignaciones" element={<ProtectedRoute><AdminLayout><Asignaciones /></AdminLayout></ProtectedRoute>} />
          <Route path="/asignaciones/nueva" element={<ProtectedRoute><AdminLayout><AsignacionNueva /></AdminLayout></ProtectedRoute>} />
          <Route path="/asignaciones/:id" element={<ProtectedRoute><AdminLayout><AsignacionDetalle /></AdminLayout></ProtectedRoute>} />
          <Route path="/asignaciones/:id/editar" element={<ProtectedRoute><AdminLayout><AsignacionNueva /></AdminLayout></ProtectedRoute>} />
          <Route path="/cartas" element={<ProtectedRoute><AdminLayout><Cartas /></AdminLayout></ProtectedRoute>} />
          <Route path="/cartas/nueva" element={<ProtectedRoute><AdminLayout><CartaNueva /></AdminLayout></ProtectedRoute>} />
          <Route path="/cartas/:id" element={<ProtectedRoute><AdminLayout><CartaDetalle /></AdminLayout></ProtectedRoute>} />
          <Route path="/cartas/:id/editar" element={<ProtectedRoute><AdminLayout><CartaNueva /></AdminLayout></ProtectedRoute>} />
          <Route path="/regalos" element={<ProtectedRoute><AdminLayout><Regalos /></AdminLayout></ProtectedRoute>} />
          <Route path="/entregas" element={<ProtectedRoute><AdminLayout><Entregas /></AdminLayout></ProtectedRoute>} />
          <Route path="/ubicaciones" element={<ProtectedRoute><AdminLayout><Ubicaciones /></AdminLayout></ProtectedRoute>} />
          <Route path="/ubicaciones/nueva" element={<ProtectedRoute><AdminLayout><UbicacionNueva /></AdminLayout></ProtectedRoute>} />
          <Route path="/ubicaciones/:id" element={<ProtectedRoute><AdminLayout><UbicacionDetalle /></AdminLayout></ProtectedRoute>} />
          <Route path="/ubicaciones/:id/editar" element={<ProtectedRoute><AdminLayout><UbicacionNueva /></AdminLayout></ProtectedRoute>} />
          <Route path="/eventos" element={<ProtectedRoute><AdminLayout><Eventos /></AdminLayout></ProtectedRoute>} />
          <Route path="/eventos/nuevo" element={<ProtectedRoute><AdminLayout><EventoNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/eventos/:id/editar" element={<ProtectedRoute><AdminLayout><EventoNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><AdminLayout><Usuarios /></AdminLayout></ProtectedRoute>} />
          <Route path="/usuarios/nuevo" element={<ProtectedRoute><AdminLayout><UsuarioNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/usuarios/:id/editar" element={<ProtectedRoute><AdminLayout><UsuarioNuevo /></AdminLayout></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><AdminLayout><Configuracion /></AdminLayout></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
