import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { apiUrl } from "@/lib/apiBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CaptureConfig = {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  buttonText: string;
  thankYouMessage: string;
  showPoweredBy: boolean;
  quotaExceeded: boolean;
};

export default function CaptureForm() {
  const [, params] = useRoute("/capture/:token");
  const token = params?.token ?? "";

  const [config, setConfig] = useState<CaptureConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Link inválido.");
      return;
    }
    let cancelled = false;
    fetch(apiUrl(`/api/capture/config/${token}`))
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Formulário não encontrado.");
          throw new Error("Erro ao carregar formulário.");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setConfig({
            companyName: data.companyName ?? "Contato",
            logoUrl: data.logoUrl ?? null,
            primaryColor: data.primaryColor ?? "#2563eb",
            buttonText: data.buttonText ?? "Enviar",
            thankYouMessage: data.thankYouMessage ?? "Obrigado! Entraremos em contato em breve.",
            showPoweredBy: data.showPoweredBy !== false,
            quotaExceeded: !!data.quotaExceeded,
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Erro ao carregar.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/capture"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          setSubmitError("No momento não estamos aceitando novos contatos. Tente novamente mais tarde.");
          return;
        }
        setSubmitError(data?.error?.message ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-slate-300 text-center">{error ?? "Formulário não encontrado."}</div>
      </div>
    );
  }

  if (config.quotaExceeded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl bg-slate-800/80 border border-slate-700 p-6 text-center">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="" className="h-14 w-auto mx-auto mb-4 object-contain" />
          ) : (
            <h1 className="text-xl font-semibold text-white mb-4">{config.companyName}</h1>
          )}
          <p className="text-slate-300">
            No momento não estamos aceitando novos contatos. Tente novamente mais tarde.
          </p>
          {config.showPoweredBy && (
            <p className="text-slate-500 text-sm mt-6">Powered by ChatLead</p>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl bg-slate-800/80 border border-slate-700 p-6 text-center">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="" className="h-14 w-auto mx-auto mb-4 object-contain" />
          ) : (
            <h1 className="text-xl font-semibold text-white mb-4">{config.companyName}</h1>
          )}
          <p className="text-slate-300">{config.thankYouMessage}</p>
          {config.showPoweredBy && (
            <p className="text-slate-500 text-sm mt-6">Powered by ChatLead</p>
          )}
        </div>
      </div>
    );
  }

  const primaryHex = config.primaryColor || "#2563eb";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl bg-slate-800/80 border border-slate-700 p-6 shadow-xl">
        <div className="text-center mb-6">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="" className="h-14 w-auto mx-auto object-contain" />
          ) : (
            <h1 className="text-xl font-semibold text-white">{config.companyName}</h1>
          )}
          <p className="text-slate-400 text-sm mt-2">Preencha seus dados para entrarmos em contato.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-300">Nome *</Label>
            <Input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-slate-300">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-slate-300">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              placeholder="seu@email.com"
            />
          </div>
          {submitError && (
            <p className="text-sm text-red-400">{submitError}</p>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full font-semibold"
            style={{ backgroundColor: primaryHex }}
          >
            {submitting ? "Enviando..." : config.buttonText}
          </Button>
        </form>

        {config.showPoweredBy && (
          <p className="text-slate-500 text-xs text-center mt-6">Powered by ChatLead</p>
        )}
      </div>
    </div>
  );
}
