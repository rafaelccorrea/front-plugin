import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Activity, Zap } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { PageShimmer } from "@/components/PageShimmer";
import { trpc } from "@/lib/trpc";
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

export default function AdminAnalytics() {
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.getOverview.useQuery();
  const { data: userGrowth, isLoading: growthLoading } = trpc.analytics.getUserGrowth.useQuery();
  const { data: leadsByStatus, isLoading: statusLoading } = trpc.analytics.getLeadsByStatus.useQuery();
  const { data: userActivity, isLoading: activityLoading } = trpc.analytics.getUserActivity.useQuery();
  const { data: topUsers, isLoading: topUsersLoading } = trpc.analytics.getTopUsers.useQuery();
  const { data: systemHealth, isLoading: healthLoading } = trpc.analytics.getSystemHealth.useQuery();

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const leadStatusData = leadsByStatus
    ? [
        { name: "Novo", value: leadsByStatus.novo },
        { name: "Qualificado", value: leadsByStatus.qualificado },
        { name: "Convertido", value: leadsByStatus.convertido },
        { name: "Perdido", value: leadsByStatus.perdido },
      ]
    : [];

  const isLoading =
    overviewLoading ||
    growthLoading ||
    statusLoading ||
    activityLoading ||
    topUsersLoading ||
    healthLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <PageShimmer page="adminAnalytics" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Métricas e análises do sistema</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {overviewLoading ? "..." : overview?.totalUsers || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                +{overviewLoading ? "..." : overview?.newUsersThisMonth || 0} este mês
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                Total de Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {overviewLoading ? "..." : overview?.totalLeads || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                +{overviewLoading ? "..." : overview?.newLeadsThisMonth || 0} este mês
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                Conversas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {overviewLoading ? "..." : overview?.totalConversations || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Taxa: {overviewLoading ? "..." : overview?.conversionRate.toFixed(1) || 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Saúde do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {healthLoading ? "..." : systemHealth?.status === "healthy" ? "✓ OK" : "✗ Erro"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {healthLoading ? "..." : `${systemHealth?.memoryUsageMB}MB / ${systemHealth?.memoryLimitMB}MB`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Crescimento de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {growthLoading ? (
                <div className="h-80 flex items-center justify-center text-slate-400">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Leads by Status */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                Leads por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="h-80 flex items-center justify-center text-slate-400">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                Atividade de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="h-80 flex items-center justify-center text-slate-400">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                    <Bar dataKey="active" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-400" />
                Top Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topUsersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 bg-slate-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {topUsers && topUsers.length > 0 ? (
                    topUsers.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <div>
                          <p className="text-sm font-medium text-white">{user.userName || "Usuário"}</p>
                          <p className="text-xs text-slate-400">{user.userEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-400">{user.leadCount || 0}</p>
                          <p className="text-xs text-slate-400">leads</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">Sem dados disponíveis</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
