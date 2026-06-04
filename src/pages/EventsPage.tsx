import { useState } from "react";
import { CalendarDays, Plus, Clock, CheckCheck } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { EventCard } from "../features/events/components/EventCard";
import { EventForm } from "../features/events/components/EventForm";
import { useEvents } from "../features/events/hooks/useEvents";

type TabType = "upcoming" | "past";

function isPast(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

export default function EventsPage() {
  const { user, events, loading, myParticipations, joinEvent, leaveEvent, createEvent } = useEvents();
  const [tab, setTab] = useState<TabType>("upcoming");
  const [showForm, setShowForm] = useState(false);

  const upcoming = events.filter((e) => !isPast(e.event_date));
  const past = events.filter((e) => isPast(e.event_date));
  const displayedEvents = tab === "upcoming" ? upcoming : past;

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">
                Communauté
              </p>
              <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">
                Événements
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                Rassemblements, meetups et sessions organisées par la commu.
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-bold transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Créer
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-4">
              <p className="font-heading font-black text-3xl text-white">{upcoming.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">À venir</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-4">
              <p className="font-heading font-black text-3xl text-white">
                {myParticipations.size}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Mes inscriptions</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1">
            <TabButton
              active={tab === "upcoming"}
              onClick={() => setTab("upcoming")}
              icon={<Clock className="w-4 h-4" />}
              label={`À venir (${upcoming.length})`}
            />
            <TabButton
              active={tab === "past"}
              onClick={() => setTab("past")}
              icon={<CheckCheck className="w-4 h-4" />}
              label={`Passés (${past.length})`}
            />
          </div>

          {/* Events list */}
          {loading ? (
            <LoadingState />
          ) : displayedEvents.length === 0 ? (
            <EmptyState tab={tab} hasUser={!!user} onCreate={() => setShowForm(true)} />
          ) : (
            <div className="space-y-3">
              {displayedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isParticipating={myParticipations.has(event.id)}
                  onJoin={() => joinEvent(event.id)}
                  onLeave={() => leaveEvent(event.id)}
                  currentUserId={user?.id ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EventForm
          onSubmit={createEvent}
          onClose={() => setShowForm(false)}
        />
      )}
    </PageLayout>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="w-14 h-20 bg-slate-800 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-800/60 rounded w-1/3" />
              <div className="h-3 bg-slate-800/60 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  tab,
  hasUser,
  onCreate,
}: {
  tab: TabType;
  hasUser: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center">
        <CalendarDays className="w-7 h-7 text-slate-600" />
      </div>
      {tab === "past" ? (
        <p className="font-heading font-bold text-xl uppercase text-slate-500">
          Aucun événement passé
        </p>
      ) : (
        <>
          <p className="font-heading font-bold text-xl uppercase text-slate-500">
            Aucun événement prévu
          </p>
          <p className="text-sm text-slate-600 max-w-xs">
            Lance le premier rassemblement de la communauté FH6 !
          </p>
          {hasUser && (
            <button
              onClick={onCreate}
              className="mt-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold transition-colors"
            >
              Créer un événement
            </button>
          )}
        </>
      )}
    </div>
  );
}
