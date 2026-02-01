import { AlertCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PlanLimitBannerProps {
  title: string;
  current: number;
  limit: number;
  unit?: string;
  showUpgradeButton?: boolean;
}

export function PlanLimitBanner({
  title,
  current,
  limit,
  unit = "",
  showUpgradeButton = true,
}: PlanLimitBannerProps) {
  if (limit === Infinity) return null;

  const percentage = (current / limit) * 100;
  const isWarning = percentage >= 80;
  const isError = percentage >= 100;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isError
          ? "border-red-500/30 bg-red-500/10"
          : isWarning
          ? "border-yellow-500/30 bg-yellow-500/10"
          : "border-blue-500/30 bg-blue-500/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isError ? (
              <AlertCircle className="h-5 w-5 text-red-400" />
            ) : isWarning ? (
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            ) : (
              <TrendingUp className="h-5 w-5 text-blue-400" />
            )}
            <h3
              className={`font-semibold ${
                isError
                  ? "text-red-400"
                  : isWarning
                  ? "text-yellow-400"
                  : "text-blue-400"
              }`}
            >
              {title}
            </h3>
          </div>

          <p className="text-sm text-slate-300 mb-3">
            Você usou{" "}
            <span className="font-semibold">
              {current}
              {unit}
            </span>{" "}
            de{" "}
            <span className="font-semibold">
              {limit}
              {unit}
            </span>
          </p>

          <Progress value={Math.min(percentage, 100)} className="h-2" />

          <p className="text-xs text-slate-400 mt-2">
            {percentage.toFixed(0)}% utilizado
          </p>
        </div>

        {showUpgradeButton && isWarning && (
          <Link href="/pricing">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
