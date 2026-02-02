import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MessageCircle,
  Zap,
  Users,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const captureMethods = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Conversas analisadas pela extensão no WhatsApp Web geram leads automaticamente.",
    color: "from-emerald-500/20 to-green-600/10 border-emerald-500/30",
    iconBg: "bg-emerald-500/15 text-emerald-500",
  },
  {
    icon: Zap,
    title: "Integrações",
    description: "Conecte APIs, webhooks e outras fontes para capturar leads em tempo real.",
    color: "from-amber-500/20 to-orange-600/10 border-amber-500/30",
    iconBg: "bg-amber-500/15 text-amber-500",
  },
  {
    icon: Users,
    title: "Lista de Leads",
    description: "Todos os leads capturados aparecem organizados na sua lista para acompanhamento.",
    color: "from-blue-500/20 to-indigo-600/10 border-blue-500/30",
    iconBg: "bg-blue-500/15 text-blue-500",
  },
];

export default function LeadNew() {
  const [, navigate] = useLocation();

  return (
    <DashboardLayout>
      <div className="w-full min-h-[calc(100vh-8rem)]">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/leads")}
          className="mb-8 pl-0 text-muted-foreground hover:text-foreground transition-colors -ml-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Leads
        </Button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 md:p-12 mb-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4 flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-4 w-4" /> Captura automática
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Como novos leads entram
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Leads são criados automaticamente quando há interação pelo WhatsApp ou pelas integrações. Não é preciso cadastrar manualmente — basta usar a extensão ou conectar suas fontes.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate("/leads")}
                  className="font-semibold h-12 px-6 shadow-lg shadow-primary/20"
                >
                  Ver lista de Leads
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/integrations")}
                  className="h-12 px-6 font-semibold border-2"
                >
                  <Zap className="h-4 w-4 mr-2" /> Integrações
                </Button>
              </div>
            </div>
            <div className="hidden lg:flex shrink-0 w-48 xl:w-56 h-48 xl:h-56 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
              <Users className="h-24 xl:h-28 w-24 xl:w-28 text-primary/60" />
            </div>
          </div>
        </div>

        {/* Cards: como capturar */}
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Canais de captura
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {captureMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Card
                key={method.title}
                className={`border bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 group cursor-default ${method.color}`}
              >
                <CardContent className="p-6">
                  <div
                    className={`inline-flex h-12 w-12 rounded-xl items-center justify-center mb-4 ${method.iconBg} group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{method.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {method.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA final */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Dúvidas sobre a extensão ou integrações?
          </p>
          <Button
            variant="link"
            className="text-primary font-semibold"
            onClick={() => navigate("/integrations")}
          >
            Acessar Integrações e documentação →
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
