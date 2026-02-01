import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useEscalation } from "@/hooks/useEscalation";

interface Alert {
  id: number;
  conversationId: string;
  messageId: string;
  sentiment: "positive" | "negative" | "neutral";
  urgency: "low" | "medium" | "high";
  alertSent: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}

export default function AttendantAlertsDashboard() {
  const { activeAlerts, stats, availableAttendants, resolveAlert, activeAlertsLoading } =
    useEscalation();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "✅";
      case "negative":
        return "❌";
      default:
        return "❓";
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    await resolveAlert.mutateAsync({ alertId });
    setSelectedAlert(null);
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🚨 Dashboard de Alertas</h1>
          <p className="text-gray-400 mt-1">Gerenciar escalações e atendentes</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-700 border-slate-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Alertas</p>
                <p className="text-3xl font-bold text-white">{stats.totalAlerts}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
          </Card>

          <Card className="bg-red-900/30 border-red-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm">Alertas Ativos</p>
                <p className="text-3xl font-bold text-red-400">{stats.activeAlerts}</p>
              </div>
              <Zap className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="bg-green-900/30 border-green-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">Resolvidos</p>
                <p className="text-3xl font-bold text-green-400">
                  {stats.resolvedAlerts}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-slate-700 border-slate-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Taxa de Resolução</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalAlerts > 0
                    ? Math.round((stats.resolvedAlerts / stats.totalAlerts) * 100)
                    : 0}
                  %
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Alertas por Urgência */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-700 border-slate-600 p-4">
            <p className="text-gray-400 text-sm mb-2">Urgência Alta</p>
            <p className="text-2xl font-bold text-red-400">{stats.byUrgency.high}</p>
          </Card>
          <Card className="bg-slate-700 border-slate-600 p-4">
            <p className="text-gray-400 text-sm mb-2">Urgência Média</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.byUrgency.medium}</p>
          </Card>
          <Card className="bg-slate-700 border-slate-600 p-4">
            <p className="text-gray-400 text-sm mb-2">Urgência Baixa</p>
            <p className="text-2xl font-bold text-blue-400">{stats.byUrgency.low}</p>
          </Card>
        </div>
      )}

      {/* Alertas Ativos */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">📋 Alertas Ativos</h2>
        {activeAlertsLoading ? (
          <Card className="bg-slate-700 border-slate-600 p-8 text-center">
            <p className="text-gray-400">Carregando alertas...</p>
          </Card>
        ) : activeAlerts && activeAlerts.length > 0 ? (
          <div className="space-y-3">
            {activeAlerts.map((alert: Alert) => (
              <Card
                key={alert.id}
                className="bg-slate-700 border-slate-600 p-4 hover:bg-slate-600 cursor-pointer transition"
                onClick={() => setSelectedAlert(alert as Alert)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-2xl">
                      {getSentimentIcon(alert.sentiment)}
                    </span>
                    <div>
                      <p className="text-white font-semibold">
                        Conversa: {alert.conversationId.substring(0, 20)}...
                      </p>
                      <p className="text-gray-400 text-sm">
                        Mensagem: {alert.messageId.substring(0, 20)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${getUrgencyColor(alert.urgency)} text-xs`}
                    >
                      {alert.urgency === "high"
                        ? "🔴 Urgente"
                        : alert.urgency === "medium"
                          ? "🟡 Média"
                          : "🔵 Baixa"}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolveAlert(alert.id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolver
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-700 border-slate-600 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum alerta ativo no momento! 🎉</p>
          </Card>
        )}
      </div>

      {/* Atendentes Disponíveis */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">👥 Atendentes Disponíveis</h2>
        {availableAttendants && availableAttendants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableAttendants.map((attendant) => (
              <Card
                key={attendant.id}
                className="bg-green-900/30 border-green-600 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-semibold">{attendant.name}</p>
                  <Badge className="bg-green-600 text-white">
                    <Phone className="w-3 h-3 mr-1" />
                    Disponível
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    Conversas ativas: {attendant.currentConversations}/
                    {attendant.maxConversations}
                  </p>
                  <p className="text-gray-300">
                    Tempo médio: {attendant.averageResolutionTime} min
                  </p>
                  <p className="text-gray-300">
                    Satisfação: ⭐ {attendant.satisfactionScore.toFixed(1)}/5
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-700 border-slate-600 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum atendente disponível no momento</p>
          </Card>
        )}
      </div>

      {/* Detalhes do Alerta Selecionado */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Detalhes do Alerta</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-gray-400 text-sm">Conversa ID</p>
                <p className="text-white font-mono text-sm">
                  {selectedAlert.conversationId}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Sentimento</p>
                <Badge className={getUrgencyColor(selectedAlert.sentiment)}>
                  {selectedAlert.sentiment}
                </Badge>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Urgência</p>
                <Badge className={getUrgencyColor(selectedAlert.urgency)}>
                  {selectedAlert.urgency}
                </Badge>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Criado em</p>
                <p className="text-white">
                  {new Date(selectedAlert.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            <Button
              onClick={() => handleResolveAlert(selectedAlert.id)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolver Alerta
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
