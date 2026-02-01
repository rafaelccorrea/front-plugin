import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { DowngradeValidation } from "@/hooks/usePlanValidation";

interface DowngradeWarningDialogProps {
  isOpen: boolean;
  currentPlan: string;
  targetPlan: string;
  validation: DowngradeValidation;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DowngradeWarningDialog({
  isOpen,
  currentPlan,
  targetPlan,
  validation,
  onConfirm,
  onCancel,
  isLoading = false,
}: DowngradeWarningDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    if (validation.canDowngrade) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {validation.canDowngrade ? (
              <AlertCircle className="h-6 w-6 text-yellow-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-400" />
            )}
            <AlertDialogTitle className="text-white">
              {validation.canDowngrade
                ? "Confirmar Downgrade de Plano"
                : "Não é Possível Fazer Downgrade"}
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="space-y-4 text-slate-300">
            <p>
              Você está tentando fazer downgrade de <span className="font-semibold text-white">{currentPlan}</span> para{" "}
              <span className="font-semibold text-white">{targetPlan}</span>.
            </p>

            {/* Errors */}
            {validation.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Problemas Encontrados:
                </h4>
                <ul className="space-y-1 text-sm">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-red-300 flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Avisos:
                </h4>
                <ul className="space-y-1 text-sm">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-300 flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Affected Resources */}
            {(validation.affectedResources.leadsToDelete > 0 ||
              validation.affectedResources.automationsToDelete > 0 ||
              validation.affectedResources.teamMembersToRemove > 0) && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-400">Recursos que Serão Afetados:</h4>
                <ul className="space-y-1 text-sm">
                  {validation.affectedResources.leadsToDelete > 0 && (
                    <li className="text-blue-300 flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>
                        {validation.affectedResources.leadsToDelete} leads serão deletados automaticamente
                      </span>
                    </li>
                  )}
                  {validation.affectedResources.automationsToDelete > 0 && (
                    <li className="text-blue-300 flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>
                        {validation.affectedResources.automationsToDelete} automações serão deletadas
                      </span>
                    </li>
                  )}
                  {validation.affectedResources.teamMembersToRemove > 0 && (
                    <li className="text-blue-300 flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>
                        {validation.affectedResources.teamMembersToRemove} membros da equipe serão removidos
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Acknowledgment */}
            {validation.canDowngrade && (
              <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="acknowledge" className="text-sm cursor-pointer">
                  Entendo que esta ação é permanente e que meus dados serão afetados conforme descrito acima.
                </label>
              </div>
            )}
          </div>
        </AlertDialogDescription>

        <div className="flex gap-2 justify-end mt-6">
          <AlertDialogCancel
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            onClick={onCancel}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className={`${
              validation.canDowngrade && acknowledged
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-slate-600 hover:bg-slate-600 cursor-not-allowed opacity-50"
            } text-white`}
            onClick={handleConfirm}
            disabled={!validation.canDowngrade || !acknowledged || isLoading}
          >
            {isLoading ? "Processando..." : "Confirmar Downgrade"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
