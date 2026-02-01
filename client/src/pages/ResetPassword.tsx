import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  const validateTokenQuery = trpc.auth.validateResetToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    if (!token) {
      toast.error("Token inválido");
      navigate("/forgot-password");
      return;
    }

    if (validateTokenQuery.data) {
      setIsValidating(false);
      if (validateTokenQuery.data.valid) {
        setIsValidToken(true);
      } else {
        toast.error(validateTokenQuery.data.message);
        setTimeout(() => navigate("/forgot-password"), 2000);
      }
    }

    if (validateTokenQuery.error) {
      setIsValidating(false);
      toast.error("Erro ao validar token");
      setTimeout(() => navigate("/forgot-password"), 2000);
    }
  }, [token, validateTokenQuery.data, validateTokenQuery.error, navigate]);

  // Password validation
  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
    { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Uma letra minúscula", test: (p: string) => /[a-z]/.test(p) },
    { label: "Um número", test: (p: string) => /[0-9]/.test(p) },
    { label: "Um caractere especial", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!token) {
      toast.error("Token inválido");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordMutation.mutateAsync({
        token,
        password,
      });
      toast.success(result.message);
      setShowSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Validando token...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Senha redefinida!
            </h1>
            <p className="text-slate-400 mb-6">
              Sua senha foi redefinida com sucesso. Você já pode fazer login com sua nova senha.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/login")}
            >
              Ir para Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Token inválido ou expirado
            </h1>
            <p className="text-slate-400 mb-6">
              O link de recuperação de senha é inválido ou expirou. Por favor, solicite um novo link.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/forgot-password")}
            >
              Solicitar novo link
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Redefinir senha
            </h1>
            <p className="text-slate-400">
              Digite sua nova senha abaixo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-white">
                Nova senha
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                  required
                />
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center text-xs">
                      {req.test(password) ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-3 h-3 text-slate-500 mr-2" />
                      )}
                      <span className={req.test(password) ? "text-green-500" : "text-slate-500"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-white">
                Confirmar nova senha
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir senha"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
