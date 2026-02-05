import { useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShimmer } from "@/components/PageShimmer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Filter,
  Target,
  Calendar,
  ListTodo,
  ArrowRight,
  User,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGES = [
  { id: "new", label: "Novo", color: "bg-slate-500/20 border-slate-500/40 text-slate-300" },
  { id: "contacted", label: "Contatado", color: "bg-blue-500/20 border-blue-500/40 text-blue-300" },
  { id: "qualified", label: "Qualificado", color: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  { id: "lost", label: "Perdido", color: "bg-red-500/20 border-red-500/40 text-red-300" },
  { id: "converted", label: "Convertido", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
] as const;

type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "converted";

type Lead = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  urgency?: string | null;
  nextAction: string | null;
  expectedCloseAt: string | null;
  createdAt: Date | string;
};

export default function SalesFunnel() {
  const [, navigate] = useLocation();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);
  const [quickEditLead, setQuickEditLead] = useState<Lead | null>(null);
  const [quickNextAction, setQuickNextAction] = useState("");
  const [quickExpectedClose, setQuickExpectedClose] = useState("");

  const { data: leadsData, isLoading } = trpc.leads.list.useQuery({
    limit: 500,
    offset: 0,
  });

  const utils = trpc.useUtils();
  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setQuickEditLead(null);
      toast.success("Lead atualizado");
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao atualizar lead");
    },
  });

  const leads = (leadsData?.data ?? []) as Lead[];
  const leadsByStage = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      lost: [],
      converted: [],
    };
    leads.forEach((l) => {
      const s = (l.status || "new") as LeadStatus;
      if (map[s]) map[s].push(l);
    });
    STAGES.forEach((st) => {
      if (!map[st.id as LeadStatus]) map[st.id as LeadStatus] = [];
    });
    return map;
  }, [leads]);

  const handleDragStart = useCallback((e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(lead.id));
    (e.target as HTMLElement).style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedLead(null);
    setDragOverStage(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, newStatus: LeadStatus) => {
      e.preventDefault();
      setDragOverStage(null);
      const leadId = e.dataTransfer.getData("text/plain");
      const lead = leads.find((l) => l.id === Number(leadId));
      if (!lead || lead.status === newStatus) return;
      updateLead.mutate({ id: lead.id, updates: { status: newStatus } });
    },
    [leads, updateLead]
  );

  const openQuickEdit = useCallback((lead: Lead) => {
    setQuickEditLead(lead);
    setQuickNextAction(lead.nextAction ?? "");
    setQuickExpectedClose(
      lead.expectedCloseAt
        ? format(new Date(lead.expectedCloseAt), "yyyy-MM-dd")
        : ""
    );
  }, []);

  const saveQuickEdit = useCallback(() => {
    if (!quickEditLead) return;
    updateLead.mutate({
      id: quickEditLead.id,
      updates: {
        nextAction: quickNextAction || undefined,
        expectedCloseAt: quickExpectedClose ? new Date(quickExpectedClose).toISOString() : null,
      },
    });
  }, [quickEditLead, quickNextAction, quickExpectedClose, updateLead]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShimmer page="leads" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Target className="h-9 w-9 text-primary" />
              Funil de vendas
            </h1>
            <p className="text-muted-foreground mt-1">
              Arraste os cards entre as etapas. Defina próxima ação e previsão de fechamento para vender mais.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-2"
            onClick={() => navigate("/leads")}
          >
            Ver lista de leads
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-xl border-2 transition-colors ${
                dragOverStage === stage.id
                  ? "border-primary bg-primary/5"
                  : "border-white/10 bg-card/50"
              } ${stage.color}`}
              onDragOver={(e) => handleDragOver(e, stage.id as LeadStatus)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id as LeadStatus)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{stage.label}</span>
                  <Badge variant="secondary" className="font-mono">
                    {leadsByStage[stage.id as LeadStatus]?.length ?? 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                {(leadsByStage[stage.id as LeadStatus] ?? []).map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing border-white/10 bg-background/80 hover:bg-background transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate flex items-center gap-1">
                            <User className="h-3.5 w-3.5 flex-shrink-0" />
                            {lead.name || "Sem nome"}
                          </p>
                          {lead.nextAction && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <ListTodo className="h-3 flex-shrink-0" />
                              <span className="truncate">{lead.nextAction}</span>
                            </p>
                          )}
                          {lead.expectedCloseAt && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 flex-shrink-0" />
                              {format(new Date(lead.expectedCloseAt), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openQuickEdit(lead)}
                          >
                            <ListTodo className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </div>
          ))}
        </div>

        <QuickEditDialog
          lead={quickEditLead}
          nextAction={quickNextAction}
          expectedClose={quickExpectedClose}
          onNextActionChange={setQuickNextAction}
          onExpectedCloseChange={setQuickExpectedClose}
          onSave={saveQuickEdit}
          onClose={() => setQuickEditLead(null)}
          saving={updateLead.isPending}
        />
      </div>
    </DashboardLayout>
  );
}

function QuickEditDialog({
  lead,
  nextAction,
  expectedClose,
  onNextActionChange,
  onExpectedCloseChange,
  onSave,
  onClose,
  saving,
}: {
  lead: Lead | null;
  nextAction: string;
  expectedClose: string;
  onNextActionChange: (v: string) => void;
  onExpectedCloseChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  if (!lead) return null;
  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Próxima ação e previsão</DialogTitle>
          <DialogDescription>
            {lead.name || "Lead"} — defina o próximo passo e quando espera fechar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Próxima ação</Label>
            <Input
              placeholder="Ex: Enviar proposta, Ligar amanhã..."
              value={nextAction}
              onChange={(e) => onNextActionChange(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Previsão de fechamento</Label>
            <Input
              type="date"
              value={expectedClose}
              onChange={(e) => onExpectedCloseChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
