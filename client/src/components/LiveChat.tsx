import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "bot" | "human";
  content: string;
  timestamp: Date;
  sender?: string;
}

type ChatMode = "closed" | "bot" | "human";

export default function LiveChat() {
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
  const [waitingForHuman, setWaitingForHuman] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const botResponses: Record<string, string> = {
    preco: "Nossos planos começam em $29/mês para o Starter. Temos também planos Professional ($99/mês) e Enterprise (customizado). Quer saber mais detalhes?",
    features:
      "ChatLead Pro oferece: análise de conversas em tempo real, extração de dados estruturados, qualificação automática de leads, integração com WhatsApp, dashboard completo e muito mais!",
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
      lower.includes("o que")
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

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simular delay de resposta do bot
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: getBotResponse(input),
        timestamp: new Date(),
        sender: "Bot",
      };
      setMessages((prev) => [...prev, botResponse]);
      setLoading(false);
    }, 800);
  };

  const handleConnectHuman = () => {
    setMode("human");
    setWaitingForHuman(true);

    const systemMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content:
        "Conectando você com um atendente... Por favor, aguarde. Tempo médio de espera: 2 minutos.",
      timestamp: new Date(),
      sender: "Sistema",
    };

    setMessages((prev) => [...prev, systemMessage]);

    // Simular conexão com atendente após 3 segundos
    setTimeout(() => {
      setWaitingForHuman(false);
      const humanMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "human",
        content:
          "Olá! Meu nome é Carlos. Como posso ajudá-lo com o ChatLead Pro?",
        timestamp: new Date(),
        sender: "Carlos - Atendente",
      };
      setMessages((prev) => [...prev, humanMessage]);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all transform hover:scale-110 z-40 group"
      >
        <MessageCircle className="w-8 h-8 group-hover:animate-bounce" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-800/95 border-slate-700/50 shadow-2xl shadow-blue-500/20 flex flex-col z-40 backdrop-blur-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-white font-bold">ChatLead Pro</h3>
            <p className="text-xs text-blue-100">
              {mode === "bot" ? "Bot de IA" : "Atendente Disponível"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 p-1 rounded transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex gap-2 max-w-xs ${
                msg.type === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.type === "user"
                    ? "bg-blue-600"
                    : msg.type === "bot"
                      ? "bg-cyan-600"
                      : "bg-purple-600"
                }`}
              >
                {msg.type === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : msg.type === "bot" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <Phone className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="flex flex-col">
                <p className="text-xs text-slate-400 mb-1">{msg.sender}</p>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-700 text-slate-100 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {msg.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-700 px-4 py-2 rounded-lg rounded-bl-none">
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
              </div>
            </div>
          </div>
        )}

        {waitingForHuman && (
          <div className="flex justify-center">
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              <Clock className="w-3 h-3 mr-1" />
              Conectando com atendente...
            </Badge>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      {mode === "bot" && !waitingForHuman && (
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/50">
          <Button
            size="sm"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
            onClick={handleConnectHuman}
          >
            <Phone className="w-3 h-3 mr-1" />
            Falar com Atendente
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 text-sm"
            disabled={loading || waitingForHuman}
          />
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
