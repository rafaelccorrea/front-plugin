import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Volume2, VolumeX, Bell, AlertCircle } from "lucide-react";

export function NotificationPreferences() {
  const { preferences, toggleSound, toggleAnimation, toggleToast } =
    useNotificationPreferences();

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="h-5 w-5" />
          Preferências de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Som de Notificação */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            {preferences.soundEnabled ? (
              <Volume2 className="h-5 w-5 text-green-400" />
            ) : (
              <VolumeX className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <label className="text-sm font-medium text-slate-200">
                Som de Notificação
              </label>
              <p className="text-xs text-slate-400 mt-1">
                Reproduzir som quando novas mensagens de suporte chegarem
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.soundEnabled}
            onCheckedChange={toggleSound}
          />
        </div>

        {/* Animação de Badge */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-400" />
            <div>
              <label className="text-sm font-medium text-slate-200">
                Animação de Badge
              </label>
              <p className="text-xs text-slate-400 mt-1">
                Animar o badge de notificações no menu lateral
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.animationEnabled}
            onCheckedChange={toggleAnimation}
          />
        </div>

        {/* Toast de Notificação */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-purple-400" />
            <div>
              <label className="text-sm font-medium text-slate-200">
                Notificação Toast
              </label>
              <p className="text-xs text-slate-400 mt-1">
                Exibir notificação em popup na tela
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.toastEnabled}
            onCheckedChange={toggleToast}
          />
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-200">
              Suas preferências de notificação são salvas automaticamente no seu
              navegador.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
