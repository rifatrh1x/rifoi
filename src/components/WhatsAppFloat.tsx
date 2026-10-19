"use client";

import { usePathname } from "next/navigation";
import { useConfig } from "@/lib/store";

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const { config } = useConfig();
  if (pathname?.startsWith("/admin")) return null;
  const url = config?.whatsappUrl || "https://wa.me/8801312812139";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="wa-float fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
        <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm0 16.5a7.5 7.5 0 0 1-3.8-1l-.3-.2-2.8.7.7-2.7-.2-.3A7.5 7.5 0 1 1 12 19.5zm4.1-5.6c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.1 6.1 0 0 1-3-2.6c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.3-.4-.5-.4h-.5c-.2 0-.5.2-.7.6-.2.4-.9 2.2-.9 4.2 0 2 1.5 4 1.7 4.3.2.3 2.9 4.6 7.1 6.2 1 .4 1.7.6 2.3.8.9.3 1.8.3 2.5.2.8-.1 2.3-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.1-.3-.2-.5-.3z" />
      </svg>
    </a>
  );
}
