import { Car } from "lucide-react";
import { transformImage } from "../../../lib/imageTransform";

type CarImageProps = {
  imageUrl: string | null;
  alt: string;
  priority?: boolean;
};

export function CarImage({ imageUrl, alt, priority = false }: CarImageProps) {
  return (
    <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
      {imageUrl ? (
        <img
          src={transformImage(imageUrl, 480) ?? imageUrl}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className="w-full h-full object-cover"
        />
      ) : (
        <Car className="w-12 h-12 text-slate-600" />
      )}
    </div>
  );
}
