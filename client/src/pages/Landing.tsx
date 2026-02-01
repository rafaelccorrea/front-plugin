import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Zap, 
  TrendingUp, 
  Users, 
  Shield, 
  BarChart3, 
  Loader2,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Brain,
  Target
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [, navigate] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const checkoutMutation = trpc.checkout.createCheckoutSession.useMutation();
  const { isAuthenticated, loading } = useAuth();

  // Redirecionar usuários autenticados para Centro de Comando
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/command-center");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animação de digitação do bloco demo
  const DEMO_LINES: { type: string; label?: string; labelClass?: string; text: string }[] = [
    { type: "brain", text: "Analisando conversa com IA..." },
    { type: "data", label: "Nome:", labelClass: "text-cyan-400", text: " João Silva | Tel: (11) 99999-9999" },
    { type: "data", label: "Objetivo:", labelClass: "text-purple-400", text: " Comprar | Tipo: Apartamento | Bairro: Vila Mariana" },
    { type: "data", label: "Orçamento:", labelClass: "text-orange-400", text: " R$ 800.000 | Urgência: Alta | Score: 9.2/10" },
    { type: "success", text: "Lead qualificado e salvo no dashboard" },
  ];
  const [typingLine, setTypingLine] = useState(0);
  const [typingChar, setTypingChar] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    if (typingDone) return;
    const line = DEMO_LINES[typingLine];
    const delay = 28; // ms por caractere — digitação rápida
    const isLastLine = typingLine === DEMO_LINES.length - 1;
    const isLineComplete = typingChar >= line.text.length;

    const t = setTimeout(() => {
      if (isLineComplete) {
        if (isLastLine) {
          setTypingDone(true);
        } else {
          setTypingLine((l) => l + 1);
          setTypingChar(0);
        }
      } else {
        setTypingChar((c) => c + 1);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [typingLine, typingChar, typingDone]);

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const result = await checkoutMutation.mutateAsync({ 
        planId: planId as "starter" | "professional" | "enterprise",
        successUrl: `${window.location.origin}/checkout-success`,
        cancelUrl: `${window.location.origin}/pricing`
      });
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        console.error("Nenhuma URL de checkout retornada");
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated Background - menores em mobile para não sobrecarregar */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation – altura fixa; logo mantém tamanho e ultrapassa a barra sem alterar a altura do header */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 overflow-visible ${
          scrollY > 50 
            ? "bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl" 
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-20 px-3 sm:px-4 md:px-6 shrink-0">
          <div className="flex items-center min-h-0 group cursor-pointer shrink-0" onClick={() => navigate("/")}>
            <img
              src="/chatlead-pro-logo.png"
              alt="ChatLead Pro"
              width={160}
              height={160}
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-40 lg:h-40 min-w-[48px] min-h-[48px] object-contain object-left transform group-hover:scale-110 transition-transform"
            />
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-800/50 hover:text-blue-400 transition-all text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => navigate("/pricing")}
            >
              Planos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-800/50 hover:text-blue-400 transition-all text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => navigate("/documentation")}
            >
              Desenvolvedores
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-800/50 hover:text-blue-400 transition-all text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => navigate("/login")}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-1.5 md:py-2"
              onClick={() => navigate("/register")}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Começar Grátis</span>
              <span className="sm:hidden">Grátis</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - responsivo mobile */}
      <section className="relative pt-24 sm:pt-28 md:pt-36 lg:pt-40 pb-16 sm:pb-24 md:pb-32 px-3 sm:px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 animate-fade-in">
            <div className="mb-4 sm:mb-8 inline-block animate-bounce-slow">
              <span className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs sm:text-sm font-semibold backdrop-blur-sm shadow-lg shadow-blue-500/20 inline-flex items-center flex-wrap justify-center gap-1 sm:gap-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-center">Revolucione sua estratégia de vendas imobiliárias</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white mb-4 sm:mb-8 leading-tight animate-slide-up px-1">
              Transforme conversas
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 animate-gradient">
                em leads qualificados
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up delay-200 px-1">
              ChatLead Pro é a solução de IA que analisa conversas do WhatsApp em tempo real, extrai dados estruturados e qualifica leads automaticamente. 
              <span className="text-blue-400 font-semibold"> Maximize suas conversões com inteligência artificial.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-16 animate-slide-up delay-400 px-2">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-5 sm:px-10 sm:py-7 text-base sm:text-lg font-semibold shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all transform hover:scale-105 group w-full sm:w-auto"
                onClick={() => navigate("/register")}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-spin shrink-0" />
                Começar Agora - Grátis
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform shrink-0" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-slate-600 text-white hover:bg-slate-800/50 hover:border-blue-500 px-6 py-5 sm:px-10 sm:py-7 text-base sm:text-lg font-semibold backdrop-blur-sm transition-all transform hover:scale-105 w-full sm:w-auto"
                onClick={() => navigate("/pricing")}
              >
                Ver Todos os Planos
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto mb-12 sm:mb-20 animate-slide-up delay-600">
              {[
                { value: "10K+", label: "Leads Capturados", color: "from-blue-400 to-blue-600" },
                { value: "95%", label: "Taxa de Precisão", color: "from-cyan-400 to-cyan-600" },
                { value: "500+", label: "Usuários Ativos", color: "from-purple-400 to-purple-600" },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="group hover:scale-110 transition-transform cursor-default"
                >
                  <div className={`text-2xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${stat.color} mb-1 sm:mb-2 group-hover:animate-pulse`}>
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-xs sm:text-sm font-medium leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Hero Demo - padding e texto responsivos */}
            <div className="relative animate-slide-up delay-800 px-0 sm:px-2">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 blur-3xl rounded-full transform scale-150 pointer-events-none"></div>
              <div className="relative bg-slate-800/80 border-2 border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl hover:border-blue-500/50 transition-all transform hover:scale-[1.02]">
                <div className="bg-slate-900/90 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-left shadow-inner overflow-x-auto">
                  <div className="flex gap-2 mb-4 sm:mb-6">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-mono min-w-0">
                    {DEMO_LINES.map((line, i) => {
                      const isActive = i === typingLine && !typingDone;
                      const isVisible = i < typingLine || (i === typingLine && typingChar > 0) || typingDone;
                      const displayed = i < typingLine ? line.text : line.text.slice(0, typingChar);
                      const showCursor = isActive && (typingChar < line.text.length);

                      if (!isVisible && i > typingLine) return null;

                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 flex-wrap break-words ${i > 0 ? "pl-4 sm:pl-6 text-slate-400" : ""}`}
                        >
                          {line.type === "brain" && (
                            <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 animate-pulse shrink-0" />
                          )}
                          {line.type === "success" && (i === typingLine || typingDone) && (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                          )}
                          {line.label && <span className={line.labelClass}>{line.label}</span>}
                          <span className={line.type === "brain" ? "text-blue-400" : line.type === "success" ? "text-green-400 font-semibold" : ""}>
                            {displayed}
                            {showCursor && (
                              <span className="inline-block w-2 h-4 sm:h-[1.1em] bg-cyan-400 ml-0.5 animate-pulse align-middle" aria-hidden />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - responsivo mobile */}
      <section className="relative py-16 sm:py-24 md:py-32 px-3 sm:px-4 bg-slate-900/50 border-y border-slate-800/50">
        <div className="container">
          <div className="text-center mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 px-1">
              Recursos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Poderosos</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-2">
              Tudo que você precisa para transformar conversas em vendas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: Brain,
                title: "Análise com IA",
                description: "IA analisa conversas do WhatsApp instantaneamente e extrai dados estruturados",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: Target,
                title: "Score Inteligente",
                description: "Leads são automaticamente classificados como frio, morno ou quente",
                gradient: "from-cyan-500 to-purple-500",
              },
              {
                icon: Users,
                title: "Dashboard Completo",
                description: "Visualize, filtre e acompanhe todos os leads em tempo real",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "Segurança Total",
                description: "Criptografia end-to-end, autenticação segura e conformidade LGPD",
                gradient: "from-pink-500 to-red-500",
              },
              {
                icon: BarChart3,
                title: "Analytics Avançado",
                description: "Relatórios de conversão, ROI e tendências de leads capturados",
                gradient: "from-red-500 to-orange-500",
              },
              {
                icon: Sparkles,
                title: "Respostas Automáticas",
                description: "IA gera respostas personalizadas para cada lead automaticamente",
                gradient: "from-orange-500 to-yellow-500",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="group relative bg-slate-800/50 border-slate-700/50 hover:border-transparent transition-all duration-300 overflow-hidden backdrop-blur-sm hover:scale-105 hover:shadow-2xl cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative p-5 sm:p-6 md:p-8">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg`}>
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - responsivo mobile */}
      <section className="relative py-16 sm:py-24 md:py-32 px-3 sm:px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 px-1">
              Como <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Funciona</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-2">
              Simples, rápido e automatizado. Começar é fácil!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: "Instale a Extensão",
                description: "Adicione a extensão ChatLead Pro ao seu Chrome e conecte ao WhatsApp Web em segundos.",
                icon: Zap,
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                step: "02",
                title: "Converse Normalmente",
                description: "Continue suas conversas no WhatsApp como sempre. Nossa IA analisa tudo em tempo real.",
                icon: MessageSquare,
                gradient: "from-cyan-500 to-purple-500",
              },
              {
                step: "03",
                title: "Gerencie Leads",
                description: "Acesse o dashboard para visualizar leads qualificados, scores e respostas sugeridas pela IA.",
                icon: TrendingUp,
                gradient: "from-purple-500 to-pink-500",
              },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-slate-800/50 border-2 border-slate-700/50 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 pt-10 sm:pt-10 md:pt-8 hover:border-blue-500/50 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm">
                  <div className={`absolute top-4 left-4 sm:-top-4 sm:-left-4 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${step.gradient} rounded-lg sm:rounded-xl flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold shadow-2xl group-hover:scale-110 transition-transform`}>
                    {step.step}
                  </div>
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center mb-4 sm:mb-6 ml-auto group-hover:rotate-6 transition-all shadow-lg`}>
                    <step.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{step.title}</h3>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - responsivo mobile */}
      <section className="relative py-16 sm:py-24 md:py-32 px-3 sm:px-4 bg-slate-900/50 border-y border-slate-800/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 px-1">
              Por que <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">ChatLead Pro</span>?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-2">
              Transforme sua operação de vendas com tecnologia de ponta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                title: "Economize até 20 horas por semana",
                description: "Pare de copiar e colar informações manualmente. Nossa IA extrai e organiza tudo automaticamente.",
                icon: Zap,
                stat: "20h/semana",
              },
              {
                title: "Aumente a taxa de conversão em 40%",
                description: "Leads qualificados com score inteligente e respostas personalizadas aumentam suas vendas.",
                icon: TrendingUp,
                stat: "+40%",
              },
              {
                title: "Nunca perca um lead quente",
                description: "Sistema de priorização automática garante que você foque nos leads com maior potencial.",
                icon: Target,
                stat: "100%",
              },
              {
                title: "Dados sempre organizados",
                description: "Dashboard completo com filtros, busca e exportação. Todos os seus leads em um só lugar.",
                icon: BarChart3,
                stat: "Tudo",
              },
            ].map((benefit, i) => (
              <div key={i} className="bg-slate-800/50 border-2 border-slate-700/50 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 hover:border-blue-500/50 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm group">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                    <benefit.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-white">{benefit.title}</h3>
                      <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 shrink-0">
                        {benefit.stat}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - responsivo mobile */}
      <section className="relative py-16 sm:py-24 md:py-32 px-3 sm:px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 px-1">
              O que dizem nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">clientes</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-2">
              Corretores e imobiliárias que já transformaram suas vendas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                name: "Carlos Mendes",
                role: "Corretor Autônomo",
                text: "ChatLead Pro mudou minha forma de trabalhar. Antes eu perdia horas organizando contatos. Agora tudo é automático e minhas vendas dobraram!",
                rating: 5,
                avatar: "https://i.pravatar.cc/150?img=12",
              },
              {
                name: "Ana Paula Silva",
                role: "Gerente de Vendas - Imobiliária Premium",
                text: "A qualificação automática de leads é incrível. Nossa equipe agora foca apenas nos leads quentes e a produtividade aumentou 60%.",
                rating: 5,
                avatar: "https://i.pravatar.cc/150?img=5",
              },
              {
                name: "Roberto Alves",
                role: "Diretor Comercial - Grupo Invest",
                text: "Implementamos o ChatLead Pro em toda a equipe. O ROI foi imediato. Ferramenta essencial para quem quer escalar vendas.",
                rating: 5,
                avatar: "https://i.pravatar.cc/150?img=33",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm">
                <div className="p-5 sm:p-6 md:p-8">
                  <div className="flex gap-1 mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Sparkles key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
                    <div className="min-w-0">
                      <div className="text-white font-bold text-sm sm:text-base truncate">{testimonial.name}</div>
                      <div className="text-slate-400 text-xs sm:text-sm truncate">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - responsivo mobile */}
      <section className="relative py-16 sm:py-24 md:py-32 px-3 sm:px-4">
        <div className="container max-w-5xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 blur-3xl rounded-2xl sm:rounded-3xl pointer-events-none"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-4 sm:mb-6 px-1">
                Pronto para <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">10x</span> suas vendas?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-10 max-w-2xl mx-auto px-2">
                Junte-se a centenas de corretores que já transformaram suas vendas com IA
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 flex-wrap">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-5 sm:px-12 sm:py-7 text-base sm:text-lg font-bold shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all transform hover:scale-110 group w-full sm:w-auto"
                  onClick={() => navigate("/register")}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-spin shrink-0" />
                  Criar Conta Grátis
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform shrink-0" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 px-6 py-5 sm:px-10 sm:py-7 text-base sm:text-lg font-bold backdrop-blur-sm transition-all transform hover:scale-110 w-full sm:w-auto"
                  onClick={() => navigate("/pricing")}
                >
                  Ver planos e preços
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-5 sm:px-10 sm:py-7 text-base sm:text-lg font-bold backdrop-blur-sm transition-all transform hover:scale-110 w-full sm:w-auto"
                  onClick={() => navigate("/login")}
                >
                  Já tenho conta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - responsivo mobile */}
      <footer className="relative py-8 sm:py-12 px-3 sm:px-4 border-t border-slate-800/50 bg-slate-900/50">
        <div className="container text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 mb-4">
            <img
              src="/chatlead-pro-logo.png"
              alt="ChatLead Pro"
              width={160}
              height={160}
              className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain shrink-0"
            />
            <div className="text-lg sm:text-xl font-bold text-white">
              ChatLead <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Pro</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-4">
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="text-slate-400 hover:text-blue-400 text-xs sm:text-sm font-medium transition-colors"
            >
              Planos
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-slate-400 hover:text-blue-400 text-xs sm:text-sm font-medium transition-colors"
            >
              Entrar
            </button>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            © 2026 ChatLead Pro. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-800 { animation-delay: 0.8s; }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}
