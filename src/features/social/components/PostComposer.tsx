import { useRef } from "react";
import { X, ImagePlus, Search, CheckCircle2, Loader2 } from "lucide-react";
import type { usePostComposer } from "../hooks/usePostComposer";
import { ClassBadge } from "../../../components/ClassBadge";
import { Car } from "lucide-react";

type PostComposerProps = {
  composer: ReturnType<typeof usePostComposer>;
};

export function PostComposer({ composer }: PostComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!composer.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c1422] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <h2 className="font-heading font-bold text-lg uppercase tracking-wide">Nouveau post</h2>
          <button
            onClick={() => { composer.reset(); composer.setIsOpen(false); }}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
              composer.previewUrl ? "border-transparent" : "border-slate-700 hover:border-slate-500"
            }`}
          >
            {composer.previewUrl ? (
              <>
                <img src={composer.previewUrl} alt="Preview" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-sm font-semibold text-white">Changer la photo</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <ImagePlus className="w-10 h-10 text-slate-600" />
                <p className="text-sm text-slate-500">Clique pour ajouter une photo</p>
                <p className="text-xs text-slate-700">JPG, PNG, WEBP</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => composer.handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Car search */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Voiture (optionnel)
            </label>
            {composer.selectedCar ? (
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/60 px-4 py-3">
                {composer.selectedCar.image_url ? (
                  <img src={composer.selectedCar.image_url} alt="" className="w-12 h-8 object-cover rounded-lg" />
                ) : (
                  <Car className="w-8 h-8 text-slate-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {composer.selectedCar.year} {composer.selectedCar.make} {composer.selectedCar.model}
                  </p>
                </div>
                {composer.selectedCar.car_class && (
                  <ClassBadge carClass={composer.selectedCar.car_class} pi={composer.selectedCar.pi} size="sm" />
                )}
                <button
                  onClick={() => { composer.setSelectedCar(null); composer.setCarQuery(""); }}
                  className="text-slate-600 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={composer.carQuery}
                  onChange={(e) => composer.setCarQuery(e.target.value)}
                  placeholder="Rechercher une voiture…"
                  className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors"
                />
                {composer.carResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c1422] border border-slate-700/60 rounded-xl overflow-hidden z-10 shadow-xl">
                    {composer.carResults.map((car) => (
                      <button
                        key={car.id}
                        onClick={() => { composer.setSelectedCar(car); composer.setCarQuery(`${car.make} ${car.model}`); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors text-left"
                      >
                        {car.image_url ? (
                          <img src={car.image_url} alt="" className="w-10 h-7 object-cover rounded" />
                        ) : (
                          <Car className="w-7 h-7 text-slate-600" />
                        )}
                        <span className="flex-1 text-sm truncate">
                          {car.year} {car.make} {car.model}
                        </span>
                        {car.car_class && (
                          <ClassBadge carClass={car.car_class} pi={car.pi} size="sm" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Légende
            </label>
            <textarea
              value={composer.caption}
              onChange={(e) => composer.setCaption(e.target.value)}
              placeholder="Dis quelque chose sur cette voiture…"
              maxLength={1000}
              rows={3}
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3 text-sm outline-none focus:border-red-500/70 transition-colors resize-none"
            />
            <p className="text-[10px] text-slate-700 text-right">{composer.caption.length}/1000</p>
          </div>

          {/* Message */}
          {composer.message && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {composer.message}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={composer.submit}
            disabled={composer.submitting}
            className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {composer.submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publication…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
