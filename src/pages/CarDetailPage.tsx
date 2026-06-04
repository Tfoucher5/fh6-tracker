import { useParams } from "react-router-dom";
import { CarDetailHeader } from "../features/cars/components/CarDetailHeader";
import { CarStatusPanel } from "../features/cars/components/CarStatusPanel";
import { CarNotesPanel } from "../features/cars/components/CarNotesPanel";
import { CarPhotoUploader } from "../features/cars/components/CarPhotoUploader";
import { CarPhotoGallery } from "../features/cars/components/CarPhotoGallery";
import { useCarDetail } from "../features/cars/hooks/userCarDetail";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Chargement de la voiture...
      </div>
    );
  }

  if (!car || !status || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Voiture introuvable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
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
          </div>
        </div>
      </div>
    </div>
  );
}
