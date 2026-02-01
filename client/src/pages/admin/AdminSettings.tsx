import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save } from "lucide-react";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
          <p className="text-slate-400 mt-1">Gerencie as configurações gerais</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Settings */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Configurações de API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Chave de API Stripe</label>
                <Input 
                  type="password"
                  placeholder="sk_live_..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Webhook Secret</label>
                <Input 
                  type="password"
                  placeholder="whsec_..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Configurações de Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Email de Suporte</label>
                <Input 
                  type="email"
                  placeholder="suporte@chatleadpro.com.br"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Email de Notificações</label>
                <Input 
                  type="email"
                  placeholder="notificacoes@chatleadpro.com.br"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Settings */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-400" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Nome da Aplicação</label>
                <Input 
                  defaultValue="ChatLead Pro"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">URL Base</label>
                <Input 
                  defaultValue="https://chatleadpro.com.br"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
