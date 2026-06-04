import { Link } from "react-router-dom";

type UserAvatarProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  linkToProfile?: boolean;
};

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-xl",
  xl: "w-20 h-20 text-2xl",
};

const colors = [
  "bg-red-600",
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-orange-600",
  "bg-cyan-600",
  "bg-pink-600",
];

function getColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({ username, displayName, avatarUrl, size = "md", linkToProfile = false }: UserAvatarProps) {
  const initials = (displayName ?? username).slice(0, 2).toUpperCase();
  const sizeClass = sizeMap[size];
  const bgColor = getColor(username);

  const inner = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={username}
      className={`${sizeClass} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center font-bold font-mono text-white shrink-0`}>
      {initials}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link to={`/u/${username}`} className="shrink-0">
        {inner}
      </Link>
    );
  }

  return inner;
}
