import {
  Camera, Heart, UserPlus, Flame, Calendar, CalendarPlus,
  Images, Zap, Star, TrendingUp, Car,
  Layers, Award, Users, Rocket, LayoutGrid,
  Crown, Shield, Trophy, Gem, Flag,
  CalendarCheck, Medal,
} from "lucide-react";
import type { ComponentType } from "react";

export type BadgeTier = "bronze" | "silver" | "gold" | "red";

export type BadgeDefinition = {
  id: string;
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tier: BadgeTier;
};

export const TIER_STYLES: Record<BadgeTier, { bg: string; border: string; text: string; glow: string }> = {
  bronze: {
    bg:     "bg-orange-500/10",
    border: "border-orange-500/30",
    text:   "text-orange-400",
    glow:   "shadow-orange-500/20",
  },
  silver: {
    bg:     "bg-slate-400/10",
    border: "border-slate-400/30",
    text:   "text-slate-300",
    glow:   "shadow-slate-400/20",
  },
  gold: {
    bg:     "bg-amber-500/10",
    border: "border-amber-500/30",
    text:   "text-amber-400",
    glow:   "shadow-amber-500/20",
  },
  red: {
    bg:     "bg-red-500/10",
    border: "border-red-500/30",
    text:   "text-red-400",
    glow:   "shadow-red-500/20",
  },
};

export const TIER_LABELS: Record<BadgeTier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold:   "Or",
  red:    "Légendaire",
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Bronze ──────────────────────────────────────────────────────────────
  { id: "first_post",          label: "Starter",       description: "Publier ton premier post",        Icon: Camera,      tier: "bronze" },
  { id: "first_like",          label: "Apprécié",      description: "Recevoir ton premier like",       Icon: Heart,       tier: "bronze" },
  { id: "first_follow",        label: "Premier fan",   description: "Gagner ton premier abonné",       Icon: UserPlus,    tier: "bronze" },
  { id: "streak_3",            label: "En feu",        description: "3 jours de streak consécutifs",   Icon: Flame,       tier: "bronze" },
  { id: "first_event",         label: "Participant",   description: "Rejoindre un premier événement",  Icon: Calendar,    tier: "bronze" },
  { id: "first_event_created", label: "Organisateur",  description: "Créer ton premier événement",     Icon: CalendarPlus,tier: "bronze" },

  // ── Silver ──────────────────────────────────────────────────────────────
  { id: "posts_10",    label: "Régulier",      description: "10 posts publiés",                Icon: Images,      tier: "silver" },
  { id: "streak_7",    label: "Blazer",        description: "7 jours de streak consécutifs",   Icon: Zap,         tier: "silver" },
  { id: "followers_10",label: "Notable",       description: "10 abonnés",                      Icon: Star,        tier: "silver" },
  { id: "liked_50",    label: "Populaire",     description: "50 likes reçus au total",         Icon: TrendingUp,  tier: "silver" },
  { id: "garage_20",   label: "Collectionneur",description: "20 voitures dans le garage",      Icon: Car,         tier: "silver" },

  // ── Or ──────────────────────────────────────────────────────────────────
  { id: "posts_50",     label: "Créateur",  description: "50 posts publiés",             Icon: Layers,      tier: "gold" },
  { id: "streak_30",    label: "Endurant",  description: "30 jours de streak",           Icon: Award,       tier: "gold" },
  { id: "followers_50", label: "Star",      description: "50 abonnés",                   Icon: Users,       tier: "gold" },
  { id: "liked_200",    label: "Viral",     description: "200 likes reçus au total",     Icon: Rocket,      tier: "gold" },
  { id: "garage_50",    label: "Musée",     description: "50 voitures dans le garage",   Icon: LayoutGrid,  tier: "gold" },

  // ── Or — Événements ─────────────────────────────────────────────────────
  { id: "events_5",         label: "Assidu",      description: "Participer à 5 événements",        Icon: CalendarCheck, tier: "silver" },
  { id: "events_10",        label: "Compétiteur", description: "Participer à 10 événements",       Icon: CalendarCheck, tier: "gold"   },
  { id: "events_25",        label: "Vétéran",     description: "Participer à 25 événements",       Icon: CalendarCheck, tier: "red"    },
  { id: "event_podium_3rd", label: "Podium",      description: "Terminer 3ème lors d'un événement",Icon: Medal,         tier: "bronze" },
  { id: "event_podium_2nd", label: "Finaliste",   description: "Terminer 2ème lors d'un événement",Icon: Medal,         tier: "silver" },
  { id: "event_podium_1st", label: "Champion",    description: "Remporter un événement FH6",       Icon: Trophy,        tier: "gold"   },

  // ── Légendaire ──────────────────────────────────────────────────────────
  { id: "posts_100",    label: "Légende",   description: "100 posts publiés",            Icon: Crown,   tier: "red" },
  { id: "streak_100",   label: "Immortel",  description: "100 jours de streak",          Icon: Shield,  tier: "red" },
  { id: "followers_100",label: "Icône",     description: "100 abonnés",                  Icon: Trophy,  tier: "red" },
  { id: "liked_500",    label: "Mythique",  description: "500 likes reçus au total",     Icon: Gem,     tier: "red" },
  { id: "early_adopter",label: "Pionnier",  description: "Membre fondateur de FH6 Tracker", Icon: Flag, tier: "red" },
];

export const BADGE_MAP = Object.fromEntries(BADGE_DEFINITIONS.map((b) => [b.id, b]));
