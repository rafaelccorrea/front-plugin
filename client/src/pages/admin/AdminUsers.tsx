import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageShimmer } from "@/components/PageShimmer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Shield,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  Loader,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [userToBan, setUserToBan] = useState<any>(null);

  // Buscar usuários da API
  const { data: usersData, isLoading, refetch } = trpc.admin.getUsers.useQuery({});

  // Mutações para ações
  const banUserMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário banido com sucesso");
      refetch();
      setIsBanDialogOpen(false);
      setBanReason("");
      setUserToBan(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao banir usuário");
    },
  });

  const unbanUserMutation = trpc.admin.unbanUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário desbanido com sucesso");
      refetch();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao desbanir usuário");
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado com sucesso");
      refetch();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar usuário");
    },
  });

  // Processar dados
  const processedData = useMemo(() => {
    if (!usersData?.data) return { stats: { totalUsers: 0, activeUsers: 0, newUsersThisMonth: 0, bannedUsers: 0, premiumUsers: 0 }, users: [] };

    const users = usersData.data;
    
    // Calcular stats
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u: any) => u.status === "active").length,
      newUsersThisMonth: users.filter((u: any) => {
        const joinDate = new Date(u.createdAt);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return joinDate > oneMonthAgo;
      }).length,
      bannedUsers: users.filter((u: any) => u.status === "banned").length,
      premiumUsers: users.filter((u: any) => u.plan !== "free").length,
    };

    // Filtrar usuários
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter((u: any) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlan !== "all") {
      filtered = filtered.filter((u: any) => u.plan.toLowerCase() === filterPlan);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((u: any) => u.status === filterStatus);
    }

    return { stats, users: filtered };
  }, [usersData, searchTerm, filterPlan, filterStatus]);

  const handleOpenBanDialog = (user: any) => {
    setUserToBan(user);
    setIsBanDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error("Motivo do banimento é obrigatório");
      return;
    }

    if (banReason.trim().length < 10) {
      toast.error("Motivo deve ter pelo menos 10 caracteres");
      return;
    }

    await banUserMutation.mutateAsync({ 
      userId: userToBan.id,
      reason: banReason.trim()
    });
  };

  const handleUnbanUser = async (userId: number) => {
    if (window.confirm("Tem certeza que deseja desbanir este usuário? Ele poderá acessar a plataforma novamente.")) {
      await unbanUserMutation.mutateAsync({ userId });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.")) {
      await deleteUserMutation.mutateAsync({ userId });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageShimmer page="adminUsers" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
            <p className="text-slate-400 mt-1">Gerencie usuários, planos e permissões</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">{processedData.stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-400">{processedData.stats.activeUsers}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Novos Este Mês</p>
                  <p className="text-2xl font-bold text-purple-400">{processedData.stats.newUsersThisMonth}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Banidos</p>
                  <p className="text-2xl font-bold text-red-400">{processedData.stats.bannedUsers}</p>
                </div>
                <Ban className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Premium</p>
                  <p className="text-2xl font-bold text-yellow-400">{processedData.stats.premiumUsers}</p>
                </div>
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-white">Todos os Planos</SelectItem>
                  <SelectItem value="free" className="text-white">Gratis</SelectItem>
                  <SelectItem value="starter" className="text-white">Starter</SelectItem>
                  <SelectItem value="professional" className="text-white">Professional</SelectItem>
                  <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-white">Todos os Status</SelectItem>
                  <SelectItem value="active" className="text-white">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-white">Inativo</SelectItem>
                  <SelectItem value="banned" className="text-white">Banido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Usuários ({processedData.users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Nome</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Plano</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Leads</TableHead>
                    <TableHead className="text-slate-300">Cadastro</TableHead>
                    <TableHead className="text-slate-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.users.length > 0 ? (
                    processedData.users.map((user: any) => (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell className="text-white font-medium">{user.name}</TableCell>
                        <TableCell className="text-slate-300">{user.email}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-600 text-white">{user.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.status === "active"
                                ? "bg-green-600 text-white"
                                : user.status === "banned"
                                ? "bg-red-600 text-white"
                                : "bg-slate-600 text-white"
                            }
                          >
                            {user.status === "active" ? "Ativo" : user.status === "banned" ? "Banido" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{user.leadsCount || 0}</TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-slate-700">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDialogOpen(true);
                                }}
                                className="text-slate-300 hover:text-white cursor-pointer"
                              >
                                Ver Detalhes
                              </DropdownMenuItem>
                              {user.status === "banned" ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnbanUser(user.id)}
                                  className="text-green-400 hover:text-green-300 cursor-pointer"
                                >
                                  Desbanir
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleOpenBanDialog(user)}
                                  className="text-yellow-400 hover:text-yellow-300 cursor-pointer"
                                >
                                  Banir
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                Deletar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Nome</p>
                  <p className="text-white font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Plano</p>
                  <p className="text-white font-medium">{selectedUser.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge
                    className={
                      selectedUser.status === "active"
                        ? "bg-green-600 text-white"
                        : selectedUser.status === "banned"
                        ? "bg-red-600 text-white"
                        : "bg-slate-600 text-white"
                    }
                  >
                    {selectedUser.status === "active" ? "Ativo" : selectedUser.status === "banned" ? "Banido" : "Inativo"}
                  </Badge>
                </div>

                {/* Motivo do Banimento */}
                {selectedUser.status === "banned" && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-sm text-red-400 font-semibold mb-1">Motivo do Banimento:</p>
                    <p className="text-sm text-red-200">{selectedUser.banReason || "Sem motivo especificado"}</p>
                  </div>
                )}

                {/* Data do Banimento */}
                {selectedUser.status === "banned" && selectedUser.bannedAt && (
                  <div>
                    <p className="text-sm text-slate-400">Data do Banimento</p>
                    <p className="text-white font-medium">
                      {new Date(selectedUser.bannedAt).toLocaleDateString("pt-BR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {selectedUser.status === "banned" ? (
                    <Button
                      onClick={() => handleUnbanUser(selectedUser.id)}
                      disabled={unbanUserMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {unbanUserMutation.isPending ? "Desbanindo..." : "Desbanir"}
                    </Button>
                    ) : (
                    <Button
                      onClick={() => handleOpenBanDialog(selectedUser)}
                      disabled={banUserMutation.isPending}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
                    >
                      {banUserMutation.isPending ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Banindo...
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 mr-2" />
                          Banir com Motivo
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    disabled={deleteUserMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Ban Reason Dialog */}
        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Banir Usuário</DialogTitle>
              <DialogDescription className="sr-only">Informe o motivo do banimento do usuário.</DialogDescription>
            </DialogHeader>
            {userToBan && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Usuário</p>
                  <p className="text-white font-medium">{userToBan.name}</p>
                  <p className="text-sm text-slate-500">{userToBan.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300 font-semibold">
                    Motivo do Banimento <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    placeholder="Descreva o motivo do banimento (mínimo 10 caracteres)..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-slate-500">
                    {banReason.length} caracteres (mínimo 10)
                  </p>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                  <p className="text-sm text-yellow-200">
                    ⚠️ O usuário será banido imediatamente e não poderá acessar a plataforma.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setIsBanDialogOpen(false);
                      setBanReason("");
                      setUserToBan(null);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleBanUser}
                    disabled={banUserMutation.isPending || !banReason.trim() || banReason.trim().length < 10}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    {banUserMutation.isPending ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Banindo...
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Confirmar Banimento
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
