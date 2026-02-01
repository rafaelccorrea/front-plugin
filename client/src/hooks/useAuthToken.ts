import { useEffect, useState } from 'react';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Hook para gerenciar tokens JWT no localStorage
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar token do localStorage ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  // Salvar token
  const saveToken = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setToken(accessToken);
  };

  // Remover token (logout)
  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
  };

  // Obter token
  const getToken = () => token;

  // Obter refresh token
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

  // Verificar se está autenticado
  const isAuthenticated = !!token;

  return {
    token,
    isLoading,
    isAuthenticated,
    saveToken,
    clearToken,
    getToken,
    getRefreshToken,
  };
}
