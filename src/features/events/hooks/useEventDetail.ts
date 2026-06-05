import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { EventWithDetails } from "../types";

export function useEventDetail(eventId: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (eventId) loadEvent();
  }, [eventId]);

  async function loadEvent() {
    if (!eventId) return;
    setLoading(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        profile:profiles!events_creator_id_fkey(username, display_name, avatar_url),
        event_participants(
          user_id,
          joined_at,
          profile:profiles!event_participants_user_id_fkey(username, display_name, avatar_url)
        )
      `)
      .eq("id", eventId)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    const ev = data as unknown as EventWithDetails;
    setEvent(ev);

    if (currentUser) {
      setIsParticipating(ev.event_participants.some((p) => p.user_id === currentUser.id));
    }

    setLoading(false);
  }

  async function toggleParticipation() {
    if (!user || !eventId || !event) return;
    setSaving(true);

    if (isParticipating) {
      await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", user.id);
      setIsParticipating(false);
      setEvent((prev) =>
        prev
          ? ({ ...prev, event_participants: prev.event_participants.filter((p) => p.user_id !== user.id) } as EventWithDetails)
          : prev
      );
    } else {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .single();

      await supabase.from("event_participants").insert({ event_id: eventId, user_id: user.id });
      setIsParticipating(true);
      setEvent((prev) =>
        prev
          ? ({
              ...prev,
              event_participants: [
                ...prev.event_participants,
                {
                  user_id: user.id,
                  joined_at: new Date().toISOString(),
                  profile: profileData ?? { username: "?", display_name: null, avatar_url: null },
                },
              ],
            } as EventWithDetails)
          : prev
      );
    }

    setSaving(false);
  }

  return { user, event, loading, isParticipating, saving, toggleParticipation };
}
