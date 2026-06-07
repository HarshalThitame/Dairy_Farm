import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import { AuthProvider } from "@/context/AuthContext";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-devanagari",
  weight: ["400", "600", "700", "800"]
});

const appearanceInitScript = `
(function () {
  try {
    var raw = localStorage.getItem("majhi_dairy_appearance");
    var prefs = raw ? JSON.parse(raw) : {};
    var theme = prefs.theme_mode || "light";
    var fontSize = prefs.font_size || "medium";
    var fontScale = fontSize === "large" ? "1.12" : fontSize === "small" ? "0.92" : "1";
    var language = prefs.language === "en" ? "en" : "mr";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = theme === "dark" || (theme === "system" && prefersDark);
    var root = document.documentElement;
    root.classList.toggle("majhi-theme-dark", dark);
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.language = language;
    root.lang = language === "en" ? "en-IN" : "mr-IN";
    root.style.colorScheme = dark ? "dark" : "light";
    root.style.setProperty("--majhi-font-scale", fontScale);
    if (document.body) {
      document.body.classList.toggle("majhi-theme-dark", dark);
      document.body.setAttribute("data-language", language);
    }
    root.classList.toggle("majhi-font-small", prefs.font_size === "small");
    root.classList.toggle("majhi-font-large", prefs.font_size === "large");
    root.classList.toggle("majhi-compact", !!prefs.compact_mode);
    root.classList.toggle("majhi-high-contrast", !!prefs.high_contrast);
    root.classList.toggle("majhi-large-touch", prefs.large_touch_targets !== false);
    root.classList.toggle("majhi-reduce-motion", !!prefs.reduce_animations);
  } catch (error) {}
}());
`;

export const metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    locale: "mr_IN",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="mr" className={notoSansDevanagari.variable} suppressHydrationWarning>
      <body className="font-devanagari" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
