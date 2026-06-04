import { classOrder } from "./constants";

export function uniqueSorted(values: Array<string | null>) {
  return Array.from(
    new Set(
      values
        .filter((v): v is string => Boolean(v && v.trim()))
        .map((v) => v.trim())
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function classRank(value: string | null) {
  if (!value) return 999;

  const idx = classOrder.indexOf(value);

  return idx === -1 ? 998 : idx;
}

export function compareText(a: string | null, b: string | null) {
  return (a ?? "").localeCompare(b ?? "");
}

export function compareNumber(a: number | null, b: number | null) {
  const aa = a ?? Number.MAX_SAFE_INTEGER;
  const bb = b ?? Number.MAX_SAFE_INTEGER;

  return aa - bb;
}