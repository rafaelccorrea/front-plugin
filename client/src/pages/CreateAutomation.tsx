import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
  Zap,
  Play,
  Filter,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const TRIGGERS = [
  { id: "novo_lead", label: "Novo Lead", description: "Quando um novo lead é criado" },
  { id: "mensagem_recebida", label: "Mensagem Recebida", description: "Quando uma mensagem é recebida" },
  { id: "lead_qualificado", label: "Lead Qualificado", description: "Quando um lead é qualificado" },
  { id: "lead_convertido", label: "Lead Convertido", description: "Quando um lead é convertido" },
];

const ACTIONS = [
  { id: "enviar_mensagem", label: "Enviar Mensagem", description: "Enviar uma mensagem automática" },
  { id: "qualificar_lead", label: "Qualificar Lead", description: "Marcar lead como qualificado" },
  { id: "enviar_notificacao", label: "Enviar Notificação", description: "Enviar notificação para o usuário" },
  { id: "atualizar_status", label: "Atualizar Status", description: "Atualizar status do lead" },
  { id: "criar_tarefa", label: "Criar Tarefa", description: "Criar uma tarefa para o usuário" },
];

const FIELDS = [
  { id: "urgencia", label: "Urgência" },
  { id: "status", label: "Status" },
  { id: "plano", label: "Plano" },
  { id: "origem", label: "Origem" },
];

const OPERATORS = [
  { id: "igual", label: "Igual" },
  { id: "diferente", label: "Diferente" },
  { id: "contem", label: "Contém" },
];

const FIELD_VALUES: Record<string, { id: string; label: string }[]> = {
  urgencia: [
    { id: "baixa", label: "Baixa" },
    { id: "media", label: "Média" },
    { id: "alta", label: "Alta" },
  ],
  status: [
    { id: "novo", label: "Novo" },
    { id: "em_contato", label: "Em contato" },
    { id: "qualificado", label: "Qualificado" },
    { id: "convertido", label: "Convertido" },
    { id: "perdido", label: "Perdido" },
  ],
  plano: [
    { id: "free", label: "Gratis" },
    { id: "starter", label: "Starter" },
    { id: "professional", label: "Professional" },
    { id: "enterprise", label: "Enterprise" },
  ],
  origem: [
    { id: "landing_page", label: "Landing Page" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "manual", label: "Manual" },
    { id: "outro", label: "Outro" },
  ],
};

export default function CreateAutomation() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const createMutation = trpc.automations.create.useMutation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "",
    action: "",
    message: "",
    isActive: true,
  });

  const [conditions, setConditions] = useState<Array<{ field: string; operator: string; value: string }>>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { field: "", operator: "", value: "" }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, fieldKey: string, value: string) => {
    setConditions((prev) => {
      const newConditions = [...prev];
      const next = { ...newConditions[index], [fieldKey]: value };
      if (fieldKey === "field") next.value = "";
      newConditions[index] = next;
      return newConditions;
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da automação é obrigatório");
      return;
    }
    if (!formData.trigger) {
      toast.error("Selecione um gatilho");
      return;
    }
    if (!formData.action) {
      toast.error("Selecione uma ação");
      return;
    }
    if (formData.action === "enviar_mensagem" && !formData.message.trim()) {
      toast.error("Mensagem é obrigatória para ação 'Enviar Mensagem'");
      return;
    }
    for (const condition of conditions) {
      if (!condition.field || !condition.operator || !condition.value) {
        toast.error("Preencha todas as condições");
        return;
      }
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        trigger: formData.trigger as "novo_lead" | "mensagem_recebida" | "lead_qualificado" | "lead_convertido",
        action: formData.action as "enviar_mensagem" | "qualificar_lead" | "enviar_notificacao" | "atualizar_status" | "criar_tarefa",
        message: formData.message?.trim() || undefined,
        conditions: conditions.filter((c) => c.field && c.operator && c.value),
        isActive: formData.isActive,
      });
      toast.success("Automação criada com sucesso!");
      navigate("/automations");
    } catch (error: unknown) {
      const message = error && typeof error === "object" && "message" in error ? String((error as { message: string }).message) : "Erro ao criar automação";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigate("/automations");

  const selectedTrigger = TRIGGERS.find((t) => t.id === formData.trigger);
  const selectedAction = ACTIONS.find((a) => a.id === formData.action);

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl pb-12">
        {/* Back + Cancel */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/automations")}
            className="pl-0 text-muted-foreground hover:text-foreground -ml-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Automações
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading} className="border-2">
            <X className="h-4 w-4 mr-2" /> Cancelar
          </Button>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 mb-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" /> Novo fluxo
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Nova Automação</h1>
            <p className="text-muted-foreground text-lg mt-2">
              Crie um fluxo automático: defina o gatilho, as condições (opcional) e a ação que será executada.
            </p>
          </div>
        </div>

        {/* Grid 2 colunas em telas grandes */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-x-10 xl:gap-y-8">
          {/* Coluna esquerda: Informações + Gatilho */}
          <div className="space-y-8">
            <section>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Informações</p>
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Informações Básicas
                  </CardTitle>
                  <CardDescription>Nome e descrição do fluxo</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Automação *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Enviar boas-vindas para novos leads"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Descreva o objetivo desta automação"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked === true }))}
                    />
                    <Label htmlFor="isActive" className="font-medium cursor-pointer">
                      Ativar automação após salvar
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Gatilho</p>
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" /> Gatilho (Trigger) *
                  </CardTitle>
                  <CardDescription>Quando este fluxo deve ser disparado</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Select value={formData.trigger} onValueChange={(value) => handleSelectChange("trigger", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione um gatilho" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map((trigger) => (
                        <SelectItem key={trigger.id} value={trigger.id}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTrigger && (
                    <p className="text-sm text-muted-foreground">{selectedTrigger.description}</p>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Coluna direita: Condições + Ação */}
          <div className="space-y-8">
            <section>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Condições</p>
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" /> Condições (Opcional)
                      </CardTitle>
                      <CardDescription>Filtre quando a automação deve rodar</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleAddCondition} className="border-2 font-semibold">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {conditions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      Nenhuma condição. A automação será executada sempre que o gatilho ocorrer.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {conditions.map((condition, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap gap-2 items-end p-4 rounded-xl border-2 border-border/50 bg-muted/30"
                        >
                          <Select value={condition.field} onValueChange={(value) => handleConditionChange(index, "field", value)}>
                            <SelectTrigger className="h-10 flex-1 min-w-[120px]">
                              <SelectValue placeholder="Campo" />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELDS.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={condition.operator} onValueChange={(value) => handleConditionChange(index, "operator", value)}>
                            <SelectTrigger className="h-10 flex-1 min-w-[120px]">
                              <SelectValue placeholder="Operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATORS.map((op) => (
                                <SelectItem key={op.id} value={op.id}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={condition.field ? condition.value : ""}
                            onValueChange={(value) => handleConditionChange(index, "value", value)}
                            disabled={!condition.field}
                          >
                            <SelectTrigger className="h-10 flex-1 min-w-[120px]">
                              <SelectValue placeholder={condition.field ? "Valor" : "Campo primeiro"} />
                            </SelectTrigger>
                            <SelectContent>
                              {(FIELD_VALUES[condition.field] ?? []).map((opt) => (
                                <SelectItem key={opt.id} value={opt.id}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => handleRemoveCondition(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ação</p>
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> Ação *
                  </CardTitle>
                  <CardDescription>O que será executado quando o gatilho disparar</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Select value={formData.action} onValueChange={(value) => handleSelectChange("action", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione uma ação" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map((action) => (
                        <SelectItem key={action.id} value={action.id}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAction && (
                    <p className="text-sm text-muted-foreground">{selectedAction.description}</p>
                  )}

                  {formData.action === "enviar_mensagem" && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Use {{nome}}, {{email}}, {{telefone}} para personalização"
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dica: {'{nome}'}, {'{email}'}, {'{telefone}'} são substituídos pelos dados do lead.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>

        {/* Prévia do Fluxo */}
        {selectedTrigger && selectedAction && (
          <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" /> Prévia do Fluxo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="font-semibold px-3 py-1">
                  {selectedTrigger.label}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold px-3 py-1">
                  {selectedAction.label}
                </Badge>
              </div>
              {conditions.length > 0 && (
                <p className="text-xs text-muted-foreground pt-1">
                  Com {conditions.length} condição{conditions.length > 1 ? "ões" : ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-3 justify-end pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="border-2 font-semibold">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="font-semibold h-11 px-6 shadow-lg shadow-primary/20">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Automação
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
