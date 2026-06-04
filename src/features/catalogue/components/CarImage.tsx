import { Car } from "lucide-react";

type CarImageProps = {
  imageUrl: string | null;
  alt: string;
};

export function CarImage({ imageUrl, alt }: CarImageProps) {
  return (
    <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      ) : (
        <Car className="w-12 h-12 text-slate-600" />
      )}
    </div>
  );
}