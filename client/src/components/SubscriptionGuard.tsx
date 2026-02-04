import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const BLOCKING_STATUSES = ["past_due", "canceled", "unpaid"];

const ALLOWED_PATHS_WHEN_EXPIRED = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/pricing",
  "/minha-assinatura",
  "/checkout-success",
  "/capture",
];

function isAllowedPath(pathname: string): boolean {
  if (ALLOWED_PATHS_WHEN_EXPIRED.some((p) => pathname === p)) return true;
  if (pathname.startsWith("/checkout/")) return true;
  if (pathname.startsWith("/capture/")) return true;
  return false;
}

/**
 * Quando a assinatura está expirada ou com pagamento pendente, redireciona
 * o usuário para /minha-assinatura, exceto em rotas permitidas (login, pricing, checkout, etc).
 */
export function SubscriptionGuard() {
  const { user, loading } = useAuth();
  const [pathname, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    const status = user.subscriptionStatus as string | undefined;
    if (!status || !BLOCKING_STATUSES.includes(status)) return;
    if (isAllowedPath(pathname)) return;
    setLocation("/minha-assinatura");
  }, [loading, user, pathname, setLocation]);

  return null;
}
