import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles, Brain, Loader2, CheckCircle2, Phone, Mail, Calendar, UserPlus } from "lucide-react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  action?: {
    type: string;
    data: any;
  } | null;
}

const SUGGESTIONS = [
  "Quantos leads tenho este mês?",
  "Quais agendamentos estão pendentes?",
  "Resumir os leads qualificados",
  "Criar um relatório de atividades",
];

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canAccessOpenClawAutomations } = usePlanFeatures();
  const [input, setInput] = useState("");
  // Usar um objeto para rastrear o status de cada ação por ID de mensagem
  const [actionStates, setActionStates] = useState<Record<string, 'idle' | 'executing' | 'success'>>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-msg",
      role: "assistant",
      content: "Olá! Eu sou o seu Assistente IA. Como posso ajudar você com seus leads e agendamentos hoje?",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const executeActionMutation = trpc.aiAssistant.executeAction.useMutation({
    onSuccess: (data, variables) => {
      toast({
        title: "Sucesso!",
        description: data.message,
      });
      
      // Adicionar mensagem de confirmação do assistente para histórico
      setMessages(prev => [...prev, {
        id: `confirm-${Date.now()}`,
        role: "assistant",
        content: `✅ ${data.message}`
      }]);
    },
    onError: (error) => {
      toast({
        title: "Erro ao executar ação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const chatMutation = trpc.aiAssistant.chat.useMutation({
    onSuccess: (data) => {
      const content = data.content;
      const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
      const thinking = thinkingMatch ? thinkingMatch[1] : undefined;
      const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim();

      setMessages((prev) => [
        ...prev,
        { 
          id: `msg-${Date.now()}`,
          role: "assistant", 
          content: cleanContent, 
          thinking,
          action: data.action
        },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg = input.trim();
    const forbiddenPatterns = [/rm\s+-rf/i, /drop\s+table/i, /<script/i, /sudo/i];
    if (forbiddenPatterns.some(p => p.test(userMsg))) {
      setMessages((prev) => [...prev, { 
        id: `msg-security-${Date.now()}`,
        role: "assistant", 
        content: "⚠️ Comando bloqueado por segurança." 
      }]);
      setInput("");
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { id: `user-msg-${Date.now()}`, role: "user", content: userMsg }]);

    try {
      await chatMutation.mutateAsync({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })).concat({ role: "user", content: userMsg }),
      });
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleExecuteAction = async (messageId: string, action: { type: string; data: any }) => {
    if (actionStates[messageId] === 'success' || actionStates[messageId] === 'executing') return;
    
    setActionStates(prev => ({ ...prev, [messageId]: 'executing' }));
    
    try {
      await executeActionMutation.mutateAsync(action);
      setActionStates(prev => ({ ...prev, [messageId]: 'success' }));
    } catch (error) {
      setActionStates(prev => ({ ...prev, [messageId]: 'idle' }));
    }
  };

  if (!canAccessOpenClawAutomations) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-2xl mx-auto py-12 px-4 text-center">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-lg">
            <CardContent className="py-10">
              <Sparkles className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Recurso Premium</h2>
              <p className="text-sm text-muted-foreground">O Assistente IA é exclusivo para planos Professional e Enterprise.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full h-[calc(100vh-7rem)] flex flex-col max-w-4xl mx-auto">
        <div className="shrink-0 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black">IA Copiloto</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus leads com inteligência artificial.</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-xl bg-card/50 backdrop-blur-sm rounded-2xl">
          <CardHeader className="shrink-0 border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Assistente ativo</span>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-[90%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {m.role === "user" ? <User size={18} /> : <Bot size={18} />}
                      </div>
                      <div className="space-y-2 min-w-0 flex-1">
                        {m.thinking && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3 border border-dashed">
                            <Brain className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span className="italic">{m.thinking}</span>
                          </div>
                        )}
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-md shadow-lg"
                            : "bg-muted/80 text-foreground rounded-tl-md border border-border/60"
                        }`}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          
                          {/* Ações interativas - Renderização Garantida */}
                          {m.action && (
                            <div className="mt-4 pt-4 border-t border-border/20">
                              {actionStates[m.id] === 'success' ? (
                                <div className="flex items-center gap-2 text-emerald-600 font-bold py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-lg">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span>Ação concluída!</span>
                                </div>
                              ) : (
                                <div className="space-y-3 bg-background/60 p-4 rounded-xl border border-primary/20 shadow-inner">
                                  <div className="flex items-center gap-2 mb-1 text-primary font-bold uppercase text-[10px] tracking-wider">
                                    <Sparkles size={14} />
                                    <span>Ação Sugerida</span>
                                  </div>
                                  
                                  <div className="space-y-2 text-xs">
                                    {m.action.type === 'create_lead' && (
                                      <div className="grid gap-1.5">
                                        <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/40">
                                          <UserPlus size={14} className="text-primary"/> 
                                          <span><strong>Lead:</strong> {m.action.data.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 px-2">
                                          <div className="flex items-center gap-1.5 text-muted-foreground"><Phone size={12}/> {m.action.data.phone}</div>
                                          <div className="flex items-center gap-1.5 text-muted-foreground"><Mail size={12}/> {m.action.data.email}</div>
                                        </div>
                                      </div>
                                    )}
                                    {/* Outras ações aqui... */}
                                  </div>

                                  <Button 
                                    size="sm" 
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md h-10 mt-2"
                                    onClick={() => handleExecuteAction(m.id, m.action!)}
                                    disabled={actionStates[m.id] === 'executing'}
                                  >
                                    {actionStates[m.id] === 'executing' ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                    )}
                                    CONFIRMAR AGORA
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {chatMutation.isPending && (
                <div className="flex justify-start items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center"><Bot size={18} /></div>
                  <div className="px-4 py-2 rounded-2xl bg-muted/50 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Processando...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t bg-muted/20 p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-xl h-11"
              />
              <Button type="submit" disabled={chatMutation.isPending || !input.trim()} className="rounded-xl h-11 px-5">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
