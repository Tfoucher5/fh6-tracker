import { useEffect, useState } from "react";
import { Image } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { LightboxTrigger } from "../../social/components/PostLightbox";
import { PostLightbox } from "../../social/components/PostLightbox";
import { Link } from "react-router-dom";
import { UserAvatar } from "../../social/components/UserAvatar";

type CarPost = {
  id: string;
  photo_url: string | null;
  caption: string | null;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  post_likes: { user_id: string }[];
};

const POST_SELECT = `
  id, photo_url, caption, created_at,
  profile:profiles!posts_user_id_fkey(username, display_name, avatar_url),
  post_likes(user_id)
` as const;

function relativeDate(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `il y a ${days}j`;
}

type CarPostsFeedProps = { carId: string };

export function CarPostsFeed({ carId }: CarPostsFeedProps) {
  const [posts, setPosts] = useState<CarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("car_id", carId)
        .order("created_at", { ascending: false })
        .limit(12);
      setPosts((data ?? []) as unknown as CarPost[]);
      setLoading(false);
    })();
  }, [carId]);

  if (loading) return null;
  if (posts.length === 0) return null;

  const withPhoto = posts.filter((p) => p.photo_url);
  const withoutPhoto = posts.filter((p) => !p.photo_url && p.caption);

  return (
    <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Image className="w-4 h-4 text-slate-500" />
        <h2 className="font-heading font-bold text-xl uppercase tracking-wide">
          Posts communauté
        </h2>
        <span className="font-mono text-sm text-slate-600">{posts.length}</span>
      </div>

      {withPhoto.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {withPhoto.slice(0, 6).map((post) => (
            <LightboxTrigger
              key={post.id}
              src={post.photo_url!}
              alt={post.caption ?? "Post"}
              className="rounded-xl overflow-hidden"
              onOpen={setLightboxSrc}
            >
              <img
                src={post.photo_url!}
                alt={post.caption ?? "Post"}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover/lb:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5">
                  <UserAvatar
                    username={post.profile.username}
                    displayName={post.profile.display_name}
                    avatarUrl={post.profile.avatar_url}
                    size="xs"
                  />
                  <span className="text-[10px] text-white font-semibold truncate">
                    {post.profile.display_name ?? post.profile.username}
                  </span>
                </div>
              </div>
            </LightboxTrigger>
          ))}
        </div>
      )}

      {withoutPhoto.slice(0, 3).map((post) => (
        <div key={post.id} className="flex items-start gap-3 bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 py-3">
          <Link to={`/u/${post.profile.username}`}>
            <UserAvatar
              username={post.profile.username}
              displayName={post.profile.display_name}
              avatarUrl={post.profile.avatar_url}
              size="xs"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <Link to={`/u/${post.profile.username}`} className="text-xs font-bold text-white hover:text-red-400 transition-colors">
                {post.profile.display_name ?? post.profile.username}
              </Link>
              <span className="text-[10px] text-slate-600 font-mono">{relativeDate(post.created_at)}</span>
            </div>
            {post.caption && (
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{post.caption}</p>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-600 shrink-0">❤ {post.post_likes.length}</span>
        </div>
      ))}

      {lightboxSrc && (
        <PostLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </section>
  );
}
