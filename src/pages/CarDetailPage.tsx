import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { CarDetailHeader } from "../features/cars/components/CarDetailHeader";
import { CarStatusPanel } from "../features/cars/components/CarStatusPanel";
import { CarNotesPanel } from "../features/cars/components/CarNotesPanel";
import { CarPhotoUploader } from "../features/cars/components/CarPhotoUploader";
import { CarPhotoGallery } from "../features/cars/components/CarPhotoGallery";
import { useCarDetail } from "../features/cars/hooks/userCarDetail";
import { PageLayout } from "../components/PageLayout";
import { PostComposer } from "../features/social/components/PostComposer";
import { usePostComposer } from "../features/social/hooks/usePostComposer";
import { CarPostsFeed } from "../features/cars/components/CarPostsFeed";

export default function CarDetailPage() {
  const { id } = useParams();

  const {
    user,
    car,
    status,
    photos,
    loading,
    saving,
    uploading,
    message,
    toggleStatus,
    saveNotes,
    uploadPhoto,
    deletePhoto,
  } = useCarDetail(id);

  const composer = usePostComposer(() => {});

  useEffect(() => {
    if (car) document.title = `${car.make} ${car.model}${car.year ? ` (${car.year})` : ""} — FH6 Tracker`;
    else document.title = "Voiture — FH6 Tracker";
  }, [car]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center">
        <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400 animate-pulse">
          Chargement…
        </p>
      </div>
    );
  }

  if (!car || !status || !user) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center">
        <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-500">
          Voiture introuvable.
        </p>
      </div>
    );
  }

  return (
    <PageLayout>
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <CarDetailHeader car={car} />

        {message && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-slate-300">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="space-y-6">
            <CarStatusPanel
              status={status}
              saving={saving}
              onToggle={toggleStatus}
              onShare={() => composer.openWithCar({
                id: car.id,
                make: car.make,
                model: car.model,
                year: car.year,
                car_class: car.car_class,
                pi: car.pi,
                image_url: car.image_url,
              })}
            />

            <CarNotesPanel
              initialNotes={status.notes}
              saving={saving}
              onSave={saveNotes}
            />
          </div>

          <div className="space-y-6">
            <CarPhotoUploader uploading={uploading} onUpload={uploadPhoto} />

            <CarPhotoGallery
              photos={photos}
              currentUserId={user.id}
              onDelete={deletePhoto}
            />

            <CarPostsFeed carId={car.id} />
          </div>
        </div>
      </div>
    </div>
      <PostComposer composer={composer} />
    </PageLayout>
  );
}
