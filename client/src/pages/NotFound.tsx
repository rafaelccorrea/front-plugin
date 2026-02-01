import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <Card className="relative w-full max-w-lg mx-4 shadow-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <CardContent className="pt-10 pb-10 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center border border-red-500/30">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent mb-3">
            404
          </h1>

          <h2 className="text-2xl font-semibold text-white mb-4">
            Página Não Encontrada
          </h2>

          <p className="text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
            Desculpe, a página que você está procurando não existe.
            <br />
            Ela pode ter sido movida ou excluída.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-6 py-2.5 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir para Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
