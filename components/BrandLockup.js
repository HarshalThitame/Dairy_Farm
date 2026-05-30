import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

const sizeStyles = {
  sm: {
    icon: "text-[28px]",
    title: "text-[22px]",
    tagline: "text-[14px]"
  },
  md: {
    icon: "text-[42px]",
    title: "text-[30px]",
    tagline: "text-[18px]"
  },
  lg: {
    icon: "text-[58px]",
    title: "text-[34px]",
    tagline: "text-[20px]"
  }
};

export default function BrandLockup({ size = "md", center = false, invert = false, className = "" }) {
  const styles = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`flex min-w-0 items-center gap-3 ${center ? "justify-center text-center" : ""} ${className}`}>
      <div
        className={`${styles.icon} flex shrink-0 items-center justify-center rounded-lg bg-green-50 leading-none shadow-sm ring-1 ring-green-100`}
        aria-hidden="true"
      >
        🐄
      </div>
      <div className="min-w-0">
        <div
          className={`${styles.title} break-words font-extrabold leading-tight ${
            invert ? "text-white" : "text-slate-950"
          }`}
        >
          {APP_NAME}
        </div>
        <div
          className={`${styles.tagline} mt-0.5 break-words font-bold leading-snug ${
            invert ? "text-green-50" : "text-slate-600"
          }`}
        >
          {APP_TAGLINE}
        </div>
      </div>
    </div>
  );
}
