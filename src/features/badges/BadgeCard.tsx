import { Lock } from "lucide-react";
import type { BadgeDefinition } from "./badgeDefinitions";
import { TIER_STYLES, TIER_LABELS } from "./badgeDefinitions";

type Props = {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: string;
  size?: "sm" | "md";
};

export function BadgeCard({ badge, earned, earnedAt, size = "md" }: Props) {
  const { Icon, label, description, tier } = badge;
  const styles = TIER_STYLES[tier];

  const isSmall = size === "sm";

  return (
    <div
      title={earned ? `${label} — ${description}` : `🔒 ${description}`}
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${
        isSmall ? "p-2 gap-1" : "p-3.5 gap-2"
      } ${
        earned
          ? `${styles.bg} ${styles.border} shadow-lg ${styles.glow} cursor-default`
          : "bg-slate-900/40 border-slate-800/60 opacity-40 cursor-default"
      }`}
    >
      {/* Icon */}
      <div
        className={`rounded-xl flex items-center justify-center ${
          isSmall ? "w-9 h-9" : "w-12 h-12"
        } ${
          earned ? styles.bg : "bg-slate-800/60"
        }`}
      >
        {earned ? (
          <Icon
            className={`${isSmall ? "w-4 h-4" : "w-6 h-6"} ${styles.text}`}
            strokeWidth={2}
          />
        ) : (
          <Lock className={`${isSmall ? "w-3.5 h-3.5" : "w-5 h-5"} text-slate-600`} strokeWidth={2} />
        )}
      </div>

      {/* Label */}
      <p
        className={`font-heading font-bold uppercase tracking-wide leading-none text-center ${
          isSmall ? "text-[10px]" : "text-xs"
        } ${earned ? styles.text : "text-slate-600"}`}
      >
        {earned ? label : "???"}
      </p>

      {/* Tier pill */}
      {earned && (
        <span
          className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${styles.bg} ${styles.border} ${styles.text}`}
        >
          {TIER_LABELS[tier]}
        </span>
      )}

      {/* Date */}
      {earned && earnedAt && !isSmall && (
        <p className="text-[9px] text-slate-600 font-mono">
          {new Date(earnedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
        </p>
      )}
    </div>
  );
}
