import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { STRIPE_PLANS } from "@shared/stripe-plans";
import { formatBRL } from "@/lib/utils";

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedPlan) return;

    if (selectedPlan === "free") {
      navigate("/command-center");
    } else {
      navigate(`/checkout/${selectedPlan}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <img src="/chatlead-pro-logo.png" alt="ChatLead Pro" className="w-10 h-10" />
            <span className="text-2xl font-bold text-white">ChatLead Pro</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Bem-vindo ao ChatLead Pro
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Olá, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{user?.name}</span>!
          </h1>
          <p className="text-xl text-slate-400 mb-2">
            Escolha o plano perfeito para começar a capturar leads imobiliários com IA
          </p>
          <p className="text-slate-500">
            Você pode trocar de plano a qualquer momento
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Free Plan */}
          <Card
            className={`relative flex flex-col cursor-pointer transition-all bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 ${
              selectedPlan === "free"
                ? "ring-2 ring-blue-500 border-blue-500"
                : ""
            }`}
            onClick={() => setSelectedPlan("free")}
          >
            {selectedPlan === "free" && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-blue-500 text-white">Selecionado</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg text-white">{STRIPE_PLANS.FREE.name}</CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {STRIPE_PLANS.FREE.description}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <div className="text-3xl font-bold text-white">Grátis</div>
                <p className="text-sm text-slate-500">para sempre</p>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                {STRIPE_PLANS.FREE.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  selectedPlan === "free"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                }`}
                variant={selectedPlan === "free" ? "default" : "outline"}
              >
                {selectedPlan === "free" ? "Selecionado" : "Selecionar"}
              </Button>
            </CardContent>
          </Card>

          {/* Starter Plan */}
          <Card
            className={`relative flex flex-col cursor-pointer transition-all bg-slate-900/50 backdrop-blur-sm border-2 ${
              selectedPlan === "starter"
                ? "border-cyan-500 ring-2 ring-cyan-500"
                : "border-cyan-500/30 hover:border-cyan-500/50"
            }`}
            onClick={() => setSelectedPlan("starter")}
          >
            {selectedPlan === "starter" && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-cyan-500 text-white">Selecionado</Badge>
              </div>
            )}
            <div className="absolute -top-3 left-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Recomendado</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-white">{STRIPE_PLANS.STARTER.name}</CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {STRIPE_PLANS.STARTER.description}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <div className="text-3xl font-bold text-white">
                  {formatBRL(STRIPE_PLANS.STARTER.price!)}
                </div>
                <p className="text-sm text-slate-500">por mês</p>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                {STRIPE_PLANS.STARTER.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  selectedPlan === "starter"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                }`}
                variant={selectedPlan === "starter" ? "default" : "outline"}
              >
                {selectedPlan === "starter" ? "Selecionado" : "Selecionar"}
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card
            className={`relative flex flex-col cursor-pointer transition-all bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 ${
              selectedPlan === "professional"
                ? "ring-2 ring-purple-500 border-purple-500"
                : ""
            }`}
            onClick={() => setSelectedPlan("professional")}
          >
            {selectedPlan === "professional" && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-purple-500 text-white">Selecionado</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg text-white">
                {STRIPE_PLANS.PROFESSIONAL.name}
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {STRIPE_PLANS.PROFESSIONAL.description}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <div className="text-3xl font-bold text-white">
                  {formatBRL(STRIPE_PLANS.PROFESSIONAL.price!)}
                </div>
                <p className="text-sm text-slate-500">por mês</p>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                {STRIPE_PLANS.PROFESSIONAL.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  selectedPlan === "professional"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                }`}
                variant={selectedPlan === "professional" ? "default" : "outline"}
              >
                {selectedPlan === "professional" ? "Selecionado" : "Selecionar"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedPlan}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
          >
            Continuar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/pricing")}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Ver Todos os Planos
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center backdrop-blur-sm">
          <p className="text-blue-300 mb-2">
            <span className="font-semibold">💡 Dica:</span> Comece com o plano gratuito e faça upgrade quando precisar de mais leads e chamadas de API.
          </p>
          <p className="text-sm text-blue-400/80">
            Todos os planos incluem acesso completo ao dashboard e suporte por email.
          </p>
        </div>
      </div>
    </div>
  );
}
