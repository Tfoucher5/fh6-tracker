import { Trash2 } from "lucide-react";
import type { CarPhoto } from "../types";
import { transformImage } from "../../../lib/imageTransform";

type CarPhotoGalleryProps = {
  photos: CarPhoto[];
  currentUserId: string;
  onDelete: (photo: CarPhoto) => void;
};

export function CarPhotoGallery({
  photos,
  currentUserId,
  onDelete,
}: CarPhotoGalleryProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Photos</h2>
        <p className="text-sm text-slate-500 mt-1">
          Photos personnelles et publiques liées à cette voiture.
        </p>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucune photo pour cette voiture pour l’instant.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {photos.map((photo) => {
            const isOwner = photo.user_id === currentUserId;

            return (
              <article
                key={photo.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden"
              >
                <img
                  src={transformImage(photo.image_url, 640) ?? photo.image_url}
                  alt={photo.caption ?? "Photo voiture"}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-56 object-cover"
                />

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-slate-300">
                      {photo.caption || "Sans légende"}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {photo.is_public ? "Publique" : "Privée"} ·{" "}
                      {new Date(photo.created_at).toLocaleString()}
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => onDelete(photo)}
                      className="rounded-xl bg-slate-800 hover:bg-red-600 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
