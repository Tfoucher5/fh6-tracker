import { useEffect, useState } from "react";
import { Save } from "lucide-react";

type CarNotesPanelProps = {
  initialNotes: string | null;
  saving: boolean;
  onSave: (notes: string) => void;
};

export function CarNotesPanel({
  initialNotes,
  saving,
  onSave,
}: CarNotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");

  useEffect(() => {
    setNotes(initialNotes ?? "");
  }, [initialNotes]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Notes personnelles</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ajoute une note pour cette voiture : tune, photo à refaire, rareté,
          objectif, etc.
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Ex : à photographier de nuit, livrée perso, tune S1..."
        className="w-full min-h-32 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500 resize-none"
      />

      <button
        disabled={saving}
        onClick={() => onSave(notes)}
        className="rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 px-5 py-3 font-semibold inline-flex items-center gap-2"
      >
        <Save className="w-5 h-5" />
        Sauvegarder les notes
      </button>
    </section>
  );
}
