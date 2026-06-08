import { useState } from "react";
import { X, CalendarDays, Loader2 } from "lucide-react";
import type { CreateEventInput } from "../types";

type EventFormProps = {
  onSubmit: (input: CreateEventInput) => Promise<void>;
  onClose: () => void;
};

export function EventForm({ onSubmit, onClose }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Default datetime: next hour rounded
  function defaultDatetime() {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      setMessage("Titre et date obligatoires.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        event_date: new Date(eventDate).toISOString(),
        location_in_game: location.trim(),
        max_participants: maxParticipants ? Number(maxParticipants) : null,
      });
      onClose();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c1422] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-red-400" />
            <h2 className="font-heading font-bold text-lg uppercase tracking-wide">Créer un événement</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Titre *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grand rassemblement Ferraris…"
              maxLength={100}
              required
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors"
            />
          </Field>

          <Field label="Date et heure *">
            <input
              type="datetime-local"
              value={eventDate || defaultDatetime()}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors"
            />
          </Field>

          <Field label="Lieu dans le jeu">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Site du festival, Tokyo…"
              maxLength={200}
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors"
            />
          </Field>

          <Field label="Max participants (optionnel)">
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="12"
              min={1}
              max={72}
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Infos supplémentaires, règles, gamertag organisateur…"
              maxLength={2000}
              rows={4}
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors resize-none"
            />
          </Field>

          {message && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-bold text-slate-400 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</label>
      {children}
    </div>
  );
}
