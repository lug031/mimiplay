import type { ReactNode } from "react";
import { PUBLIC_SOCIAL_URLS, socialHref } from "@/config/publicContact";

const btn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/90 ring-1 ring-white/10 transition hover:bg-white/12 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

function IconFacebook({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function IconWhatsApp({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M20.52 3.449A12.154 12.154 0 0 0 12 0C5.373 0 0 5.373 0 12c0 2.11.548 4.106 1.507 5.848L.057 24l6.305-1.654A11.95 11.95 0 0 0 12 24h.008c6.627 0 12-5.373 12-12 0-3.206-1.25-6.217-3.52-8.48v.029h-.001l.013-.053zM12 21.428h-.006a9.406 9.406 0 0 1-4.792-1.312l-.344-.205-3.582.939.956-3.49-.226-.365a9.346 9.346 0 0 1-1.438-4.948c0-5.18 4.219-9.4 9.4-9.4 2.51 0 4.868.98 6.64 2.762a9.334 9.334 0 0 1 2.76 6.637c-.003 5.18-4.222 9.4-9.402 9.4zm5.296-7.107c-.288-.144-1.716-.846-1.984-.94-.264-.096-.456-.144-.648.144-.192.288-.744.94-.912 1.128-.168.192-.336.216-.624.072-.288-.144-1.212-.447-2.304-1.428-.852-.756-1.428-1.692-1.596-1.98-.168-.288-.018-.444.132-.588.132-.132.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.56-.888-2.136-.24-.552-.48-.48-.648-.492-.168-.012-.36-.012-.552-.012-.192 0-.504.072-.768.432-.264.36-1.008.984-1.008 2.4 0 1.416 1.032 2.784 1.176 2.976.144.192 2.04 3.12 4.944 4.368.696.24 1.224.384 1.644.492.696.192 1.332.168 1.836.102.558-.084 1.716-.696 1.956-1.368.24-.672.24-1.248.168-1.368-.072-.12-.264-.192-.552-.336z"
      />
    </svg>
  );
}

function IconTelegram({ className = "h-[20px] w-[20px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={btn}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export function FooterSocialIcons() {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <SocialLink href={socialHref(PUBLIC_SOCIAL_URLS.facebook)} label="MimiPlay en Facebook">
        <IconFacebook />
      </SocialLink>
      <SocialLink href={socialHref(PUBLIC_SOCIAL_URLS.whatsapp)} label="Contactar por WhatsApp">
        <IconWhatsApp />
      </SocialLink>
      <SocialLink href={socialHref(PUBLIC_SOCIAL_URLS.telegram)} label="MimiPlay en Telegram">
        <IconTelegram />
      </SocialLink>
    </div>
  );
}
