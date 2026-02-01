import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Code2,
  Globe,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  BookOpen,
  Link2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const BASE_PATH = "/api/webhooks.externalLead";

export default function Documentation() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const endpointUrl = `${baseUrl}${BASE_PATH}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const examplePayload = {
    apiKey: "SUA_CHAVE_AQUI",
    name: "João Silva",
    phone: "11999999999",
    email: "joao@email.com",
    source: "site_vendas",
    notes: "Observações manuais aqui",
    conversation: "Lead: Olá, gostaria de saber mais sobre o imóvel no Vila Mariana. Corretor: Claro! É um apartamento de 85m², 2 quartos.",
  };

  const exampleOutgoingPayload = {
    event: "lead.created",
    timestamp: new Date().toISOString(),
    data: { leadId: 123, name: "João", phone: "11999999999", email: "joao@email.com", source: "external_webhook", summary: null },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40 overflow-visible">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between shrink-0 gap-2">
          <button type="button" onClick={() => navigate("/")} className="flex items-center h-14 sm:h-16 min-w-0 shrink-0">
            <img src="/chatlead-pro-logo.png" alt="ChatLead Pro" className="h-10 sm:h-12 w-auto object-contain object-left" />
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800 text-xs sm:text-sm" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800 text-xs sm:text-sm" onClick={() => navigate("/pricing")}>
              Planos
            </Button>
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" className="border-slate-700 text-white hover:bg-slate-800 text-xs sm:text-sm hidden sm:inline-flex" onClick={() => navigate("/leads")}>
                  Meus Leads
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs sm:text-sm" onClick={() => navigate("/integrations")}>
                  Integrações
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="border-slate-700 text-white hover:bg-slate-800 text-xs sm:text-sm" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs sm:text-sm" onClick={() => navigate("/register")}>
                  Começar Grátis
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16 overflow-x-hidden">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3 flex-wrap">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 shrink-0" />
            Documentação da API
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Webhooks para enviar leads (entrada) e receber eventos em tempo real (saída). API Key em Configurações ou Integrações.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Webhook de entrada – Capturar lead */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-cyan-400 shrink-0" />
                Webhook de entrada – Capturar lead
              </h2>
              <Card className="bg-slate-900/50 border-slate-800 overflow-hidden min-w-0">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Endpoint</span>
                  </div>
                  <CardTitle className="text-white text-base sm:text-lg">POST – Capturar lead externo</CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    POST para este URL com JSON. API Key obrigatória (header ou body). Obtenha em Configurações ou Integrações (após login).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <div className="flex items-center gap-2 p-2 sm:p-4 bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden min-w-0">
                    <Badge className="bg-blue-600 text-white font-bold shrink-0 text-[10px] sm:text-xs">POST</Badge>
                    <code className="text-[10px] sm:text-sm font-mono text-slate-200 truncate flex-1 min-w-0">{endpointUrl}</code>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-slate-400 hover:text-white" onClick={() => copyToClipboard(endpointUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                      <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 mb-1">Header</p>
                      <code className="text-[10px] sm:text-sm font-mono text-cyan-300 break-all">Content-Type: application/json</code>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 sm:col-span-2">
                      <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 mb-1">Autenticação (API Key)</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mb-1 break-words">Obrigatória. No body (<code className="text-cyan-300">apiKey</code>) ou por header (recomendado): <code className="text-cyan-300 break-all">Authorization: Bearer &lt;key&gt;</code> ou <code className="text-cyan-300 break-all">X-API-Key: &lt;key&gt;</code>.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden min-w-0">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Code2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Payload (entrada)</span>
                </div>
                <CardTitle className="text-white text-sm sm:text-base">Campos do JSON</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-[11px] sm:text-sm text-left min-w-[280px]">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="pb-2 sm:pb-3 font-bold text-slate-300">Campo</th>
                        <th className="pb-2 sm:pb-3 font-bold text-slate-300 text-center">Obrig.</th>
                        <th className="pb-2 sm:pb-3 font-bold text-slate-300 hidden sm:table-cell">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="py-2 font-mono text-cyan-400">apiKey</td>
                        <td className="py-2 text-center"><Badge variant="destructive" className="text-[10px]">Sim</Badge></td>
                        <td className="py-2 text-slate-400 hidden sm:table-cell">Chave de API (Configurações/Integrações)</td>
                      </tr>
                      <tr><td className="py-2 font-mono text-cyan-400">name</td><td className="py-2 text-center"><Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">Não</Badge></td><td className="py-2 text-slate-400 hidden sm:table-cell">Nome do lead</td></tr>
                      <tr><td className="py-2 font-mono text-cyan-400">phone</td><td className="py-2 text-center"><Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">Não</Badge></td><td className="py-2 text-slate-400 hidden sm:table-cell">Telefone com DDD</td></tr>
                      <tr><td className="py-2 font-mono text-cyan-400">email</td><td className="py-2 text-center"><Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">Não</Badge></td><td className="py-2 text-slate-400 hidden sm:table-cell">E-mail</td></tr>
                      <tr><td className="py-2 font-mono text-cyan-400">source</td><td className="py-2 text-center"><Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">Não</Badge></td><td className="py-2 text-slate-400 hidden sm:table-cell">Origem (padrão: external_webhook)</td></tr>
                      <tr><td className="py-2 font-mono text-cyan-400">notes</td><td className="py-2 text-center"><Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">Não</Badge></td><td className="py-2 text-slate-400 hidden sm:table-cell">Observações</td></tr>
                      <tr><td className="py-2 font-mono text-cyan-400">conversation</td><td className="py-2 text-center"><Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">Não</Badge></td><td className="py-2 text-cyan-400/90 hidden sm:table-cell">Texto para análise por IA</td></tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="curl" className="w-full min-w-0">
              <TabsList className="grid w-full grid-cols-2 h-9 sm:h-11 bg-slate-800 border border-slate-700">
                <TabsTrigger value="curl" className="font-bold data-[state=active]:bg-slate-700 text-xs sm:text-sm">cURL</TabsTrigger>
                <TabsTrigger value="json" className="font-bold data-[state=active]:bg-slate-700 text-xs sm:text-sm">JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="curl" className="mt-3 min-w-0">
                <Card className="bg-slate-900/80 border-slate-700 overflow-hidden">
                  <CardContent className="p-3 sm:p-4 overflow-x-auto">
                    <pre className="font-mono text-[10px] sm:text-xs md:text-sm text-slate-300 whitespace-pre max-w-full">{`curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SUA_CHAVE_AQUI" \\
  -d '{"name":"João Silva","phone":"11999999999","email":"joao@email.com","source":"site_vendas","notes":"Observações","conversation":"Lead: Olá, gostaria de saber sobre o imóvel..."}'`}</pre>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="json" className="mt-3 min-w-0">
                <Card className="bg-slate-900/80 border-slate-700 overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <pre className="font-mono text-[10px] sm:text-xs md:text-sm text-slate-300 overflow-x-auto max-w-full">{JSON.stringify(examplePayload, null, 2)}</pre>
                    <Button variant="outline" size="sm" className="mt-2 sm:mt-3 border-slate-600 text-slate-300 text-xs" onClick={() => copyToClipboard(JSON.stringify(examplePayload, null, 2))}>
                      <Copy className="h-3 w-3 mr-2 shrink-0" /> Copiar JSON
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden min-w-0">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-base sm:text-lg">Respostas da API (entrada)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-[11px] sm:text-sm p-4 sm:p-6 pt-0">
                <div className="min-w-0">
                  <p className="font-semibold text-green-400 mb-1">Sucesso (200)</p>
                  <pre className="bg-slate-800 rounded p-2 sm:p-3 font-mono text-slate-300 text-[10px] sm:text-xs overflow-x-auto max-w-full">{`{ "success": true, "message": "Lead captured successfully", "leadId": 123 }`}</pre>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-red-400 mb-1">API Key inválida (401)</p>
                  <pre className="bg-slate-800 rounded p-2 sm:p-3 font-mono text-slate-300 text-[10px] sm:text-xs overflow-x-auto max-w-full">{`{ "error": { "message": "Invalid API Key", "code": "UNAUTHORIZED" } }`}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Webhook de saída – Receber eventos */}
            <section className="pt-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Link2 className="h-5 w-5 text-cyan-400 shrink-0" />
                Webhook de saída – Receber eventos
              </h2>
              <Card className="bg-slate-900/50 border-slate-800 overflow-hidden min-w-0">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg">Payload que sua URL recebe</CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm break-words">
                    Para planos Professional/Enterprise. Configure a URL em Integrações. O sistema envia POST com <code className="text-cyan-300">event</code>, <code className="text-cyan-300">timestamp</code>, <code className="text-cyan-300">data</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Eventos disponíveis</p>
                  <ul className="text-[11px] sm:text-xs text-slate-400 space-y-1">
                    <li><code className="text-cyan-400">lead.created</code> – Novo lead criado</li>
                    <li><code className="text-cyan-400">lead.updated</code> – Lead atualizado</li>
                    <li><code className="text-cyan-400">appointment.created</code> – Agendamento criado</li>
                    <li><code className="text-cyan-400">appointment.updated</code> – Agendamento atualizado</li>
                  </ul>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Segurança (obrigatório)</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 break-words">
                    Primeiro enviamos um <strong>challenge</strong>: <code className="text-cyan-400/90 break-all">{"{ type: \"webhook_challenge\", nonce, timestamp }"}</code>. Sua API deve responder com status 2xx e <code className="text-cyan-400/90 break-all">X-Webhook-Ack: &lt;nonce&gt;</code> ou body <code className="text-cyan-400/90 break-all">{"{ \"ack\": true, \"nonce\": \"&lt;nonce&gt;\" }"}</code>. Só então enviamos o payload real. Opcional: secret para assinatura <code className="text-cyan-400/90 break-all">X-Webhook-Signature: sha256=&lt;hmac&gt;</code>.
                  </p>
                  <pre className="p-2 sm:p-3 bg-slate-800 rounded-lg font-mono text-[10px] sm:text-xs text-slate-300 overflow-x-auto max-w-full">{JSON.stringify(exampleOutgoingPayload, null, 2)}</pre>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 text-[10px] sm:text-xs" onClick={() => copyToClipboard(JSON.stringify(exampleOutgoingPayload, null, 2))}>
                    <Copy className="h-3 w-3 mr-1 shrink-0" /> Copiar exemplo
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="space-y-6 min-w-0">
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardHeader className="p-4">
                <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 shrink-0" /> Campo <code className="text-cyan-300 text-xs sm:text-sm">conversation</code>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-[11px] sm:text-sm space-y-2 p-4 pt-0 break-words">
                <p>Se enviar <code className="text-cyan-300 bg-slate-800/50 px-1 rounded">conversation</code>, a IA do ChatLead Pro:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0" /> Extrai nome, telefone e e-mail</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0" /> Qualifica perfil (objetivo, tipo de imóvel, bairro, orçamento)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0" /> Gera score de temperatura</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0" /> Preenche checklist de qualificação</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="p-4">
                <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 shrink-0" /> Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400 text-[11px] sm:text-sm space-y-2 p-4 pt-0 break-words">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p>Não exponha a API Key em repositórios ou front-end. Use header <code className="text-cyan-300 break-all">Authorization: Bearer</code> ou <code className="text-cyan-300 break-all">X-API-Key</code> no servidor.</p>
                </div>
                <p>Webhook de saída: responda ao challenge com o nonce antes de receber os dados. Gere nova chave em Configurações se suspeitar de vazamento.</p>
              </CardContent>
            </Card>

            {!isAuthenticated && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 pb-6 px-4 text-center">
                  <p className="text-slate-400 text-xs sm:text-sm mb-3">Para obter sua API Key e configurar webhooks, crie uma conta.</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm w-full sm:w-auto" onClick={() => navigate("/register")}>
                    Criar conta grátis
                  </Button>
                </CardContent>
              </Card>
            )}
            {isAuthenticated && (
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 text-sm" onClick={() => navigate("/integrations")}>
                Configurar webhooks (Integrações)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
