import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthRequired from "@/components/AuthRequired";
import InstallBanner from "@/components/InstallBanner";
import NetworkStatusBar from "@/components/NetworkStatusBar";
import NotificationBoot from "@/components/NotificationBoot";
import TopHeader from "@/components/TopHeader";
import ToastContainer from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-devanagari",
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata = {
  title: "गोशाळा व्यवस्थापन",
  description: "दुग्ध व्यवसायासाठी मराठी गोशाळा व्यवस्थापन अ‍ॅप",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "गोशाळा"
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
          <NetworkStatusBar />
          <TopHeader />
          <main className="safe-bottom mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6">
            <AuthRequired>{children}</AuthRequired>
          </main>
          <NotificationBoot />
          <InstallBanner />
          <ToastContainer />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
