/**
 * Tipo do router tRPC usado pelo client.
 * Em build standalone (sem pasta backend), usamos um tipo genérico.
 * Para type-safety completo, o backend pode ser incluído no repo ou usar codegen.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppRouter = any;
