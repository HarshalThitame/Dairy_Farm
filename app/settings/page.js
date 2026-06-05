"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const settingsCards = [
  {
    href: "/profile",
    icon: "👤",
    title: "माझी माहिती",
    subtitle: "नाव, फोटो, गाव आणि डेअरी माहिती",
    tone: "from-green-50 to-white border-green-100"
  },
  {
    href: "/settings/security",
    icon: "🔒",
    title: "सुरक्षा केंद्र",
    subtitle: "PIN, password, login history आणि sessions",
    tone: "from-slate-50 to-white border-slate-200"
  },
  {
    href: "/settings/notifications",
    icon: "🔔",
    title: "सूचना सेटिंग्ज",
    subtitle: "Mobile notification, शांत वेळ आणि श्रेणी",
    tone: "from-yellow-50 to-white border-yellow-100"
  },
  {
    href: "/settings/veterinarians",
    icon: "🩺",
    title: "पशुवैद्यक",
    subtitle: "डॉक्टरांची नावे जोडा आणि नोंदीत dropdown मधून निवडा",
    tone: "from-rose-50 to-white border-rose-100"
  },
  {
    href: "/settings/appearance",
    icon: "🎨",
    title: "दिसणे आणि भाषा",
    subtitle: "Theme, font size, language आणि accessibility",
    tone: "from-sky-50 to-white border-sky-100"
  },
  {
    href: "/settings/ai",
    icon: "🤖",
    title: "दुग्धमित्र AI",
    subtitle: "AI toggle, उत्तर शैली, data परवानगी आणि history",
    tone: "from-emerald-50 to-white border-emerald-100"
  },
  {
    href: "/settings/goals",
    icon: "🎯",
    title: "दूध लक्ष्य",
    subtitle: "दैनिक, साप्ताहिक, मासिक आणि गुणवत्ता लक्ष्य",
    tone: "from-orange-50 to-white border-orange-100"
  },
  {
    href: "/settings/export",
    icon: "📦",
    title: "Export आणि Backup",
    subtitle: "PDF, Excel, CSV, JSON download आणि backup",
    tone: "from-indigo-50 to-white border-indigo-100"
  },
  {
    href: "/settings/help",
    icon: "📞",
    title: "मदत आणि Support",
    subtitle: "FAQ, tickets, tutorials आणि contact support",
    tone: "from-purple-50 to-white border-purple-100"
  }
];

export default function SettingsHomePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="⚙️ सेटिंग्ज"
        subtitle="तुमचे खाते, सुरक्षा, सूचना आणि app दिसणे एका ठिकाणी."
      />

      <section className="grid gap-3">
        {settingsCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`dashboard-card flex min-h-[112px] items-center gap-4 rounded-xl border bg-gradient-to-br p-4 shadow-soft active:scale-[0.99] ${card.tone}`}
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[34px] shadow-sm">
              {card.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[22px] font-black leading-tight text-slate-950">
                {card.title}
              </span>
              <span className="mt-1 block text-[17px] font-bold leading-snug text-slate-600">
                {card.subtitle}
              </span>
            </span>
            <span className="text-[24px] font-black text-slate-400">›</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
