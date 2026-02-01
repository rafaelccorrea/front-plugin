import { httpBatchLink } from '@trpc/client';

/**
 * Criar link tRPC com suporte a JWT token
 * Adiciona o token JWT ao header Authorization de todas as requisições
 */
export function createTrpcLink() {
  return httpBatchLink({
    url: `${import.meta.env.VITE_API_URL || ''}/trpc`,
    headers() {
      const token = localStorage.getItem('auth_token');
      return {
        ...(token && { authorization: `Bearer ${token}` }),
      };
    },
  });
}
