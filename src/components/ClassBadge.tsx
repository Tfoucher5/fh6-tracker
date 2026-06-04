type ClassBadgeProps = {
  carClass: string;
  pi?: number | null;
  size?: "sm" | "md" | "lg";
};

const classStyles: Record<string, { bg: string; text: string; border: string }> = {
  // Cyan / Bleu clair
  D:  { bg: "bg-[#00D2FF]/20",  text: "text-[#80E8FF]",  border: "border-[#00D2FF]/40" },
  // Jaune
  C:  { bg: "bg-[#FFD700]/20",  text: "text-[#FFE866]",  border: "border-[#FFD700]/40" },
  // Orange
  B:  { bg: "bg-[#FF6600]/20",  text: "text-[#FFAD66]",  border: "border-[#FF6600]/40" },
  // Rouge
  A:  { bg: "bg-[#FF0000]/20",  text: "text-[#FF6666]",  border: "border-[#FF0000]/40" },
  // Violet
  S1: { bg: "bg-[#9B59B6]/20",  text: "text-[#D2B4DE]",  border: "border-[#9B59B6]/40" },
  // Bleu foncé
  S2: { bg: "bg-[#0066FF]/20",  text: "text-[#80B3FF]",  border: "border-[#0066FF]/40" },
  // Émeraude / Vert classique
  R:  { bg: "bg-[#00CC66]/20",  text: "text-[#80E6B3]",  border: "border-[#00CC66]/40" },
  // Vert fluo / Lime
  X:  { bg: "bg-[#32CD32]/20",  text: "text-[#98FB98]",  border: "border-[#32CD32]/40" },
};

const sizeMap = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1.5",
  lg: "px-3 py-1.5 text-base gap-2",
};

export function ClassBadge({ carClass, pi, size = "md" }: ClassBadgeProps) {
  const style = classStyles[carClass] ?? {
    bg: "bg-slate-700/30",
    text: "text-slate-400",
    border: "border-slate-600/40",
  };

  return (
    <span
      className={`inline-flex items-baseline rounded-full border font-bold font-mono ${style.bg} ${style.text} ${style.border} ${sizeMap[size]}`}
    >
      <span>{carClass}</span>
      {pi != null && <span className="opacity-55 font-normal">{pi}</span>}
    </span>
  );
}
