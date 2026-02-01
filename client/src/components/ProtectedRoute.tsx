import { useAuth } from "@/hooks/useAuth";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2, ShieldAlert, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanId } from "@/hooks/usePlanFeatures";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user" | "any";
  redirectTo?: string;
}

/**
 * Componente para proteger rotas baseado em autenticação e role
 * 
 * @param requiredRole - "admin" para Master, "user" para Comprador, "any" para qualquer logado
 * @param redirectTo - Rota para redirecionar se não autorizado
 */
export function ProtectedRoute({ 
  children, 
  requiredRole = "any",
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation(redirectTo);
    }
  }, [loading, user, redirectTo, setLocation]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Acesso Restrito</h2>
            <p className="text-slate-400 mb-6">
              Você precisa estar logado para acessar esta página.
            </p>
            <Button 
              onClick={() => setLocation("/login")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role if required
  if (requiredRole !== "any" && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Acesso Negado</h2>
            <p className="text-slate-400 mb-6">
              {requiredRole === "admin" 
                ? "Esta área é restrita para administradores."
                : "Você não tem permissão para acessar esta página."
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Voltar
              </Button>
              <Button 
                onClick={() => setLocation("/command-center")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Componente específico para rotas de Admin (Master)
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Componente específico para rotas de Usuário (Comprador)
 */
export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="any">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Protege rota por plano mínimo. Exige login e redireciona para /pricing se o plano for inferior.
 */
export function PlanRoute({
  children,
  minimumPlan,
}: {
  children: React.ReactNode;
  minimumPlan: PlanId;
}) {
  return (
    <ProtectedRoute requiredRole="any" redirectTo="/login">
      <PlanRouteContent minimumPlan={minimumPlan}>{children}</PlanRouteContent>
    </ProtectedRoute>
  );
}

function PlanRouteContent({
  children,
  minimumPlan,
}: {
  children: React.ReactNode;
  minimumPlan: PlanId;
}) {
  const { hasMinimumPlan } = usePlanFeatures();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!hasMinimumPlan(minimumPlan)) {
      setLocation("/pricing");
    }
  }, [minimumPlan, hasMinimumPlan, setLocation]);

  if (!hasMinimumPlan(minimumPlan)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Upgrade necessário</h2>
            <p className="text-slate-400 mb-6">
              Este recurso está disponível a partir do plano {minimumPlan === "starter" ? "Starter" : minimumPlan === "professional" ? "Professional" : "Enterprise"}. Faça upgrade para acessar.
            </p>
            <Button
              onClick={() => setLocation("/pricing")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ver planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
