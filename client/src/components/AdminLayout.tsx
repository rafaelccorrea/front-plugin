import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/useMobile";
import { useSupportNotifications } from "@/hooks/useSupportNotifications";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3,
  MessageSquare,
  HelpCircle,
  User,
  Shield,
  DollarSign,
  Bell,
  FileText
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { NotificationCenter } from "./NotificationCenter";

// Menu items para Admin (Master)
const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", description: "Visão geral do sistema" },
  { icon: Users, label: "Usuários", path: "/admin/users", description: "Gerenciar usuários" },
  { icon: DollarSign, label: "Faturamento", path: "/admin/billing", description: "Receitas e assinaturas" },
  { icon: MessageSquare, label: "Suporte", path: "/admin/support", description: "Tickets de suporte" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics", description: "Métricas do sistema" },
  { icon: Bell, label: "Notificações", path: "/admin/notifications", description: "Enviar notificações" },
];

const adminBottomMenuItems = [
  { icon: FileText, label: "Logs", path: "/admin/logs", description: "Logs do sistema" },
  { icon: Settings, label: "Configurações", path: "/admin/settings", description: "Configurações do sistema" },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Verificar se é admin
  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      setLocation("/leads");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}

type AdminLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: AdminLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { unreadCount: supportUnreadCount, isAnimating: supportIsAnimating } = useSupportNotifications();
  const activeMenuItem = [...adminMenuItems, ...adminBottomMenuItems].find(item => 
    location === item.path || (item.path !== "/admin" && location.startsWith(item.path))
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const handleLogout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-red-900/30 bg-gradient-to-b from-slate-900 to-red-950/20"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-red-900/30">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                aria-label="Abrir/fechar navegação"
              >
                <PanelLeft className="h-4 w-4 text-red-400" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold tracking-tight truncate text-white text-sm">
                      Admin Panel
                    </span>
                    <span className="text-xs text-red-400">Master</span>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-transparent">
            {/* Menu Principal */}
            <div className="px-3 py-4">
              {!isCollapsed && (
                <p className="text-xs font-medium text-red-400/70 uppercase tracking-wider mb-2 px-2">
                  Administração
                </p>
              )}
              <SidebarMenu>
                {adminMenuItems.map(item => {
                  const isActive = location === item.path || (item.path !== "/admin" && location.startsWith(item.path));
                  const showBadge = item.label === "Suporte" && supportUnreadCount > 0;
                  return (
                    <SidebarMenuItem key={item.path + item.label}>
                      <Link href={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className={`h-10 transition-all font-normal ${
                            isActive 
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                              : 'text-slate-300 hover:bg-red-900/20 hover:text-white'
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${isActive ? "text-red-400" : "text-slate-400"}`}
                          />
                          <span className="truncate">{item.label}</span>
                          {!isCollapsed && showBadge && (
                            <span className={`ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-500 rounded-full ${
                              supportIsAnimating ? "animate-pulse" : ""
                            }`}>
                              {supportUnreadCount > 99 ? "99+" : supportUnreadCount}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            {/* Separador */}
            <div className="px-3">
              <div className="border-t border-red-900/30" />
            </div>

            {/* Menu Secundário */}
            <div className="px-3 py-4">
              {!isCollapsed && (
                <p className="text-xs font-medium text-red-400/70 uppercase tracking-wider mb-2 px-2">
                  Sistema
                </p>
              )}
              <SidebarMenu>
                {adminBottomMenuItems.map(item => {
                  const isActive = location === item.path || location.startsWith(item.path + '/');
                  return (
                    <SidebarMenuItem key={item.path + item.label}>
                      <Link href={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className={`h-10 transition-all font-normal ${
                            isActive 
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                              : 'text-slate-300 hover:bg-red-900/20 hover:text-white'
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 ${isActive ? "text-red-400" : "text-slate-400"}`}
                          />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            {/* Link para área do usuário */}
            <div className="px-3 py-4">
              <Link href="/leads">
                <Button 
                  variant="outline" 
                  className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  {!isCollapsed && "Área do Usuário"}
                </Button>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-red-900/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-red-900/20 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                  <Avatar className="h-9 w-9 border border-red-700 shrink-0 bg-gradient-to-br from-red-500 to-orange-500">
                    <AvatarFallback className="text-xs font-medium text-white bg-transparent">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate leading-none text-white">
                        {user?.name || "Admin"}
                      </p>
                      <Badge className="bg-red-500/20 text-red-300 text-xs border-red-500/30">
                        Master
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                  <Badge className="mt-1 bg-red-500/20 text-red-300 text-xs">Administrador</Badge>
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700">
                    <User className="mr-2 h-4 w-4" />
                    <span>Minha Conta</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-red-500/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-slate-950 min-h-screen flex flex-col">
        {isMobile && (
          <header className="flex shrink-0 border-b border-red-900/30 h-14 items-center justify-between bg-slate-900/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-red-900/30 text-white" />
              <div className="flex items-center gap-3">
                <Badge className="bg-red-500/20 text-red-300 text-xs">Admin</Badge>
                <span className="tracking-tight text-white">
                  {activeMenuItem?.label ?? "Admin"}
                </span>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 w-full min-h-0 overflow-auto p-4 sm:p-5 md:p-6 lg:p-8 bg-slate-950">
          <div className="w-full max-w-[1600px] mx-auto h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
      <NotificationCenter />
    </>
  );
}
