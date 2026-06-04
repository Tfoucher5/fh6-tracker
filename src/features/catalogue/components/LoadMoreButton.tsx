import { PAGE_SIZE } from "../constants";

type LoadMoreButtonProps = {
  visibleCount: number;
  totalCount: number;
  onLoadMore: () => void;
};

export function LoadMoreButton({
  visibleCount,
  totalCount,
  onLoadMore,
}: LoadMoreButtonProps) {
  if (visibleCount >= totalCount) {
    return null;
  }

  const remaining = totalCount - visibleCount;
  const nextCount = Math.min(PAGE_SIZE, remaining);

  return (
    <div className="flex justify-center pt-4">
      <button
        onClick={onLoadMore}
        className="rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 font-semibold transition-colors"
      >
        Charger {nextCount} voiture(s) de plus
      </button>
    </div>
  );
}