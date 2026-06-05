const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export function transformImage(
  url: string | null | undefined,
  width: number,
  quality = 75
): string | undefined {
  if (!url) return undefined;
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return url;
  const prefix = `${base}${OBJECT_PATH}`;
  if (!url.startsWith(prefix)) return url;
  const path = url.slice(prefix.length);
  return `${base}${RENDER_PATH}${path}?width=${width}&quality=${quality}&format=webp`;
}
