import { useState } from "react";
import { Upload } from "lucide-react";

type CarPhotoUploaderProps = {
  uploading: boolean;
  onUpload: (file: File, caption: string, isPublic: boolean) => void;
};

export function CarPhotoUploader({
  uploading,
  onUpload,
}: CarPhotoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) return;

    onUpload(file, caption, isPublic);
    setFile(null);
    setCaption("");
    setIsPublic(true);
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Ajouter une photo</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload ta propre photo de cette voiture.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-3 file:text-slate-100 hover:file:bg-slate-700"
        />

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Légende optionnelle"
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
        />

        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4"
          />
          Photo publique
        </label>

        <button
          disabled={!file || uploading}
          className="rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 px-5 py-3 font-semibold inline-flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          {uploading ? "Upload..." : "Uploader la photo"}
        </button>
      </form>
    </section>
  );
}