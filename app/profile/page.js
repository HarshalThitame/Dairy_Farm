"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";
import ProfilePhotoUploader from "@/components/settings/ProfilePhotoUploader";
import { useAuth } from "@/context/AuthContext";
import {
  MAHARASHTRA_DISTRICTS,
  getAhilyanagarTalukas,
  getAhilyanagarVillages,
  isAhilyanagarDistrict
} from "@/lib/maharashtraLocations";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { formatCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

function authHeader() {
  return getClientAuthHeaders();
}

function roleLabel(user) {
  if (user?.isFarmOwner) return "मालक";
  if (user?.role === "admin") return "व्यवस्थापक";
  return "कामगार";
}

function monthYear(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("mr-IN", { month: "long", year: "numeric" });
}

function dateText(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("mr-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function safeText(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

function StatCard({ icon, title, value, subtext }) {
  return (
    <article className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur">
      <div className="flex items-start gap-3 sm:block">
        <p className="shrink-0 text-[30px] leading-none">{icon}</p>
        <div className="min-w-0">
          <p className="text-[14px] font-extrabold leading-tight text-slate-500 sm:mt-2 sm:text-[15px]">{title}</p>
          <p className="mt-1 break-words text-[22px] font-black leading-tight text-slate-950 sm:text-[24px]">{value}</p>
          {subtext ? <p className="mt-1 text-[13px] font-bold leading-snug text-slate-500 sm:text-[14px]">{subtext}</p> : null}
        </div>
      </div>
    </article>
  );
}

function Field({ label, children, readonly, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-[17px] font-black text-slate-800">{label}</span>
      <div className="mt-2 min-w-0">{children}</div>
      {readonly ? <span className="mt-1 block text-[13px] font-bold text-slate-500">ही माहिती बदलता येत नाही.</span> : null}
    </label>
  );
}

function inputClass(readonly = false) {
  return `min-h-[54px] w-full min-w-0 rounded-xl border-2 px-4 text-[18px] font-bold outline-none ${
    readonly
      ? "border-slate-200 bg-slate-100 text-slate-600"
      : "border-slate-200 bg-white text-slate-950 focus:border-green-500"
  }`;
}

function ReadOnlyInput({ value, mono = false }) {
  const text = String(safeText(value));
  return (
    <input
      readOnly
      value={text}
      title={text}
      className={`${inputClass(true)} truncate ${mono ? "font-mono text-[14px] sm:text-[16px]" : ""}`}
    />
  );
}

const settingsLinks = [
  { href: "/settings/security", icon: "🔒", title: "सुरक्षा केंद्र", subtitle: "PIN, Password, Sessions", className: "border-slate-200 bg-slate-50 text-slate-950" },
  { href: "/settings/notifications", icon: "🔔", title: "सूचना सेटिंग्ज", subtitle: "Push आणि शांत वेळ", className: "border-yellow-200 bg-yellow-50 text-yellow-950" },
  { href: "/settings/appearance", icon: "🎨", title: "दिसणे", subtitle: "Theme, Font, Language", className: "border-sky-200 bg-sky-50 text-sky-950" },
  { href: "/settings/ai", icon: "🤖", title: "दुग्धमित्र AI", subtitle: "उत्तर शैली आणि permissions", className: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  { href: "/settings/goals", icon: "🎯", title: "दूध लक्ष्य", subtitle: "Daily, weekly, monthly goals", className: "border-orange-200 bg-orange-50 text-orange-950" },
  { href: "/profile/statistics", icon: "📊", title: "वैयक्तिक आकडेवारी", subtitle: "Performance आणि growth", className: "border-purple-200 bg-purple-50 text-purple-950" },
  { href: "/profile/achievements", icon: "🏆", title: "Achievements", subtitle: "Badges आणि rewards", className: "border-amber-200 bg-amber-50 text-amber-950" },
  { href: "/profile/score", icon: "⭐", title: "Dairy Score", subtitle: "Score आणि rank", className: "border-slate-200 bg-slate-900 text-white" },
  { href: "/settings/export", icon: "📦", title: "Export आणि Backup", subtitle: "Data download", className: "border-indigo-200 bg-indigo-50 text-indigo-950" }
];

export default function ProfilePage() {
  const { checkAuth } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    farm_name: "",
    name: "",
    village_name: "",
    taluka_name: "",
    district_name: "",
    state_name: "महाराष्ट्र"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isAhilyanagarSelected = isAhilyanagarDistrict(form.district_name);
  const talukaOptions = useMemo(
    () => (isAhilyanagarSelected ? getAhilyanagarTalukas() : []),
    [isAhilyanagarSelected]
  );
  const villageOptions = useMemo(
    () => (isAhilyanagarSelected ? getAhilyanagarVillages(form.taluka_name) : []),
    [isAhilyanagarSelected, form.taluka_name]
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        cache: "no-store",
        headers: authHeader()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Profile माहिती मिळाली नाही.");
      setData(result);
      setForm({
        farm_name: result.farm?.farmName || "",
        name: result.rawUser?.name || "",
        village_name: result.profile?.village_name || result.farm?.villageName || "",
        taluka_name: result.profile?.taluka_name || result.farm?.talukaName || "",
        district_name: result.profile?.district_name || result.farm?.districtName || "पुणे",
        state_name: result.profile?.state_name || result.farm?.stateName || "महाराष्ट्र"
      });
    } catch (loadError) {
      setError(loadError.message || "Profile माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccess("");
    setError("");
  }

  function updateDistrict(value) {
    setForm((current) => {
      const nextIsAhilyanagar = isAhilyanagarDistrict(value);
      if (!nextIsAhilyanagar) {
        return {
          ...current,
          district_name: value
        };
      }

      const currentTalukaValid = getAhilyanagarTalukas().includes(current.taluka_name);
      const nextTaluka = currentTalukaValid ? current.taluka_name : "";
      const currentVillageValid = nextTaluka
        ? getAhilyanagarVillages(nextTaluka).includes(current.village_name)
        : false;

      return {
        ...current,
        district_name: value,
        taluka_name: nextTaluka,
        village_name: currentVillageValid ? current.village_name : ""
      };
    });
    setSuccess("");
    setError("");
  }

  function updateTaluka(value) {
    const nextVillageOptions = getAhilyanagarVillages(value);
    setForm((current) => ({
      ...current,
      taluka_name: value,
      village_name: isAhilyanagarDistrict(current.district_name) && !nextVillageOptions.includes(current.village_name)
        ? ""
        : current.village_name
    }));
    setSuccess("");
    setError("");
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Profile जतन झाले नाही.");
      setData(result);
      await checkAuth();
      setSuccess("✅ Profile जतन झाले.");
    } catch (saveError) {
      setError(saveError.message || "Profile जतन झाले नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return <LoadingState text="Profile लोड होत आहे..." />;
  }

  const user = data?.user || {};
  const rawUser = data?.rawUser || {};
  const farm = data?.farm || {};
  const stats = data?.stats || {};
  const photo = rawUser.profile_photo_url || user.profilePhotoUrl || "";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-24">
      <PageHeader title="👤 माझी माहिती" subtitle="वैयक्तिक माहिती, फोटो आणि खाते सेटिंग्ज" />

      {error ? <ErrorState message={error} /> : null}
      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-[18px] font-black text-green-800">
          {success}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-green-700 via-emerald-600 to-sky-700 p-5 text-white shadow-soft sm:p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-2 border-white/60 bg-white/20 shadow-lg sm:h-20 sm:w-20 sm:rounded-2xl">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={rawUser.name || "Profile"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[42px]">👤</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-[28px] font-black leading-tight sm:text-[30px]">{rawUser.name || user.name || "-"}</h1>
            <p className="mt-1 break-words text-[17px] font-bold text-white/85">🏡 {farm.farmName || "-"}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[14px] font-black">👨‍🌾 {roleLabel(user)}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[14px] font-black">📅 सदस्य: {monthYear(rawUser.created_at)}</span>
            </div>
          </div>
        </div>
      </section>

      <ProfilePhotoUploader
        value={photo}
        name={rawUser.name || user.name}
        onUploaded={async () => {
          await loadProfile();
          await checkAuth();
        }}
        onRemoved={async () => {
          await loadProfile();
          await checkAuth();
        }}
      />

      <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-[24px]">📝</div>
          <div className="min-w-0">
            <h2 className="text-[23px] font-black leading-tight text-slate-950">वैयक्तिक माहिती</h2>
            <p className="mt-1 text-[15px] font-bold leading-snug text-slate-500">नाव आणि गावाची माहिती इथे अपडेट करा.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="डेअरी / फार्मचे नाव" className="md:col-span-2">
            <MarathiTextInput value={form.farm_name} onValueChange={(value) => update("farm_name", value)} className={inputClass()} />
          </Field>
          <Field label="पूर्ण नाव">
            <MarathiTextInput value={form.name} onValueChange={(value) => update("name", value)} className={inputClass()} />
          </Field>
          <Field label="मोबाइल नंबर" readonly>
            <ReadOnlyInput value={rawUser.mobile ? toMarathiNumerals(rawUser.mobile) : "-"} />
          </Field>
          <Field label="Email" readonly>
            <ReadOnlyInput value={rawUser.email || "-"} />
          </Field>
          <Field label="जिल्हा">
            <select value={form.district_name} onChange={(event) => updateDistrict(event.target.value)} className={inputClass()}>
              {form.district_name && !MAHARASHTRA_DISTRICTS.includes(form.district_name) ? (
                <option value={form.district_name}>{form.district_name}</option>
              ) : null}
              {MAHARASHTRA_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district === "अहिल्यानगर" ? "अहिल्यानगर (नवीन नाव)" : district === "अहमदनगर" ? "अहमदनगर (जुने नाव)" : district}
                </option>
              ))}
            </select>
          </Field>
          <Field label="तालुका">
            {isAhilyanagarSelected ? (
              <select value={form.taluka_name} onChange={(event) => updateTaluka(event.target.value)} className={inputClass()}>
                <option value="">तालुका निवडा</option>
                {form.taluka_name && !talukaOptions.includes(form.taluka_name) ? (
                  <option value={form.taluka_name}>{form.taluka_name}</option>
                ) : null}
                {talukaOptions.map((taluka) => <option key={taluka} value={taluka}>{taluka}</option>)}
              </select>
            ) : (
              <MarathiTextInput value={form.taluka_name} onValueChange={(value) => update("taluka_name", value)} className={inputClass()} />
            )}
          </Field>
          <Field label="गाव">
            {isAhilyanagarSelected ? (
              <select
                value={form.village_name}
                onChange={(event) => update("village_name", event.target.value)}
                disabled={!form.taluka_name}
                className={`${inputClass()} disabled:bg-slate-100 disabled:text-slate-500`}
              >
                <option value="">{form.taluka_name ? "गाव निवडा" : "आधी तालुका निवडा"}</option>
                {form.village_name && !villageOptions.includes(form.village_name) ? (
                  <option value={form.village_name}>{form.village_name}</option>
                ) : null}
                {villageOptions.map((village) => <option key={village} value={village}>{village}</option>)}
              </select>
            ) : (
              <MarathiTextInput value={form.village_name} onValueChange={(value) => update("village_name", value)} className={inputClass()} />
            )}
          </Field>
          <Field label="राज्य">
            <MarathiTextInput value={form.state_name} onValueChange={(value) => update("state_name", value)} className={inputClass()} />
          </Field>
          {isAhilyanagarSelected ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-[15px] font-black leading-snug text-green-800 md:col-span-2">
              अहिल्यानगर जिल्ह्यासाठी official १४ तालुके आणि १६०२ गावांची dropdown यादी वापरली आहे. तालुका बदलल्यावर गावांची यादी आपोआप बदलेल.
            </div>
          ) : null}
          <Field label="खाते तयार झाले" readonly className="md:col-span-2">
            <ReadOnlyInput value={dateText(rawUser.created_at)} />
          </Field>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-5 min-h-[56px] w-full rounded-xl bg-green-600 px-4 text-[20px] font-black text-white shadow-soft disabled:bg-slate-300"
        >
          {saving ? "जतन होत आहे..." : "✅ Profile जतन करा"}
        </button>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <InfoCard title="डेअरी माहिती" rows={[
          ["डेअरी नाव", farm.farmName],
          ["गाव", farm.villageName || form.village_name],
          ["तालुका", farm.talukaName || form.taluka_name],
          ["जिल्हा", farm.districtName || form.district_name],
          ["Plan स्थिती", farm.subscriptionStatus],
          ["Plan शेवट", dateText(farm.subscriptionEndsAt || farm.trialEndsAt)],
          ["गायी", toMarathiNumerals(stats.cowCount || farm.totalCows || 0)],
          ["दूध नोंदी", toMarathiNumerals(stats.milkRecordsCount || 0)]
        ]} />
        <QuickSettingsCard />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="🥛" title="एकूण दूध" value={`${toMarathiNumerals(Number(stats.totalMilk || 0).toFixed(2))} लि.`} />
        <StatCard icon="💰" title="एकूण उत्पन्न" value={formatCurrency(stats.totalIncome || 0)} />
        <StatCard icon="📷" title="अपलोड स्लिप" value={toMarathiNumerals(stats.totalSlipsUploaded || 0)} />
        <StatCard icon="🤖" title="AI प्रश्न" value={toMarathiNumerals(stats.aiQuestionsAsked || 0)} subtext={`${toMarathiNumerals(stats.daysActive || 1)} दिवस सक्रिय`} />
      </section>
    </div>
  );
}

function InfoCard({ title, rows }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
      <h2 className="text-[22px] font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl bg-slate-50 p-3">
            <p className="text-[13px] font-black text-slate-500">{label}</p>
            <p className="mt-1 break-words text-[17px] font-extrabold leading-snug text-slate-900">{safeText(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickSettingsCard() {
  return (
    <section className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-black leading-tight text-slate-950">झटपट सेटिंग्ज</h2>
          <p className="mt-1 text-[15px] font-bold leading-snug text-slate-500">खाते, AI, export आणि आकडेवारी एका ठिकाणी.</p>
        </div>
        <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-[13px] font-black text-green-800">Profile</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {settingsLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`min-w-0 rounded-2xl border p-3 shadow-sm active:scale-[0.98] ${item.className}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[22px] shadow-sm">{item.icon}</span>
              <div className="min-w-0">
                <p className="break-words text-[16px] font-black leading-tight">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-tight opacity-75">{item.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
