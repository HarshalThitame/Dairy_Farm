"use client";

import Image from "next/image";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { useUiTranslation } from "@/lib/useUiLanguage";

const sizeStyles = {
  sm: {
    icon: "h-10 w-10",
    imageSize: 40,
    title: "text-[22px]",
    tagline: "text-[14px]"
  },
  md: {
    icon: "h-14 w-14",
    imageSize: 56,
    title: "text-[30px]",
    tagline: "text-[18px]"
  },
  lg: {
    icon: "h-20 w-20",
    imageSize: 80,
    title: "text-[34px]",
    tagline: "text-[20px]"
  }
};

export default function BrandLockup({ size = "md", center = false, invert = false, className = "" }) {
  const styles = sizeStyles[size] || sizeStyles.md;
  const t = useUiTranslation();

  return (
    <div data-i18n-skip className={`flex min-w-0 items-center gap-3 ${center ? "justify-center text-center" : ""} ${className}`}>
      <div
        className={`${styles.icon} flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white leading-none shadow-sm ring-1 ring-green-100`}
        aria-hidden="true"
      >
        <Image
          src="/icons/majhi-dairy-logo.png"
          alt=""
          width={styles.imageSize}
          height={styles.imageSize}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <div
          className={`${styles.title} break-words font-extrabold leading-tight ${
            invert ? "text-white" : "text-slate-950"
          }`}
        >
          {t(APP_NAME, "Majhi Dairy")}
        </div>
        <div
          className={`${styles.tagline} mt-0.5 break-words font-bold leading-snug ${
            invert ? "text-green-50" : "text-slate-600"
          }`}
        >
          {t(APP_TAGLINE, "Smart Dairy Management")}
        </div>
      </div>
    </div>
  );
}
