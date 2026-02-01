import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    if (!token) {
      toast.error("Token de verificação inválido");
      setIsVerifying(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const result = await verifyEmailMutation.mutateAsync({ token });
        toast.success(result.message);
        setIsSuccess(true);
      } catch (error: any) {
        toast.error(error.message || "Erro ao verificar email");
        setIsSuccess(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <div className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Verificando seu email...
            </h1>
            <p className="text-slate-400">
              Por favor, aguarde enquanto verificamos seu email.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Email verificado com sucesso! 🎉
            </h1>
            <p className="text-slate-400 mb-6">
              Sua conta foi ativada. Você já pode fazer login e começar a usar o ChatLead Pro.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
              onClick={() => navigate("/login")}
            >
              Fazer Login
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-600 text-white hover:bg-slate-700"
              onClick={() => navigate("/")}
            >
              Voltar para Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Erro na verificação
          </h1>
          <p className="text-slate-400 mb-6">
            O link de verificação é inválido ou expirou. Por favor, solicite um novo link de verificação.
          </p>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
            onClick={() => navigate("/login")}
          >
            Ir para Login
          </Button>
          <p className="text-sm text-slate-500">
            Você pode solicitar um novo link de verificação na página de login.
          </p>
        </div>
      </Card>
    </div>
  );
}
