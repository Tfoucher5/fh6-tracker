import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { CreateEventInput, FHEvent } from "../types";

const EVENT_SELECT = `
  *,
  profile:profiles!events_creator_id_fkey(username, display_name, avatar_url),
  event_participants(user_id)
` as const;

export function useEvents() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<FHEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [myParticipations, setMyParticipations] = useState<Set<string>>(new Set());

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    const { data } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .not("status", "in", '("hidden","deleted")')
      .order("event_date", { ascending: true });

    setEvents((data ?? []) as unknown as FHEvent[]);

    if (currentUser) {
      const { data: myParts } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", currentUser.id);

      setMyParticipations(new Set((myParts ?? []).map((p) => p.event_id)));
    }

    setLoading(false);
  }

  async function joinEvent(eventId: string) {
    if (!user) return;
    await supabase.from("event_participants").insert({ event_id: eventId, user_id: user.id });
    setMyParticipations((prev) => new Set([...prev, eventId]));
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, event_participants: [...e.event_participants, { user_id: user.id }] }
          : e
      )
    );
  }

  async function leaveEvent(eventId: string) {
    if (!user) return;
    await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", user.id);
    setMyParticipations((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, event_participants: e.event_participants.filter((p) => p.user_id !== user.id) }
          : e
      )
    );
  }

  async function createEvent(input: CreateEventInput): Promise<void> {
    if (!user) throw new Error("Non connecté");

    const { data, error } = await supabase
      .from("events")
      .insert({
        creator_id: user.id,
        title: input.title,
        description: input.description || null,
        event_date: input.event_date,
        location_in_game: input.location_in_game || null,
        max_participants: input.max_participants,
      })
      .select(EVENT_SELECT)
      .single();

    if (error) throw new Error(error.message);
    const newEvent = data as unknown as FHEvent;
    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.event_date.localeCompare(b.event_date)));
  }

  return { user, events, loading, myParticipations, joinEvent, leaveEvent, createEvent };
}
