import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

export default function Configuracion() {
  const handleSave = () => {
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
              <Input id="limite-ninos" type="number" defaultValue="3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dias-entrega">Días para confirmar entrega</Label>
              <Input id="dias-entrega" type="number" defaultValue="7" />
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
              <Switch id="notif-nuevos" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-entregas">Notificar entregas pendientes</Label>
              <Switch id="notif-entregas" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-cartas">Notificar nuevas cartas</Label>
              <Switch id="notif-cartas" defaultChecked />
            </div>
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
              <Switch id="2fa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Tiempo de sesión (minutos)</Label>
              <Input id="timeout" type="number" defaultValue="60" />
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
              <Switch id="dark-mode" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensaje-bienvenida">Mensaje de Bienvenida</Label>
              <Textarea
                id="mensaje-bienvenida"
                defaultValue="Bienvenido al sistema SmileLink"
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
