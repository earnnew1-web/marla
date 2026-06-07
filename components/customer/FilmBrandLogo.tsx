import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  size?: number;
};

export function FilmBrandLogo({ src, alt, className, size = 24 }: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/30",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
    </span>
  );
}
