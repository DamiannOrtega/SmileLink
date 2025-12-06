import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AdminLayout } from "./components/layouts/AdminLayout";
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
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/ninos" element={<AdminLayout><Ninos /></AdminLayout>} />
          <Route path="/ninos/nuevo" element={<AdminLayout><NinoNuevo /></AdminLayout>} />
          <Route path="/ninos/:id" element={<AdminLayout><NinoDetalle /></AdminLayout>} />
          <Route path="/ninos/:id/editar" element={<AdminLayout><NinoNuevo /></AdminLayout>} />
          <Route path="/padrinos" element={<AdminLayout><Padrinos /></AdminLayout>} />
          <Route path="/padrinos/nuevo" element={<AdminLayout><PadrinoNuevo /></AdminLayout>} />
          <Route path="/padrinos/:id" element={<AdminLayout><PadrinoDetalle /></AdminLayout>} />
          <Route path="/padrinos/:id/editar" element={<AdminLayout><PadrinoNuevo /></AdminLayout>} />
          <Route path="/asignaciones" element={<AdminLayout><Asignaciones /></AdminLayout>} />
          <Route path="/asignaciones/nueva" element={<AdminLayout><AsignacionNueva /></AdminLayout>} />
          <Route path="/asignaciones/:id" element={<AdminLayout><AsignacionDetalle /></AdminLayout>} />
          <Route path="/asignaciones/:id/editar" element={<AdminLayout><AsignacionNueva /></AdminLayout>} />
          <Route path="/regalos" element={<AdminLayout><Regalos /></AdminLayout>} />
          <Route path="/entregas" element={<AdminLayout><Entregas /></AdminLayout>} />
          <Route path="/ubicaciones" element={<AdminLayout><Ubicaciones /></AdminLayout>} />
          <Route path="/ubicaciones/nueva" element={<AdminLayout><UbicacionNueva /></AdminLayout>} />
          <Route path="/ubicaciones/:id" element={<AdminLayout><UbicacionDetalle /></AdminLayout>} />
          <Route path="/ubicaciones/:id/editar" element={<AdminLayout><UbicacionNueva /></AdminLayout>} />
          <Route path="/eventos" element={<AdminLayout><Eventos /></AdminLayout>} />
          <Route path="/eventos/nuevo" element={<AdminLayout><EventoNuevo /></AdminLayout>} />
          <Route path="/eventos/:id/editar" element={<AdminLayout><EventoNuevo /></AdminLayout>} />
          <Route path="/usuarios" element={<AdminLayout><Usuarios /></AdminLayout>} />
          <Route path="/usuarios/nuevo" element={<AdminLayout><UsuarioNuevo /></AdminLayout>} />
          <Route path="/usuarios/:id/editar" element={<AdminLayout><UsuarioNuevo /></AdminLayout>} />
          <Route path="/configuracion" element={<AdminLayout><Configuracion /></AdminLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
