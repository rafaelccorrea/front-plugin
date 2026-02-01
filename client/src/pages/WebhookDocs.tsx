import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Copy, Terminal, Code2, Globe, 
  ShieldCheck, Zap, Info, CheckCircle2, BookOpen
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function WebhookDocs() {
  const [, navigate] = useLocation();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const endpointUrl = typeof window !== "undefined" ? `${window.location.origin}/api/webhooks.externalLead` : "/api/webhooks.externalLead";

  return (
    <DashboardLayout>
      <div className="w-full pb-20 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/automations")}
              className="pl-0 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Automações
            </Button>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-primary" />
              Documentação do Webhook
            </h1>
            <p className="text-muted-foreground text-lg">
              Guia técnico para integração de leads externos via API.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Conteúdo */}
          <div className="lg:col-span-2 space-y-8">
            {/* Seção: Endpoint */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Globe className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Conexão</span>
                </div>
                <CardTitle>Endpoint de Integração</CardTitle>
                <CardDescription>Utilize este URL para enviar dados de qualquer plataforma externa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-xl border-2 group relative overflow-hidden">
                  <Badge className="bg-blue-600 text-white font-bold">POST</Badge>
                  <code className="text-sm font-mono truncate flex-1">{endpointUrl}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => copyToClipboard(endpointUrl)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border-2 border-primary/10 bg-primary/5">
                    <p className="text-xs font-bold uppercase text-primary mb-1">Header: Content-Type</p>
                    <code className="text-sm font-mono">application/json</code>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-primary/10 bg-primary/5 md:col-span-2">
                    <p className="text-xs font-bold uppercase text-primary mb-1">Autenticação (API Key)</p>
                    <p className="text-sm text-muted-foreground mb-1">Obrigatória. Pode ser enviada no body (<code className="font-mono">apiKey</code>) ou, recomendado no servidor, por header:</p>
                    <code className="text-xs font-mono block mt-1">Authorization: Bearer &lt;sua-api-key&gt;</code>
                    <code className="text-xs font-mono block">X-API-Key: &lt;sua-api-key&gt;</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção: Estrutura de Dados */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Code2 className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Payload</span>
                </div>
                <CardTitle>Estrutura do JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 font-bold">Campo</th>
                        <th className="pb-3 font-bold">Tipo</th>
                        <th className="pb-3 font-bold text-center">Obrigatório</th>
                        <th className="pb-3 font-bold">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-4 font-mono text-primary">apiKey</td>
                        <td className="py-4">string</td>
                        <td className="py-4 text-center"><Badge variant="destructive">Sim</Badge></td>
                        <td className="py-4 text-muted-foreground">Sua chave única de API.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-primary">name</td>
                        <td className="py-4">string</td>
                        <td className="py-4 text-center"><Badge variant="outline">Não</Badge></td>
                        <td className="py-4 text-muted-foreground">Nome completo do lead.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-primary">phone</td>
                        <td className="py-4">string</td>
                        <td className="py-4 text-center"><Badge variant="outline">Não</Badge></td>
                        <td className="py-4 text-muted-foreground">Telefone com DDD.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-primary">email</td>
                        <td className="py-4">string</td>
                        <td className="py-4 text-center"><Badge variant="outline">Não</Badge></td>
                        <td className="py-4 text-muted-foreground">E-mail do lead.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-primary">source</td>
                        <td className="py-4">string</td>
                        <td className="py-4 text-center"><Badge variant="outline">Não</Badge></td>
                        <td className="py-4 text-muted-foreground">Origem (ex: facebook_ads, site_vendas). Padrão: external_webhook.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-primary">notes</td>
                        <td className="py-4">string</td>
                        <td className="py-4 text-center"><Badge variant="outline">Não</Badge></td>
                        <td className="py-4 text-muted-foreground">Observações manuais.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-primary">conversation</td>
                        <td className="py-4">string</td>
                        <td className="py-4 text-center"><Badge variant="outline">Não</Badge></td>
                        <td className="py-4 text-muted-foreground font-bold">Ativa a análise por IA.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Seção: Exemplos */}
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="curl" className="font-bold">cURL / Terminal</TabsTrigger>
                <TabsTrigger value="json" className="font-bold">Exemplo JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <Card className="border-none shadow-xl bg-slate-950 text-slate-50">
                  <CardContent className="p-6">
                    <pre className="font-mono text-sm overflow-x-auto">
{`curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SUA_CHAVE_AQUI" \\
  -d '{
    "name": "João Silva",
    "phone": "11999999999",
    "source": "facebook_ads",
    "conversation": "Histórico de conversa opcional para análise por IA..."
  }'`}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="json">
                <Card className="border-none shadow-xl bg-slate-950 text-slate-50">
                  <CardContent className="p-6">
                    <pre className="font-mono text-sm overflow-x-auto">
{`{
  "apiKey": "SUA_CHAVE_AQUI",
  "name": "João Silva",
  "phone": "11999999999",
  "email": "joao@email.com",
  "source": "site_vendas",
  "notes": "Observações manuais aqui",
  "conversation": "Lead: Olá, gostaria de saber mais sobre o imóvel..."
}`}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Terminal className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Respostas</span>
                </div>
                <CardTitle>Respostas da API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-green-600 dark:text-green-400 mb-1">Sucesso (200)</p>
                  <pre className="p-3 bg-muted rounded-lg font-mono text-xs overflow-x-auto">{`{ "success": true, "message": "Lead captured successfully", "leadId": 123 }`}</pre>
                </div>
                <div>
                  <p className="font-bold text-red-600 dark:text-red-400 mb-1">API Key inválida ou ausente (401)</p>
                  <pre className="p-3 bg-muted rounded-lg font-mono text-xs overflow-x-auto">{`{ "error": { "message": "Invalid API Key", "code": "UNAUTHORIZED" } }`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral - Dicas & Status */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="h-24 w-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5" /> Poder da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <p className="text-sm opacity-90 leading-relaxed">
                  Ao enviar o campo <code className="bg-white/20 px-1 rounded">conversation</code>, nossa IA processa os dados automaticamente:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" /> EXTRAÇÃO DE DADOS
                  </li>
                  <li className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" /> QUALIFICAÇÃO DE PERFIL
                  </li>
                  <li className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" /> SCORE DE TEMPERATURA
                  </li>
                  <li className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" /> CHECKLIST AUTOMÁTICO
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <p>Nunca compartilhe sua <strong>API Key</strong> publicamente. Ela dá acesso direto à sua base de leads.</p>
                </div>
                <Separator />
                <p>Se sua chave for comprometida, você pode gerar uma nova em Configurações ou na página de Automações.</p>
                <p className="mt-2">Recomendado: envie a API Key por header (<code className="bg-muted px-1 rounded">Authorization: Bearer</code> ou <code className="bg-muted px-1 rounded">X-API-Key</code>) em vez do body, para não expor em logs.</p>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-muted/50 border-2 border-dashed border-muted flex flex-col items-center text-center space-y-3">
              <Terminal className="h-8 w-8 text-muted-foreground" />
              <h4 className="font-bold">Precisa de ajuda?</h4>
              <p className="text-xs text-muted-foreground">Nossa equipe técnica pode ajudar com integrações personalizadas.</p>
              <Button variant="outline" size="sm" className="w-full font-bold">Abrir Chamado</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
