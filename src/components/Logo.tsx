"use client";

import Link from "next/link";
import { useConfig } from "@/lib/store";

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-label="RIFOI logo"
      role="img"
    >
      <circle cx="32" cy="32" r="29" stroke="#C8102E" strokeWidth="3.5" fill="#ffffff" />
      <circle cx="32" cy="32" r="24.5" stroke="#C8102E" strokeWidth="1" opacity="0.35" fill="none" />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="32"
        fill="#C8102E"
      >
        R
      </text>
    </svg>
  );
}

export default function Logo({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  const { config } = useConfig();
  const uploaded = config?.logoUrl?.trim();
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="RIFOI home">
      {uploaded ? (
        // Owner-uploaded official logo (uploaded via Admin → Settings)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={uploaded}
          alt="RIFOI logo"
          className={compact ? "h-9 w-auto object-contain" : "h-10 w-auto object-contain md:h-11"}
        />
      ) : (
        <LogoMark size={compact ? 36 : 42} />
      )}
      {!uploaded && (
        <span className="flex flex-col leading-none">
          <span
            className={`font-display text-[22px] font-extrabold tracking-[0.18em] md:text-2xl ${
              light ? "text-white" : "text-neutral-900"
            }`}
          >
            RIFOI
          </span>
          {!compact && (
            <span className={`mt-1 text-[10px] font-medium tracking-wide ${light ? "text-neutral-300" : "text-neutral-500"}`}>
              For your needs Rifoi
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
