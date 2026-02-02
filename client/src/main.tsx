import { apiUrl, getApiBase } from "@/lib/apiBase";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";

import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Redireciona para login quando a sessão expirou ou o usuário acessa rota protegida sem estar logado
  const currentPath = window.location.pathname;
  if (currentPath !== "/login" && currentPath !== "/register" && !currentPath.startsWith("/verify-email") && !currentPath.startsWith("/reset-password")) {
    window.location.href = "/login";
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Listener para mudanças de token
let lastToken: string | null = null;
window.addEventListener('storage', (e) => {
  if (e.key === 'auth_token') {
    const newToken = localStorage.getItem('auth_token');
    if (newToken !== lastToken) {
      lastToken = newToken;
      // Invalidar cache quando token mudar
      queryClient.clear();
      console.log('[Auth] Token atualizado, cache invalidado');
    }
  }
});

// Função para obter token com fallback
function getAuthToken(): string | undefined {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      lastToken = token;
      return token;
    }
  } catch (e) {
    console.warn('[Auth] Erro ao obter token do localStorage:', e);
  }
  return undefined;
}

const AUTH_REFRESH_KEY = 'refresh_token';

async function fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
  if (res.status !== 401) return res;

  try {
    const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
    if (!refreshToken) return res;

    const refreshRes = await globalThis.fetch(apiUrl("/api/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) return res;

    const data = (await refreshRes.json()) as { accessToken?: string };
    const accessToken = data?.accessToken;
    if (!accessToken) return res;

    localStorage.setItem("auth_token", accessToken);
    lastToken = accessToken;
    window.dispatchEvent(new StorageEvent("storage", { key: "auth_token", newValue: accessToken }));

    const newHeaders = new Headers(init?.headers);
    newHeaders.set("authorization", `Bearer ${accessToken}`);
    return globalThis.fetch(input, { ...(init ?? {}), headers: newHeaders, credentials: "include" });
  } catch {
    return res;
  }
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl("/api/trpc"),
      transformer: superjson,
      headers() {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers["authorization"] = `Bearer ${token}`;
        return headers;
      },
      fetch: fetchWithRefresh,
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <App />
    </trpc.Provider>
  </QueryClientProvider>
);
