import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AgralLogoProps {
  /** "full" = imagine completa, "text" = doar text AGRAL, "icon" = doar spicul (pt collapsed sidebar) */
  variant?: "full" | "text" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { img: 80, h: 24 },
  md: { img: 120, h: 36 },
  lg: { img: 160, h: 48 },
  xl: { img: 220, h: 66 },
  "2xl": { img: 280, h: 84 },
};

export function AgralLogo({
  variant = "full",
  size = "md",
  href,
  className,
}: AgralLogoProps) {
  const { img, h } = sizeMap[size];

  const content = (
    <>
      {variant === "full" && (
        <Image
          src="/logo_agral_clar_cropped.png"
          alt="Agral - Portalul Fermierilor"
          width={img}
          height={Math.round(h * 0.6)}
          className={cn("object-contain mix-blend-multiply", className)}
          priority
        />
      )}

      {variant === "text" && (
        <span
          className={cn(
            "font-brand text-[var(--agral-green-dark)] tracking-widest",
            size === "sm" && "text-lg",
            size === "md" && "text-2xl",
            size === "lg" && "text-3xl",
            size === "xl" && "text-4xl",
            className
          )}
        >
          AGRAL
        </span>
      )}

      {variant === "icon" && (
        <Image
          src="/logo_agral_mic_cropped.png"
          alt="Agral Icon"
          width={img}
          height={img}
          className={cn("object-contain mix-blend-multiply drop-shadow-sm", className)}
          priority
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return <div className="inline-flex items-center">{content}</div>;
}
