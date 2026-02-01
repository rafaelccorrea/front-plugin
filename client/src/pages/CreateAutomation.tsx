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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Trash2, Save, X, Loader } from "lucide-react";
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

/** Valores permitidos por campo (apenas selects, nada livre) */
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
      if (fieldKey === "field") next.value = ""; // ao trocar o campo, limpar valor
      newConditions[index] = next;
      return newConditions;
    });
  };

  const handleSave = async () => {
    // Validações
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

    // Validar condições
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

  const handleCancel = () => {
    navigate("/automations");
  };

  const selectedTrigger = TRIGGERS.find((t) => t.id === formData.trigger);
  const selectedAction = ACTIONS.find((a) => a.id === formData.action);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Nova Automação</h1>
            <p className="text-slate-400 mt-1">Crie um fluxo automático para seus leads</p>
          </div>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={handleCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>

        {/* Basic Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Nome da Automação *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Enviar boas-vindas para novos leads"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva o objetivo desta automação"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                Ativar automação
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Trigger Selection */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Gatilho (Trigger) *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={formData.trigger} onValueChange={(value) => handleSelectChange("trigger", value)}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Selecione um gatilho" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-600">
                {TRIGGERS.map((trigger) => (
                  <SelectItem key={trigger.id} value={trigger.id} className="text-white">
                    {trigger.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTrigger && (
              <p className="text-sm text-slate-400">{selectedTrigger.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Condições (Opcional)</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={handleAddCondition}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Condição
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {conditions.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma condição adicionada. A automação será executada sempre que o gatilho ocorrer.</p>
            ) : (
              conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 items-end bg-slate-900/50 p-3 rounded-lg">
                  <Select value={condition.field} onValueChange={(value) => handleConditionChange(index, "field", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white flex-1">
                      <SelectValue placeholder="Campo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      {FIELDS.map((field) => (
                        <SelectItem key={field.id} value={field.id} className="text-white">
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={condition.operator} onValueChange={(value) => handleConditionChange(index, "operator", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white flex-1">
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.id} value={op.id} className="text-white">
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
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white flex-1">
                      <SelectValue placeholder={condition.field ? "Valor" : "Selecione o campo antes"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      {(FIELD_VALUES[condition.field] ?? []).map((opt) => (
                        <SelectItem key={opt.id} value={opt.id} className="text-white">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:bg-red-500/10"
                    onClick={() => handleRemoveCondition(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Action Selection */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Ação *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={formData.action} onValueChange={(value) => handleSelectChange("action", value)}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Selecione uma ação" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-600">
                {ACTIONS.map((action) => (
                  <SelectItem key={action.id} value={action.id} className="text-white">
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAction && (
              <p className="text-sm text-slate-400">{selectedAction.description}</p>
            )}

            {formData.action === "enviar_mensagem" && (
              <div>
                <Label className="text-slate-300">Mensagem *</Label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Digite a mensagem. Use {{nome}}, {{email}}, {{telefone}} para personalização"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Dica: Use {'{nome}'} para inserir o nome do lead, {'{email}'} para email, etc.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {selectedTrigger && selectedAction && (
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-blue-300">Prévia do Fluxo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-300">
                  {selectedTrigger.label}
                </Badge>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <Badge className="bg-cyan-500/20 border-cyan-500/30 text-cyan-300">
                  {selectedAction.label}
                </Badge>
              </div>
              {conditions.length > 0 && (
                <div className="mt-3 text-xs text-slate-400">
                  Com {conditions.length} condição{conditions.length > 1 ? "ões" : ""}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Automação
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
