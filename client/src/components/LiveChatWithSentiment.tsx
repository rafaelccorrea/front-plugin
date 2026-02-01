import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  X,
  Send,
  Loader2,
  User,
  Bot,
  Phone,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Message {
  id: string;
  type: "user" | "bot" | "human";
  content: string;
  timestamp: Date;
  sender?: string;
  sentiment?: {
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    urgency: "low" | "medium" | "high";
    tone: "friendly" | "frustrated" | "neutral" | "excited";
    suggestedResponse?: string;
  };
}

type ChatMode = "closed" | "bot" | "human";

interface LiveChatWithSentimentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LiveChatWithSentiment({ open, onOpenChange }: LiveChatWithSentimentProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const chatMutation = trpc.ai.chat.useMutation();
  const sentimentMutation = trpc.sentiment.analyze.useMutation();
  const [mode, setMode] = useState<ChatMode>("bot");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Olá! 👋 Bem-vindo ao ChatLead Pro. Como posso ajudá-lo hoje?",
      timestamp: new Date(),
      sender: "Bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingForHuman, setWaitingForHuman] = useState(false);
  const [currentSentiment, setCurrentSentiment] = useState<Message["sentiment"] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Análise de sentimento simplificada (sem chamar API)
  const analyzeSentiment = (text: string) => {
    const positiveWords = [
      "ótimo",
      "excelente",
      "adorei",
      "perfeito",
      "maravilhoso",
      "incrível",
      "obrigado",
      "agradeço",
      "fantástico",
    ];
    const negativeWords = [
      "péssimo",
      "horrível",
      "não gostei",
      "ruim",
      "problema",
      "erro",
      "frustrado",
      "insatisfeito",
      "decepção",
      "raiva",
      "pior",
    ];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;

    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    let score = 0.5;
    let urgency: "low" | "medium" | "high" = "low";
    let tone: "friendly" | "frustrated" | "neutral" | "excited" = "neutral";

    if (negativeCount > positiveCount) {
      sentiment = "negative";
      score = Math.max(0.1, 0.5 - negativeCount * 0.15);
      urgency = negativeCount > 2 ? "high" : "medium";
      tone = "frustrated";
    } else if (positiveCount > negativeCount) {
      sentiment = "positive";
      score = Math.min(0.9, 0.5 + positiveCount * 0.15);
      urgency = "low";
      tone = positiveCount > 2 ? "excited" : "friendly";
    }

    return { sentiment, score, urgency, tone };
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "negative":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <CheckCircle className="w-4 h-4" />;
      case "negative":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const botResponses: Record<string, string> = {
    preco:
      "Nossos planos começam em $29/mês para o Starter. Temos também planos Professional ($99/mês) e Enterprise (customizado). Quer saber mais detalhes?",
    features:
      "ChatLead Pro oferece: análise de sentimento em tempo real, extração de dados estruturados, qualificação automática de leads, integração com WhatsApp, dashboard completo e muito mais!",
    integracao:
      "Sim! ChatLead Pro se integra perfeitamente com WhatsApp Business API. O setup leva apenas 5 minutos.",
    suporte:
      "Oferecemos suporte por email para todos os planos. Planos Professional e Enterprise têm suporte prioritário 24/7.",
    gratis:
      "Sim! O plano gratuito é permanente e inclui análise de até 100 conversas por mês. Sem cartão de crédito necessário.",
    default:
      "Entendi sua pergunta. Para uma resposta mais detalhada, gostaria de conectá-lo com um atendente humano? Clique em 'Falar com Atendente'.",
  };

  const getBotResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();

    if (
      lower.includes("preco") ||
      lower.includes("preço") ||
      lower.includes("custa") ||
      lower.includes("valor")
    ) {
      return botResponses.preco;
    }
    if (
      lower.includes("feature") ||
      lower.includes("funcionalidade") ||
      lower.includes("o que") ||
      lower.includes("sentimento")
    ) {
      return botResponses.features;
    }
    if (lower.includes("integra") || lower.includes("whatsapp")) {
      return botResponses.integracao;
    }
    if (lower.includes("suporte") || lower.includes("ajuda")) {
      return botResponses.suporte;
    }
    if (lower.includes("gratis") || lower.includes("gratuito")) {
      return botResponses.gratis;
    }

    return botResponses.default;
  };

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    if (loading) return;

    // Sentimento: API se logado, senão local
    let sentiment: Message["sentiment"];
    if (user) {
      try {
        const res = await sentimentMutation.mutateAsync({ message: text });
        sentiment = {
          sentiment: res.data.sentiment,
          score: res.data.score,
          urgency: res.data.urgency,
          tone: res.data.tone ?? "neutral",
          suggestedResponse: res.data.suggestedResponse,
        };
      } catch {
        sentiment = analyzeSentiment(text);
      }
    } else {
      sentiment = analyzeSentiment(text);
    }
    setCurrentSentiment(sentiment);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date(),
      sender: "Você",
      sentiment,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Resposta do bot: API se logado, senão respostas locais
    const conversationHistory = messages
      .filter((m) => m.type === "user" || m.type === "bot")
      .map((m) => ({
        role: m.type === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }))
      .slice(-20);

    let botContent: string;

    if (sentiment.sentiment === "negative" && sentiment.urgency === "high") {
      botContent =
        "Percebi que você pode estar insatisfeito. Gostaria de falar com um atendente humano para resolver seu problema? 🤝";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot" as const,
          content: botContent,
          timestamp: new Date(),
          sender: "Bot",
        },
      ]);
      setWaitingForHuman(true);
      setLoading(false);
      return;
    }

    if (user) {
      try {
        const res = await chatMutation.mutateAsync({
          message: text,
          context: { conversationHistory },
        });
        botContent = res.data?.response ?? getBotResponse(text);
      } catch (err) {
        console.error("[Chat] Erro na API:", err);
        toast.error("Resposta temporária. Faça login para usar o assistente completo.");
        botContent = getBotResponse(text);
      }
    } else {
      botContent = getBotResponse(text);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        type: "bot" as const,
        content: botContent,
        timestamp: new Date(),
        sender: "Bot",
      },
    ]);
    setLoading(false);
  };

  const connectToHuman = useCallback(() => {
    const humanMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "human",
      content:
        "Olá! Sou um atendente humano. Como posso ajudá-lo? 👋 Para abrir um ticket e receber resposta por email, use a página Suporte no menu.",
      timestamp: new Date(),
      sender: "Atendente",
    };
    setMessages((prev) => [...prev, humanMessage]);
    setMode("human");
    setWaitingForHuman(false);
  }, []);

  const openSupportPage = useCallback(() => {
    onOpenChange(false);
    navigate("/support");
  }, [navigate]);

  const sentimentLabel =
    currentSentiment?.sentiment === "positive"
      ? "Positivo"
      : currentSentiment?.sentiment === "negative"
        ? "Negativo"
        : "Neutro";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!h-dvh min-h-dvh max-h-dvh w-[95vw] sm:w-[560px] md:w-[600px] sm:max-w-[90vw] max-w-[95vw] rounded-l-2xl border-l border-slate-700/80 bg-slate-950 flex flex-col [&>div:first-child]:hidden">
        <DrawerHeader className="shrink-0 relative flex flex-col gap-4 px-5 py-5 pt-12 bg-slate-950 text-center md:text-center">
          <DrawerClose asChild>
            <button
              className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Fechar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </DrawerClose>
          {/* Logo – primeiro item */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center rounded-xl overflow-hidden bg-slate-950 shrink-0 mx-auto">
            <img
              src="/chatlead-pro-logo.png"
              alt="ChatLead Pro"
              width={112}
              height={112}
              className="w-full h-full object-contain"
            />
          </div>
          {/* Título – segundo item */}
          <DrawerTitle className="font-semibold text-white text-base">ChatLead Pro</DrawerTitle>
          {/* Subtítulo – terceiro item */}
          <p className="text-xs text-slate-400 -mt-2">
            {mode === "bot" ? "Assistente IA" : "Atendente"}
          </p>
        </DrawerHeader>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 bg-slate-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.type === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.type !== "user" && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    msg.type === "user"
                      ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-tr-md"
                      : "bg-slate-800/90 text-slate-100 rounded-tl-md border border-slate-700/50"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.sentiment && msg.type === "user" && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                          msg.sentiment.sentiment
                        )}`}
                      >
                        {getSentimentIcon(msg.sentiment.sentiment)}
                        {msg.sentiment.sentiment === "positive"
                          ? "Positivo"
                          : msg.sentiment.sentiment === "negative"
                            ? "Negativo"
                            : "Neutro"}
                      </span>
                      {msg.sentiment.urgency === "high" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          Urgente
                        </span>
                      )}
                    </div>
                  )}
                  <p
                    className={`text-[11px] mt-1.5 ${
                      msg.type === "user" ? "text-blue-200/80" : "text-slate-500"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-slate-400" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-slate-800/90 border border-slate-700/50">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sentiment bar - compact */}
          {currentSentiment && (
            <div className="shrink-0 px-4 py-2 border-t border-slate-800 bg-slate-900/80 flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getSentimentColor(
                  currentSentiment.sentiment
                )}`}
              >
                {getSentimentIcon(currentSentiment.sentiment)}
                {sentimentLabel}
              </span>
              <span className="text-xs text-slate-500">
                {(currentSentiment.score * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 capitalize">
                Urgência: {currentSentiment.urgency}
              </span>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 p-4 pt-3 border-t border-slate-800 bg-slate-900/95">
            {waitingForHuman ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={connectToHuman}
                  className="w-full rounded-xl h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Falar com atendente
                </Button>
                <Button
                  variant="outline"
                  onClick={openSupportPage}
                  className="w-full rounded-xl h-10 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Abrir ticket de suporte
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (loading) return;
                      handleSendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-xl h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
      </DrawerContent>
    </Drawer>
  );
}
