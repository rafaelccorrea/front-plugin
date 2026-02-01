import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLogs() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Logs do Sistema</h1>
            <p className="text-slate-400 mt-1">Histórico de eventos e erros</p>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm text-slate-300 max-h-96 overflow-y-auto space-y-1">
              <div className="text-slate-500">[2024-01-30 15:30:45] INFO: Sistema iniciado</div>
              <div className="text-slate-500">[2024-01-30 15:31:12] INFO: Usuário rafael@chatleadpro.com.br fez login</div>
              <div className="text-slate-500">[2024-01-30 15:32:00] INFO: Novo lead criado (ID: 1234)</div>
              <div className="text-yellow-400">[2024-01-30 15:33:15] WARN: Taxa de API próxima ao limite</div>
              <div className="text-slate-500">[2024-01-30 15:34:22] INFO: Backup do banco de dados iniciado</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
