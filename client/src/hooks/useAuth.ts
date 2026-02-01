import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const REFRESH_TOKEN_KEY = "refresh_token";
const AUTH_TOKEN_KEY = "auth_token";
const API_BASE = import.meta.env.VITE_API_URL ?? "";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
  requireAdmin?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/", requireAdmin = false } =
    options ?? {};
  const queryClient = useQueryClient();
  const silentRefreshAttemptedRef = useRef(false);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.setQueryData([["auth", "me"], { type: "query" }], null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      queryClient.setQueryData([["auth", "me"], { type: "query" }], null);
      await queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      silentRefreshAttemptedRef.current = false;
    }
  }, [logoutMutation, queryClient]);

  const state = useMemo(() => {
    localStorage.setItem(
      "app-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending || isSilentRefreshing,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    isSilentRefreshing,
  ]);

  // Quando temos refresh_token mas auth.me retornou null (ex.: token expirado), tentar refresh silencioso
  useEffect(() => {
    if (meQuery.data != null) {
      silentRefreshAttemptedRef.current = false;
      return;
    }
    if (meQuery.isLoading || meQuery.isFetching) return;
    if (typeof window === "undefined") return;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken || silentRefreshAttemptedRef.current) return;

    silentRefreshAttemptedRef.current = true;
    setIsSilentRefreshing(true);

    const url = API_BASE ? `${API_BASE}/api/auth/refresh` : "/api/auth/refresh";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    })
      .then((res) => {
        if (!res.ok) return;
        return res.json() as Promise<{ accessToken?: string }>;
      })
      .then((data) => {
        const accessToken = data?.accessToken;
        if (!accessToken) return;
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
        window.dispatchEvent(new StorageEvent("storage", { key: AUTH_TOKEN_KEY, newValue: accessToken }));
        void queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });
      })
      .finally(() => {
        setIsSilentRefreshing(false);
      });
  }, [meQuery.data, meQuery.isLoading, meQuery.isFetching, queryClient]);

  useEffect(() => {
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (typeof window === "undefined") return;

    // Verificar se requer admin
    if (requireAdmin && state.user && state.user.role !== "admin") {
      window.location.href = "/";
      return;
    }

    // Redirecionar se não autenticado
    if (!redirectOnUnauthenticated) return;
    if (state.user) return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
    requireAdmin,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
