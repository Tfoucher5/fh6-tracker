import { useState } from "react";
import { Flag, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type ReportReason = {
  value: string;
  label: string;
};

const REASONS: ReportReason[] = [
  { value: "spam",                  label: "Spam" },
  { value: "harassment",            label: "Harcèlement" },
  { value: "offensive_content",     label: "Contenu offensant" },
  { value: "inappropriate_content", label: "Contenu inapproprié" },
  { value: "cheating",              label: "Triche / tricheur" },
  { value: "fake_event",            label: "Événement fictif" },
  { value: "impersonation",         label: "Usurpation d'identité" },
  { value: "other",                 label: "Autre" },
];

type Props = {
  targetType: "post" | "comment" | "event" | "profile";
  targetId: string;
  onClose: () => void;
};

export function ReportModal({ targetType, targetId, onClose }: Props) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason || submitting) return;
    setSubmitting(true);
    await supabase.rpc("create_report", {
      p_target_type: targetType,
      p_target_id:   targetId,
      p_reason:      reason,
      p_details:     details.trim() || null,
    });
    setDone(true);
    setSubmitting(false);
    setTimeout(onClose, 1800);
  }

  const TARGET_LABEL: Record<Props["targetType"], string> = {
    post:    "ce post",
    comment: "ce commentaire",
    event:   "cet événement",
    profile: "ce profil",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-[#0d1117] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            <span className="font-heading font-bold text-sm uppercase tracking-wide text-white">
              Signaler {TARGET_LABEL[targetType]}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <p className="text-emerald-400 font-bold text-sm">Signalement envoyé.</p>
            <p className="text-slate-500 text-xs mt-1">Merci, notre équipe examinera ce contenu.</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Raison */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Raison</p>
              <div className="grid grid-cols-2 gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors border ${
                      reason === r.value
                        ? "bg-red-600/20 border-red-500/50 text-red-300"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Détails optionnels */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Détails <span className="normal-case text-slate-600">(optionnel)</span>
              </p>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Précise si nécessaire…"
                maxLength={300}
                rows={2}
                className="w-full rounded-lg bg-slate-800/80 border border-slate-700/60 px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-red-500/50 resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-800/60 hover:bg-slate-700 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors border border-slate-700/50"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={!reason || submitting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 text-sm font-bold text-white transition-colors"
              >
                {submitting ? "Envoi…" : "Signaler"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
