import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  User,
  Bot,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Zap,
} from "lucide-react";
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";
import { useEscalation, useWaitingQueue } from "@/hooks/useEscalation";

interface Message {
  id: string;
  type: "user" | "bot" | "human";
  content: string;
  timestamp: Date;
  sender?: string;
  sentiment?: {
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    confidence: number;
    urgency: "low" | "medium" | "high";
    tone: "friendly" | "frustrated" | "neutral" | "excited";
    suggestedResponse?: string;
    keywords: string[];
  };
}

type ChatMode = "closed" | "bot" | "human" | "waiting";

export default function LiveChatFinal() {
  const [isOpen, setIsOpen] = useState(false);
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
  const [currentSentiment, setCurrentSentiment] = useState<Message["sentiment"] | null>(null);
  const [conversationId] = useState(
    `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [assignedAttendant, setAssignedAttendant] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { analyze: analyzeSentiment } = useSentimentAnalysis();
  const { checkEscalation, createAlert, availableAttendants } = useEscalation();
  const { queue, estimatedWaitTime, addToQueue, removeFromQueue, getQueuePosition } =
    useWaitingQueue();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-300";
      case "negative":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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
    if (!input.trim()) return;

    setLoading(true);

    try {
      // FASE 1: Analisar sentimento
      const response = await analyzeSentiment.mutateAsync({
        message: input,
        conversationId,
      });
      const raw = response?.data ?? null;
      if (!raw) {
        setLoading(false);
        return;
      }
      const sentimentResult: Message["sentiment"] = {
        ...raw,
        tone: raw.tone ?? "neutral",
      };

      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: input,
        timestamp: new Date(),
        sender: "Você",
        sentiment: sentimentResult,
      };

      setMessages((prev) => [...prev, userMessage]);
      setCurrentSentiment(sentimentResult);
      setInput("");

      // FASE 2: Verificar se deve escalar
      const escalationResult = await checkEscalation.mutateAsync({
        sentiment: sentimentResult.sentiment,
        urgency: sentimentResult.urgency,
      });

      // Simular delay de resposta do bot
      setTimeout(async () => {
        if (escalationResult.shouldEscalate) {
          // Criar alerta
          await createAlert.mutateAsync({
            conversationId,
            messageId: userMessage.id,
            sentiment: sentimentResult.sentiment,
            urgency: sentimentResult.urgency,
          });

          // Mostrar mensagem de escalação
          const escalationMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: escalationResult.reason,
            timestamp: new Date(),
            sender: "Bot",
          };
          setMessages((prev) => [...prev, escalationMessage]);

          // Se há atendente disponível
          if (escalationResult.suggestedAttendant) {
            setAssignedAttendant(escalationResult.suggestedAttendant);
            const assignMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: "bot",
              content: `Conectando com ${escalationResult.suggestedAttendant.name}... Tempo estimado: ${escalationResult.estimatedWaitTime} minutos.`,
              timestamp: new Date(),
              sender: "Bot",
            };
            setMessages((prev) => [...prev, assignMessage]);
            setMode("waiting");
            addToQueue(conversationId);
          } else {
            // Adicionar à fila
            const queueMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: "bot",
              content: `Você foi adicionado à fila. Posição: ${queue.length + 1}. Tempo estimado: ${estimatedWaitTime} minutos.`,
              timestamp: new Date(),
              sender: "Bot",
            };
            setMessages((prev) => [...prev, queueMessage]);
            setMode("waiting");
            addToQueue(conversationId);
          }
        } else {
          // Resposta normal do bot
          const botResponse = getBotResponse(input);
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: botResponse,
            timestamp: new Date(),
            sender: "Bot",
          };
          setMessages((prev) => [...prev, botMessage]);
        }

        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      setLoading(false);

      // Fallback: resposta sem análise
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: getBotResponse(input),
        timestamp: new Date(),
        sender: "Bot",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    }
  };

  const connectToHuman = () => {
    const humanMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "human",
      content: `Olá! Sou ${assignedAttendant?.name || "um atendente"}. Como posso ajudá-lo? 👋`,
      timestamp: new Date(),
      sender: "Atendente",
    };

    setMessages((prev) => [...prev, humanMessage]);
    setMode("human");
    removeFromQueue(conversationId);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center gap-2 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="hidden group-hover:inline text-sm font-medium">
            Chat
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50 bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="w-5 h-5 text-white" />
                {mode === "waiting" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                )}
                {mode === "human" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">ChatLead Pro</h3>
                <p className="text-xs text-blue-100">
                  {mode === "bot"
                    ? "🤖 Bot Inteligente"
                    : mode === "waiting"
                      ? "⏳ Aguardando Atendente"
                      : "👤 Atendente"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-700 text-gray-100 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>

                  {/* Sentiment Badge */}
                  {msg.sentiment && msg.type === "user" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getSentimentColor(
                          msg.sentiment.sentiment
                        )}`}
                      >
                        {getSentimentIcon(msg.sentiment.sentiment)}
                        <span className="ml-1">
                          {msg.sentiment.sentiment === "positive"
                            ? "Positivo"
                            : msg.sentiment.sentiment === "negative"
                              ? "Negativo"
                              : "Neutro"}
                        </span>
                      </Badge>

                      {msg.sentiment.urgency !== "low" && (
                        <Badge
                          variant={
                            msg.sentiment.urgency === "high"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {msg.sentiment.urgency === "high"
                            ? "Urgente"
                            : "Média"}
                        </Badge>
                      )}
                    </div>
                  )}

                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-gray-100 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processando...</span>
                </div>
              </div>
            )}

            {mode === "waiting" && (
              <div className="flex justify-center">
                <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-400 px-4 py-2 rounded-lg text-sm text-center">
                  ⏳ Posição na fila: {getQueuePosition(conversationId)} | Tempo
                  estimado: {estimatedWaitTime} min
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Current Sentiment Display */}
          {currentSentiment && mode === "bot" && (
            <div
              className={`px-4 py-2 border-t border-slate-700 ${getSentimentColor(
                currentSentiment.sentiment
              )}`}
            >
              <p className="text-xs font-semibold">
                📊 Sentimento: {currentSentiment.sentiment} ({(
                  currentSentiment.score * 100
                ).toFixed(0)}%)
              </p>
              <p className="text-xs">Urgência: {currentSentiment.urgency}</p>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-700 p-4 bg-slate-800">
            {mode === "waiting" ? (
              <Button
                onClick={connectToHuman}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                Conectar com Atendente
              </Button>
            ) : mode === "human" ? (
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSendMessage()
                  }
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSendMessage()
                  }
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
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
        </Card>
      )}
    </>
  );
}
