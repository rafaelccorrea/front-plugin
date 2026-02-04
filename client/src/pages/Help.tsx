import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search, Mail, MessageSquare, BookOpen, Zap, RefreshCw, MousePointer } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const faqs = [
  {
    id: 1,
    question: "Como integrar meu WhatsApp?",
    answer: "Para integrar seu WhatsApp, acesse Configurações > Integrações > WhatsApp Business. Siga o passo a passo para conectar sua conta."
  },
  {
    id: 2,
    question: "Qual é o limite de leads por mês?",
    answer: "O limite depende do seu plano. Plano Gratis: 10 leads/mês, Starter: 100 leads/mês, Professional: 500 leads/mês, Enterprise: ilimitado."
  },
  {
    id: 3,
    question: "Como exportar meus leads?",
    answer: "Vá para a página de Leads, selecione os leads desejados e clique em 'Exportar'. Você pode exportar em CSV ou Excel."
  },
  {
    id: 4,
    question: "Posso mudar de plano a qualquer momento?",
    answer: "Sim! Você pode fazer upgrade ou downgrade de plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de cobrança."
  },
  {
    id: 5,
    question: "Como funciona a análise de sentimento?",
    answer: "Nosso sistema de IA analisa automaticamente as mensagens dos seus leads e classifica o sentimento como positivo, neutro ou negativo."
  },
  {
    id: 6,
    question: "Qual é o tempo de resposta do suporte?",
    answer: "Nosso time de suporte responde em até 24 horas para clientes dos planos Starter e Professional, e em até 2 horas para Enterprise."
  },
  {
    id: 7,
    question: "Como funciona a captura automática da extensão?",
    answer: "A captura automática funciona de duas formas: (1) Ao trocar de conversa no WhatsApp Web, a conversa anterior é enviada para análise. (2) A cada 30 minutos a extensão faz uma varredura das conversas do topo da lista (até 20) e envia para análise. Tudo isso ocorre mesmo com o popup da extensão fechado; basta a extensão estar ativa e você ter configurado a API Key."
  },
  {
    id: 8,
    question: "Preciso deixar o WhatsApp Web aberto para capturar leads?",
    answer: "Para a varredura periódica (a cada 30 min), a extensão precisa de uma aba do WhatsApp Web — se não houver, ela pode abrir uma em segundo plano. Para a captura ao trocar de conversa, é necessário ter o WhatsApp Web aberto na aba em que você está trocando de chat."
  },
];

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Header – público, sem necessidade de login */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between shrink-0">
          <button type="button" onClick={() => navigate("/")} className="flex items-center h-16 min-w-0">
            <img src="/chatlead-pro-logo.png" alt="ChatLead Pro" width={96} height={96} className="h-12 w-auto object-contain object-left sm:h-14" />
          </button>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" onClick={() => navigate("/pricing")}>
              Planos
            </Button>
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" className="border-slate-700 text-white hover:bg-slate-800" onClick={() => navigate("/leads")}>
                  Meus Leads
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white" onClick={() => navigate("/settings")}>
                  Configurações
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="border-slate-700 text-white hover:bg-slate-800" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white" onClick={() => navigate("/register")}>
                  Começar Grátis
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="relative max-w-4xl mx-auto px-4 py-10 sm:py-16">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Central de Ajuda</h1>
            <p className="text-slate-400 mt-1">
              Encontre respostas para suas dúvidas. Não precisa estar logado para consultar.
            </p>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar na central de ajuda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          <div className={`grid grid-cols-1 gap-4 ${isAuthenticated ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <Card
              className="bg-blue-500/10 border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors"
              onClick={() => navigate("/docs")}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Documentação</p>
                    <p className="text-sm text-slate-400">Guias e tutoriais</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAuthenticated && (
              <Card
                className="bg-purple-500/10 border-purple-500/20 cursor-pointer hover:bg-purple-500/20 transition-colors"
                onClick={() => navigate("/support")}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Chat de Suporte</p>
                      <p className="text-sm text-slate-400">Fale com nosso time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-sm text-slate-400">suporte@chatleadpro.com.br</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                Extensão Chrome: como funciona a captura
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                O ChatLead Pro captura leads do WhatsApp Web de três formas. Não é preciso deixar o popup da extensão aberto.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <MousePointer className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">1. Captura manual</h4>
                  <p className="text-slate-300 text-sm mt-1">
                    Abra uma conversa no WhatsApp Web, clique no ícone da extensão e em <strong>Analisar Conversa</strong>, ou use o atalho <strong>Ctrl+Shift+L</strong> (Windows) / <strong>Cmd+Shift+L</strong> (Mac). A conversa atual é enviada para análise e, se for um lead imobiliário, é salva no dashboard.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">2. Captura ao trocar de conversa</h4>
                  <p className="text-slate-300 text-sm mt-1">
                    Com o WhatsApp Web aberto (em qualquer aba), sempre que você <strong>trocar de chat</strong>, a conversa que você acabou de sair é enviada automaticamente para análise — desde que tenha pelo menos 3 mensagens e não seja grupo. O popup pode estar fechado; a extensão só precisa estar ativa e com a API Key configurada.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">3. Varredura periódica (últimas conversas)</h4>
                  <p className="text-slate-300 text-sm mt-1">
                    A cada <strong>30 minutos</strong> a extensão faz uma varredura das conversas do topo da lista do WhatsApp Web (até 20 conversas, ignorando grupos). Ela abre cada uma, lê as mensagens e envia para análise. Assim, mesmo que você não esteja na página ou em uma conversa específica, os leads das conversas recentes são capturados. Se não houver nenhuma aba do WhatsApp Web aberta, a extensão pode abrir uma em segundo plano para realizar a varredura. Cada contato não é enviado de novo nas 24 horas seguintes (evita duplicar lead).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-cyan-400" />
                Perguntas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id.toString()} className="border-slate-800">
                      <AccordionTrigger className="text-white hover:text-slate-300">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-300">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">Nenhuma pergunta encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Não encontrou o que procurava?</h3>
                <p className="text-slate-400 mb-4">
                  {isAuthenticated
                    ? "Entre em contato com nosso time de suporte. Estamos aqui para ajudar!"
                    : "Envie um email para suporte@chatleadpro.com.br ou faça login para acessar o chat de suporte."}
                </p>
                {isAuthenticated && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate("/support")}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contatar Suporte
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
