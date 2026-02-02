import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  MessageSquare,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  RefreshCw,
  Download,
  Loader,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { PageShimmer } from "@/components/PageShimmer";

const COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function AdminDashboard() {
  const { user } = useAuth({ redirectOnUnauthenticated: true, requireAdmin: true });

  // Buscar dados reais da API
  const { data: usersData, isLoading: usersLoading } = trpc.admin.getUsers.useQuery({});
  const { data: leadsData, isLoading: leadsLoading } = trpc.leads.list.useQuery({ limit: 100, offset: 0 });
  const { data: billingData, isLoading: billingLoading } = trpc.checkout.getBillingInfo.useQuery({});

  // Processar dados
  const dashboardStats = useMemo(() => {
    if (!usersData?.data || !leadsData?.data) return null;

    const users = usersData.data;
    const leads = leadsData.data;

    // Calcular estatísticas de usuários
    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    
    // Calcular estatísticas de planos
    const planCounts: Record<string, number> = {};
    users.forEach((u: any) => {
      const plan = u.plan || "free";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    // Calcular estatísticas de leads
    const totalLeads = leads.length;
    const leadsThisMonth = leads.filter((l: any) => {
      const leadDate = new Date(l.createdAt);
      const now = new Date();
      return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
    }).length;

    // Calcular receita (estimada baseada em planos)
    const estimatedRevenue = users.reduce((total: number, u: any) => {
      const planPrices: Record<string, number> = {
        free: 0,
        starter: 29,
        professional: 99,
        enterprise: 299,
      };
      return total + (planPrices[u.plan || "free"] || 0);
    }, 0);

    return {
      totalUsers,
      activeUsers,
      usersGrowth: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      planDistribution: Object.entries(planCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill: COLORS[["free", "starter", "professional", "enterprise"].indexOf(name)],
      })),
      totalLeads,
      leadsThisMonth,
      monthlyRevenue: estimatedRevenue,
      revenueGrowth: 0,
    };
  }, [usersData, leadsData]);

  // Gerar dados de atividade recente
  const recentActivity = useMemo(() => {
    if (!usersData?.data) return [];

    const users = usersData.data;
    return users
      .slice(0, 5)
      .map((u: any, idx: number) => ({
        id: idx,
        user: u.name || u.email,
        action: `Usuário ${u.plan || "free"}`,
        time: u.createdAt ? `há ${Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60))} horas` : "recentemente",
        type: u.plan === "enterprise" ? "upgrade" : u.plan === "free" ? "user" : "upgrade",
        icon: u.plan === "enterprise" ? TrendingUp : Users,
      }));
  }, [usersData]);

  const isLoading = usersLoading || leadsLoading || billingLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <PageShimmer page="adminDashboard" />
      </AdminLayout>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <p className="text-slate-400">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel do Administrador</h1>
          <p className="text-slate-400 mt-1">Bem-vindo, {user?.name || "Administrador"}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Total de Usuários</p>
                <p className="text-3xl font-bold text-white mt-2">{dashboardStats.totalUsers}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {dashboardStats.activeUsers} ativos
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Assinaturas Ativas</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {dashboardStats.planDistribution.reduce((sum: number, p: any) => sum + p.value, 0) - (dashboardStats.planDistribution[0]?.value || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Excluindo Gratis</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Receita Mensal</p>
                <p className="text-3xl font-bold text-white mt-2">R$ {dashboardStats.monthlyRevenue.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +{dashboardStats.revenueGrowth}%
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Leads */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Total de Leads</p>
                <p className="text-3xl font-bold text-white mt-2">{dashboardStats.totalLeads}</p>
                <p className="text-xs text-slate-500 mt-1">{dashboardStats.leadsThisMonth} este mês</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardStats.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardStats.planDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users by Plan */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Usuários por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardStats.planDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity: any) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.user}</p>
                    <p className="text-xs text-slate-400">{activity.action}</p>
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {activity.time}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
