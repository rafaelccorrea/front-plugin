/**
 * Base URL da API usada pelo frontend para todas as chamadas ao backend.
 * Em produção (ex.: Vercel) defina VITE_API_URL com a URL do deploy (ex.: https://seu-app.vercel.app).
 * Em dev pode ser http://localhost:5000 se o backend roda em outra porta.
 * Sem barra no final.
 */
export function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL ?? "";
  return typeof base === "string" ? base.replace(/\/$/, "") : "";
}

/**
 * Retorna a URL absoluta de uma rota da API.
 * Se VITE_API_URL estiver definida, usa ela; senão usa path relativo (mesmo origin).
 */
export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}
