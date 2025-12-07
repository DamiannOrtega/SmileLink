import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  Link2, 
  Package, 
  MapPin, 
  Calendar,
  Settings
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Niños", url: "/ninos", icon: Users },
  { title: "Padrinos", url: "/padrinos", icon: Heart },
  { title: "Asignaciones", url: "/asignaciones", icon: Link2 },
  { title: "Entregas", url: "/entregas", icon: Package },
  { title: "Ubicaciones", url: "/ubicaciones", icon: MapPin },
  { title: "Eventos", url: "/eventos", icon: Calendar },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* LOGO SIDEBAR - Cambiar tamaño: h-16 w-16 (actual) a h-X w-X donde X es el tamaño deseado */}
            <div className="flex h-17 w-17 items-center justify-center rounded-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="SmileLink Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
