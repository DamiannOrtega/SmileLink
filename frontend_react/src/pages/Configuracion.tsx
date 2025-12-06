import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";

export default function Configuracion() {
  const { theme, toggleTheme } = useTheme();
  const [darkMode, setDarkMode] = useState(theme === "dark");
  const [config, setConfig] = useState({
    limiteNinos: "3",
    diasEntrega: "7",
    notifNuevos: true,
    notifEntregas: true,
    notifCartas: true,
    twoFactor: false,
    timeout: "60",
    mensajeBienvenida: "Bienvenido al sistema SmileLink",
  });

  useEffect(() => {
    // Cargar configuración guardada
    const saved = localStorage.getItem("appConfig");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error al cargar configuración:", e);
      }
    }
  }, []);

  useEffect(() => {
    setDarkMode(theme === "dark");
  }, [theme]);

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    if (checked && theme !== "dark") {
      toggleTheme();
    } else if (!checked && theme !== "light") {
      toggleTheme();
    }
  };

  const handleSave = () => {
    // Guardar configuración
    localStorage.setItem("appConfig", JSON.stringify(config));
    toast.success("Configuración guardada exitosamente");
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administra la configuración del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Parámetros del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limite-ninos">Límite de niños por padrino</Label>
              <Input 
                id="limite-ninos" 
                type="number" 
                value={config.limiteNinos}
                onChange={(e) => setConfig(prev => ({ ...prev, limiteNinos: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dias-entrega">Días para confirmar entrega</Label>
              <Input 
                id="dias-entrega" 
                type="number" 
                value={config.diasEntrega}
                onChange={(e) => setConfig(prev => ({ ...prev, diasEntrega: e.target.value }))}
              />
            </div>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-nuevos">Notificar nuevos apadrinamientos</Label>
              <Switch 
                id="notif-nuevos" 
                checked={config.notifNuevos}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notifNuevos: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-entregas">Notificar entregas pendientes</Label>
              <Switch 
                id="notif-entregas" 
                checked={config.notifEntregas}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notifEntregas: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-cartas">Notificar nuevas cartas</Label>
              <Switch 
                id="notif-cartas" 
                checked={config.notifCartas}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notifCartas: checked }))}
              />
            </div>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa">Autenticación de dos factores</Label>
              <Switch 
                id="2fa" 
                checked={config.twoFactor}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, twoFactor: checked }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Tiempo de sesión (minutos)</Label>
              <Input 
                id="timeout" 
                type="number" 
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: e.target.value }))}
              />
            </div>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Modo Oscuro</Label>
              <Switch 
                id="dark-mode" 
                checked={darkMode}
                onCheckedChange={handleDarkModeChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensaje-bienvenida">Mensaje de Bienvenida</Label>
              <Textarea
                id="mensaje-bienvenida"
                value={config.mensajeBienvenida}
                onChange={(e) => setConfig(prev => ({ ...prev, mensajeBienvenida: e.target.value }))}
                rows={3}
              />
            </div>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
