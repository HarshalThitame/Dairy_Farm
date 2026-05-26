import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import { AuthProvider } from "@/context/AuthContext";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-devanagari",
  weight: ["400", "500", "600", "700", "800"]
});

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
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }]
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
    <html lang="mr" className={notoSansDevanagari.variable}>
      <body className="font-devanagari">
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
