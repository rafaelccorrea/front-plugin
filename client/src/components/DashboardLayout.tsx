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
  MobileDrawerWidthProvider,
} from "@/components/ui/sidebar";

import { useIsMobile } from "@/hooks/useMobile";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useSupportNotifications } from "@/hooks/useSupportNotifications";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  BarChart3,
  Zap,
  HelpCircle,
  User,
  AlertCircle,
  Bot,
  Calendar,
  Webhook,
  Receipt
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { NotificationCenter } from "./NotificationCenter";
import { AppointmentNotification } from "./AppointmentNotification";
import LiveChatWithSentiment from "./LiveChatWithSentiment";
import { ChatDrawerProvider } from "@/contexts/ChatDrawerContext";

// Menu items para usuários comuns (Analytics e Automações dependem do plano)
const userMenuItemsBase = [
  { icon: Zap, label: "Comando", path: "/command-center", description: "Central de controle", minPlan: "free" as const },
  { icon: LayoutDashboard, label: "Leads", path: "/leads", description: "Gerenciar leads", minPlan: "free" as const },
  { icon: MessageSquare, label: "Conversas", path: "/conversations", description: "Chat com clientes", minPlan: "free" as const },
  { icon: Calendar, label: "Agendamentos", path: "/appointments", description: "Visitas e reuniões", minPlan: "free" as const },
  { icon: BarChart3, label: "Analytics", path: "/analytics", description: "Métricas e relatórios", minPlan: "starter" as const },
  { icon: Zap, label: "Automações", path: "/automations", description: "Regras automáticas", minPlan: "starter" as const },
  { icon: Bot, label: "OpenClaw", path: "/openclaw-automations", description: "Automações com IA e Copiloto", minPlan: "professional" as const },
  { icon: Webhook, label: "Integrações", path: "/integrations", description: "Webhook para sua API", minPlan: "professional" as const },
  { icon: HelpCircle, label: "Suporte", path: "/support", description: "Central de suporte", minPlan: "free" as const },
];

const userBottomMenuItems = [
  { icon: Receipt, label: "Minha Assinatura", path: "/minha-assinatura", description: "Assinatura e pagamento" },
  { icon: CreditCard, label: "Planos", path: "/pricing", description: "Upgrade de plano" },
  { icon: Settings, label: "Configurações", path: "/settings", description: "Configurar conta" },
];

// Menu items para admin
const adminMenuItems = [
  { icon: LayoutDashboard, label: "Painel Admin", path: "/admin", description: "Painel administrativo" },
  { icon: Users, label: "Usuários", path: "/admin/users", description: "Gerenciar usuários" },
  { icon: CreditCard, label: "Faturamento", path: "/admin/billing", description: "Receitas e transações" },
  { icon: MessageSquare, label: "Suporte", path: "/admin/support", description: "Tickets de suporte" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics", description: "Métricas do sistema" },
];

const adminBottomMenuItems = [
  { icon: AlertCircle, label: "Logs", path: "/admin/logs", description: "Logs de atividade" },
  { icon: Settings, label: "Configurações", path: "/admin/settings", description: "Configurações do sistema" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
/** Largura da sidebar (desktop) e teto do drawer (mobile). Altere aqui para mudar. */
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
/** Drawer mobile (< 768px): largura do menu que desliza. */
const MOBILE_DRAWER_WIDTH = "50vw";
const MOBILE_DRAWER_MAX_WIDTH = "260px";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    return Math.max(parsed, DEFAULT_WIDTH);
  });
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Limitar largura da sidebar em telas pequenas para manter responsividade
  useEffect(() => {
    const clampWidth = () => {
      const maxW = Math.min(MAX_WIDTH, window.innerWidth * 0.85);
      setSidebarWidth((prev) => (prev > maxW ? maxW : prev));
    };
    clampWidth();
    window.addEventListener("resize", clampWidth);
    return () => window.removeEventListener("resize", clampWidth);
  }, []);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <img src="/chatlead-pro-logo.png" alt="ChatLead Pro" className="w-16 h-16" />
            <h1 className="text-2xl font-semibold tracking-tight text-center text-white">
              Faça login para continuar
            </h1>
            <p className="text-sm text-slate-400 text-center max-w-sm">
              Acesse sua conta para gerenciar seus leads e conversas.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Link href="/login">
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                Fazer Login
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-slate-600 text-white hover:bg-slate-700"
              >
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatDrawerProvider
      openDrawer={() => setChatDrawerOpen(true)}
      isOpen={chatDrawerOpen}
    >
      <MobileDrawerWidthProvider width={MOBILE_DRAWER_WIDTH} maxWidth={MOBILE_DRAWER_MAX_WIDTH}>
        <SidebarProvider
          className="min-h-dvh overflow-x-hidden w-full"
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <DashboardLayoutContent
          setSidebarWidth={setSidebarWidth}
          setChatDrawerOpen={setChatDrawerOpen}
          chatDrawerOpen={chatDrawerOpen}
        >
          {children}
        </DashboardLayoutContent>
        <LiveChatWithSentiment open={chatDrawerOpen} onOpenChange={setChatDrawerOpen} />
        </SidebarProvider>
      </MobileDrawerWidthProvider>
    </ChatDrawerProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  setChatDrawerOpen: (open: boolean) => void;
  chatDrawerOpen: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratis",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  setChatDrawerOpen,
  chatDrawerOpen,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { plan, hasMinimumPlan } = usePlanFeatures();
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const [location] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin';
  const userMenuItems = isAdmin
    ? adminMenuItems
    : userMenuItemsBase.filter((item) => hasMinimumPlan(item.minPlan));
  const menuItems = userMenuItems;
  const bottomMenuItems = isAdmin ? adminBottomMenuItems : userBottomMenuItems;
  const activeMenuItem = [...menuItems, ...bottomMenuItems].find(item => location.startsWith(item.path));
  const isMobile = useIsMobile();
  const { unreadCount: supportUnreadCount, isAnimating: supportIsAnimating } = useSupportNotifications();

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
    // Limpar tokens do localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    // Chamar logout do hook
    await logout();
    // Redirecionar para login
    window.location.href = '/login';
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-slate-800 bg-slate-900"
          disableTransition={isResizing}
        >
          <SidebarHeader className={`relative py-3 bg-slate-900 transition-opacity duration-200 ${chatDrawerOpen ? "opacity-0 pointer-events-none overflow-hidden" : "opacity-100"}`}>
            <div className={`flex items-center w-full min-w-0 px-3 ${isCollapsed ? "justify-center" : ""}`}>
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 shrink-0 flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-300 z-10"
                aria-label="Abrir/fechar navegação"
              >
                <PanelLeft className="h-4 w-4 text-slate-400" />
              </button>
              {!isCollapsed && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img
                    src="/chatlead-pro-logo.png"
                    alt="ChatLead Pro"
                    width={112}
                    height={112}
                    className="shrink-0 object-contain w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
                  />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="sidebar-drawer-scroll gap-0 bg-slate-900 min-w-0 overflow-x-hidden overflow-y-auto">
            {/* Notificações – ocultas quando sidebar recolhida */}
            {!isCollapsed && (
              <div className="flex items-center justify-center gap-2 px-3 pt-5 pb-3 w-full min-w-0 shrink-0">
                <AppointmentNotification />
                <NotificationCenter />
              </div>
            )}
            {/* Menu Principal */}
            <div className="px-3 py-4 min-w-0 w-full">
              {!isCollapsed && (
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2 truncate">
                  Menu Principal
                </p>
              )}
              <SidebarMenu className="min-w-0">
                {menuItems.map(item => {
                  const isActive = location === item.path || location.startsWith(item.path + '/');
                  const showBadge = item.label === 'Suporte' && supportUnreadCount > 0;
                  return (
                    <SidebarMenuItem key={item.path + item.label}>
                      <Link href={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className={`h-10 transition-all font-normal min-w-0 ${
                            isActive 
                              ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`}
                          />
                          <span className="truncate">{item.label}</span>
                          {!isCollapsed && showBadge && (
                            <span className={`ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full ${
                              supportIsAnimating ? 'animate-badge-entrance animate-badge-pulse' : 'animate-badge-glow'
                            }`}>
                              {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
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
              <div className="border-t border-slate-800" />
            </div>

            {/* Menu Secundário */}
            <div className="px-3 py-4">
              {!isCollapsed && (
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">
                  Configurações
                </p>
              )}
              <SidebarMenu>
                {bottomMenuItems.map(item => {
                  const isActive = location === item.path || location.startsWith(item.path + '/');
                  return (
                    <SidebarMenuItem key={item.path + item.label}>
                      <Link href={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className={`h-10 transition-all font-normal ${
                            isActive 
                              ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`}
                          />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-800">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-blue-600 text-white font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                        <span className="truncate font-semibold text-slate-200">{user?.name}</span>
                        <span className="truncate text-xs text-slate-400">{user?.email}</span>
                        {!isCollapsed && (
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400/90 mt-0.5">
                            Plano {planLabel}
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-slate-800 border-slate-700"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuItem className="text-slate-300 cursor-pointer hover:bg-slate-700">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-400 cursor-pointer hover:bg-slate-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle - só em desktop */}
        {!isMobile && (
          <div
            onMouseDown={() => setIsResizing(true)}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors group"
            style={{ right: "-0.5px" }}
          />
        )}
      </div>

      <SidebarInset className="bg-slate-950 min-h-dvh flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {isMobile && (
          <header className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <span className="text-sm font-medium text-slate-400 truncate">Menu</span>
          </header>
        )}
        <main className="flex-1 w-full min-w-0 max-w-full min-h-0 overflow-auto p-4 sm:p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
