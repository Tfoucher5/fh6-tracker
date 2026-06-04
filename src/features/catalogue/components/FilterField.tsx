import type { ReactNode } from "react";

type FilterFieldProps = {
  label: string;
  children: ReactNode;
};

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}