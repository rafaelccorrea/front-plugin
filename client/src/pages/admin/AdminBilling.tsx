import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminBilling() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [isLoading, setIsLoading] = useState(false);
  const [refundedTransactions, setRefundedTransactions] = useState<Set<string>>(new Set());
  const [refundingId, setRefundingId] = useState<string | null>(null);

  // Queries do Stripe
  const statsQuery = trpc.adminBilling.getStats.useQuery();
  const transactionsQuery = trpc.adminBilling.getTransactions.useQuery();
  const subscriptionsQuery = trpc.adminBilling.getSubscriptions.useQuery();
  const syncMutation = trpc.adminBilling.syncStripeData.useMutation();
  const refundMutation = trpc.adminBilling.refundTransaction.useMutation();

  const billingData = {
    stats: statsQuery.data?.data || {
      monthlyRevenue: 0,
      revenueGrowth: 0,
      mrr: 0,
      mrrGrowth: 0,
      successRate: 0,
      failedTransactions: 0,
      totalTransactions: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      averageOrderValue: 0,
    },
    revenueChart: [
      { month: "Jan", revenue: 0, subscriptions: 0 },
      { month: "Fev", revenue: 0, subscriptions: 0 },
      { month: "Mar", revenue: 0, subscriptions: 0 },
      { month: "Abr", revenue: 0, subscriptions: 0 },
      { month: "Mai", revenue: 0, subscriptions: 0 },
      { month: "Jun", revenue: 0, subscriptions: 0 },
    ],
    transactions: transactionsQuery.data?.data || [],
    subscriptions: subscriptionsQuery.data?.data || [],
  };

  const filteredTransactions = useMemo(() => {
    return billingData.transactions.filter(txn =>
      txn.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, billingData.transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "succeeded":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativa
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            Cancelada
          </Badge>
        );
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const handleRefund = async (transactionId: string, amount: number) => {
    try {
      setRefundingId(transactionId);
      await refundMutation.mutateAsync({
        chargeId: transactionId,
        reason: "requested_by_customer",
      });
      
      // Adicionar transação à lista de reembolsadas
      setRefundedTransactions(prev => new Set(prev).add(transactionId));
      
      // Mostrar toast com valor correto
      toast.success(`Reembolso de $${amount.toFixed(2)} iniciado para ${transactionId}`);
      
      // Refetch das transações
      transactionsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar reembolso");
    } finally {
      setRefundingId(null);
    }
  };

  const handleExport = () => {
    toast.info("Exportação de relatório em breve");
  };

  const handleSyncStripe = async () => {
    try {
      setIsLoading(true);
      const loadingToast = toast.loading("Sincronizando com Stripe...");
      await syncMutation.mutateAsync();
      toast.dismiss(loadingToast);
      toast.success("Sincronização concluída");
      
      // Refetch all data
      statsQuery.refetch();
      transactionsQuery.refetch();
      subscriptionsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao sincronizar com Stripe");
    } finally {
      setIsLoading(false);
    }
  };

  const isLoadingData = statsQuery.isLoading || transactionsQuery.isLoading || subscriptionsQuery.isLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Faturamento & Stripe</h1>
            <p className="text-slate-400 mt-1">
              Gerencie receitas, transações e assinaturas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleSyncStripe}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Stripe
                </>
              )}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Revenue */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Receita Mensal</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    ${billingData.stats.monthlyRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4" />
                    {billingData.stats.revenueGrowth}% vs mês anterior
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* MRR */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">MRR (Receita Recorrente)</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    ${billingData.stats.mrr.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4" />
                    {billingData.stats.mrrGrowth}% vs mês anterior
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Taxa de Sucesso</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {billingData.stats.successRate}%
                  </p>
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {billingData.stats.failedTransactions} falhas
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Active Subscriptions */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Assinaturas Ativas</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {billingData.stats.activeSubscriptions}
                  </p>
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <ArrowDownRight className="h-4 w-4" />
                    {billingData.stats.churnRate}% cancelamentos
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Receita vs Assinaturas (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={billingData.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  name="Receita (R$)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="subscriptions"
                  stroke="#8b5cf6"
                  name="Assinaturas"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transactions & Subscriptions Tabs */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Dados Financeiros</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={activeTab === "transactions" ? "default" : "outline"}
                  className={activeTab === "transactions" ? "bg-blue-600 text-white" : "border-slate-700 text-slate-300"}
                  onClick={() => setActiveTab("transactions")}
                >
                  Transações ({billingData.transactions.length})
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "subscriptions" ? "default" : "outline"}
                  className={activeTab === "subscriptions" ? "bg-blue-600 text-white" : "border-slate-700 text-slate-300"}
                  onClick={() => setActiveTab("subscriptions")}
                >
                  Assinaturas ({billingData.subscriptions.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por usuário ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Loading State */}
            {isLoadingData && (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              </div>
            )}

            {/* Transactions Table */}
            {!isLoadingData && activeTab === "transactions" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">ID Transação</TableHead>
                      <TableHead className="text-slate-400">Usuário</TableHead>
                      <TableHead className="text-slate-400">Plano</TableHead>
                      <TableHead className="text-slate-400">Valor</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Data</TableHead>
                      <TableHead className="text-slate-400 text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => {
                        const isRefunded = refundedTransactions.has(transaction.stripeId);
                        const isRefunding = refundingId === transaction.stripeId;
                        
                        return (
                          <TableRow key={transaction.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell className="font-mono text-slate-300 text-sm">{transaction.stripeId}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">{transaction.user}</p>
                                <p className="text-xs text-slate-400">{transaction.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{transaction.plan}</TableCell>
                            <TableCell className="font-medium text-white">${transaction.amount.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                            <TableCell className="text-slate-400 text-sm">
                              {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              {transaction.status === "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`${
                                    isRefunded 
                                      ? "border-green-700 text-green-400 hover:bg-green-500/10 cursor-not-allowed opacity-50" 
                                      : "border-red-700 text-red-400 hover:bg-red-500/10"
                                  }`}
                                  onClick={() => handleRefund(transaction.stripeId, transaction.amount)}
                                  disabled={isRefunded || isRefunding}
                                >
                                  {isRefunding ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Processando...
                                    </>
                                  ) : isRefunded ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Reembolsado
                                    </>
                                  ) : (
                                    "Reembolsar"
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Subscriptions Table */}
            {!isLoadingData && activeTab === "subscriptions" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">ID Assinatura</TableHead>
                      <TableHead className="text-slate-400">Usuário</TableHead>
                      <TableHead className="text-slate-400">Plano</TableHead>
                      <TableHead className="text-slate-400">Valor</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Próxima Cobrança</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingData.subscriptions.length > 0 ? (
                      billingData.subscriptions.map((subscription) => (
                        <TableRow key={subscription.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-mono text-slate-300 text-sm">{subscription.id}</TableCell>
                          <TableCell className="font-medium text-white">{subscription.user}</TableCell>
                          <TableCell className="text-slate-300">{subscription.plan}</TableCell>
                          <TableCell className="font-medium text-white">${subscription.amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {new Date(subscription.nextBilling).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                          Nenhuma assinatura encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
