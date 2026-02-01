import { useAuth } from "@/hooks/useAuth";

/**
 * Hook para verificar se o usuário atual é administrador (Master)
 * 
 * Usuário Master (admin): Você - gerencia todo o sistema
 * Usuário Comprador (user): Clientes - usam o sistema
 */
export function useIsAdmin() {
  const { user, loading } = useAuth();
  
  return {
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user",
    role: user?.role || null,
    loading,
    user,
  };
}

/**
 * Hook para verificar se o usuário tem uma role específica
 */
export function useHasRole(requiredRole: "admin" | "user") {
  const { user, loading } = useAuth();
  
  return {
    hasRole: user?.role === requiredRole,
    loading,
    user,
  };
}
