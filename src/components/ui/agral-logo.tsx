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
          src="/logo_agral.png"
          alt="Agral — Portalul Fermierilor"
          width={img}
          height={Math.round(h * 0.6)}
          className={cn("object-contain", className)}
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
        <div
          className={cn(
            "agral-gradient rounded-xl flex items-center justify-center shrink-0",
            size === "sm" && "w-8 h-8",
            size === "md" && "w-10 h-10",
            size === "lg" && "w-12 h-12",
            className
          )}
        >
          {/* Spic de grâu SVG inline — matching logo */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn(
              "text-amber-200",
              size === "sm" && "w-4 h-4",
              size === "md" && "w-5 h-5",
              size === "lg" && "w-6 h-6"
            )}
          >
            <path
              d="M12 22V8M12 8C12 8 9 6 7 3M12 8C12 8 15 6 17 3M12 12C12 12 9 10 7 8M12 12C12 12 15 10 17 8M12 16C12 16 9 14 7 12M12 16C12 16 15 14 17 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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
