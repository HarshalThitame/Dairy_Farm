"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";
import ProfilePhotoUploader from "@/components/settings/ProfilePhotoUploader";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

const districts = [
  "पुणे", "मुंबई", "नाशिक", "छत्रपती संभाजीनगर", "नागपूर", "अहमदनगर", "सोलापूर",
  "सातारा", "सांगली", "कोल्हापूर", "जळगाव", "धुळे", "नंदुरबार", "अमरावती",
  "अकोला", "बुलढाणा", "यवतमाळ", "वर्धा", "भंडारा", "गोंदिया", "चंद्रपूर",
  "गडचिरोली", "लातूर", "उस्मानाबाद", "बीड", "नांदेड", "परभणी", "हिंगोली",
  "जालना", "रत्नागिरी", "सिंधुदुर्ग", "रायगड", "ठाणे", "पालघर"
];

function authHeader() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("goshala_token") : "";
  return token ? { Authorization: `Bearer ${token}` } : {};
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

function StatCard({ icon, title, value, subtext }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur">
      <p className="text-[30px]">{icon}</p>
      <p className="mt-2 text-[15px] font-extrabold text-slate-500">{title}</p>
      <p className="mt-1 text-[24px] font-black text-slate-950">{value}</p>
      {subtext ? <p className="mt-1 text-[14px] font-bold text-slate-500">{subtext}</p> : null}
    </div>
  );
}

function Field({ label, children, readonly }) {
  return (
    <label className="block">
      <span className="text-[17px] font-black text-slate-800">{label}</span>
      <div className="mt-2">{children}</div>
      {readonly ? <span className="mt-1 block text-[13px] font-bold text-slate-500">ही माहिती बदलता येत नाही.</span> : null}
    </label>
  );
}

function inputClass(readonly = false) {
  return `min-h-[54px] w-full rounded-xl border-2 px-4 text-[18px] font-bold outline-none ${
    readonly
      ? "border-slate-200 bg-slate-100 text-slate-600"
      : "border-slate-200 bg-white text-slate-950 focus:border-green-500"
  }`;
}

export default function ProfilePage() {
  const { checkAuth } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
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
    <div className="space-y-5 pb-24">
      <PageHeader title="👤 माझी माहिती" subtitle="वैयक्तिक माहिती, फोटो आणि खाते सेटिंग्ज" />

      {error ? <ErrorState message={error} /> : null}
      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-[18px] font-black text-green-800">
          {success}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-green-700 via-emerald-600 to-sky-700 p-5 text-white shadow-soft">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/60 bg-white/20">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={rawUser.name || "Profile"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[42px]">👤</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[27px] font-black">{rawUser.name || user.name}</h1>
            <p className="mt-1 text-[17px] font-bold text-white/85">🏡 {farm.farmName || "-"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
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

      <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur">
        <h2 className="text-[23px] font-black text-slate-950">वैयक्तिक माहिती</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="पूर्ण नाव">
            <MarathiTextInput value={form.name} onValueChange={(value) => update("name", value)} className={inputClass()} />
          </Field>
          <Field label="मोबाइल नंबर" readonly>
            <input readOnly value={rawUser.mobile ? toMarathiNumerals(rawUser.mobile) : "-"} className={inputClass(true)} />
          </Field>
          <Field label="Email" readonly>
            <input readOnly value={rawUser.email || "-"} className={inputClass(true)} />
          </Field>
          <Field label="User ID" readonly>
            <input readOnly value={rawUser.id || "-"} className={inputClass(true)} />
          </Field>
          <Field label="गाव">
            <MarathiTextInput value={form.village_name} onValueChange={(value) => update("village_name", value)} className={inputClass()} />
          </Field>
          <Field label="तालुका">
            <MarathiTextInput value={form.taluka_name} onValueChange={(value) => update("taluka_name", value)} className={inputClass()} />
          </Field>
          <Field label="जिल्हा">
            <select value={form.district_name} onChange={(event) => update("district_name", event.target.value)} className={inputClass()}>
              {districts.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </Field>
          <Field label="राज्य">
            <MarathiTextInput value={form.state_name} onValueChange={(value) => update("state_name", value)} className={inputClass()} />
          </Field>
          <Field label="खाते तयार झाले" readonly>
            <input readOnly value={dateText(rawUser.created_at)} className={inputClass(true)} />
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

      <section className="grid gap-3 sm:grid-cols-2">
        <InfoCard title="डेअरी माहिती" rows={[
          ["डेअरी नाव", farm.farmName],
          ["डेअरी ID", farm.id],
          ["जिल्हा", farm.districtName],
          ["Plan स्थिती", farm.subscriptionStatus],
          ["Plan शेवट", dateText(farm.subscriptionEndsAt || farm.trialEndsAt)],
          ["गायी", toMarathiNumerals(stats.cowCount || farm.totalCows || 0)],
          ["दूध नोंदी", toMarathiNumerals(stats.milkRecordsCount || 0)]
        ]} />
        <InfoCard title="झटपट सेटिंग्ज" rows={[
          ["सुरक्षा", "PIN, Password, Sessions"],
          ["सूचना", "Push, शांत वेळ"],
          ["दिसणे", "Theme, Font, Language"],
          ["दुग्धमित्र AI", "उत्तर शैली, data permission"],
          ["दूध लक्ष्य", "Daily, weekly, monthly goals"],
          ["आकडेवारी", "Performance आणि growth dashboard"],
          ["Achievements", "Badges, score आणि rewards"],
          ["Export", "Data download आणि backup"]
        ]} links />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard icon="🥛" title="एकूण दूध" value={`${toMarathiNumerals(Number(stats.totalMilk || 0).toFixed(2))} लि.`} />
        <StatCard icon="💰" title="एकूण उत्पन्न" value={formatCurrency(stats.totalIncome || 0)} />
        <StatCard icon="📷" title="अपलोड स्लिप" value={toMarathiNumerals(stats.totalSlipsUploaded || 0)} />
        <StatCard icon="🤖" title="AI प्रश्न" value={toMarathiNumerals(stats.aiQuestionsAsked || 0)} subtext={`${toMarathiNumerals(stats.daysActive || 1)} दिवस सक्रिय`} />
      </section>
    </div>
  );
}

function InfoCard({ title, rows, links = false }) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur">
      <h2 className="text-[22px] font-black text-slate-950">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <p className="text-[13px] font-black uppercase text-slate-500">{label}</p>
            <p className="mt-1 break-words text-[17px] font-extrabold text-slate-900">{value || "-"}</p>
          </div>
        ))}
      </div>
      {links ? (
        <div className="mt-3 grid gap-2">
          <Link href="/settings/security" className="min-h-[48px] rounded-xl bg-slate-900 px-4 py-3 text-center text-[17px] font-black text-white">🔒 सुरक्षा केंद्र</Link>
          <Link href="/settings/notifications" className="min-h-[48px] rounded-xl bg-yellow-500 px-4 py-3 text-center text-[17px] font-black text-white">🔔 सूचना सेटिंग्ज</Link>
          <Link href="/settings/appearance" className="min-h-[48px] rounded-xl bg-sky-600 px-4 py-3 text-center text-[17px] font-black text-white">🎨 दिसणे</Link>
          <Link href="/settings/ai" className="min-h-[48px] rounded-xl bg-emerald-600 px-4 py-3 text-center text-[17px] font-black text-white">🤖 दुग्धमित्र AI</Link>
          <Link href="/settings/goals" className="min-h-[48px] rounded-xl bg-orange-500 px-4 py-3 text-center text-[17px] font-black text-white">🎯 दूध लक्ष्य</Link>
          <Link href="/profile/statistics" className="min-h-[48px] rounded-xl bg-purple-600 px-4 py-3 text-center text-[17px] font-black text-white">📊 वैयक्तिक आकडेवारी</Link>
          <Link href="/profile/achievements" className="min-h-[48px] rounded-xl bg-yellow-500 px-4 py-3 text-center text-[17px] font-black text-white">🏆 Achievements</Link>
          <Link href="/profile/score" className="min-h-[48px] rounded-xl bg-slate-900 px-4 py-3 text-center text-[17px] font-black text-white">⭐ Dairy Score</Link>
          <Link href="/settings/export" className="min-h-[48px] rounded-xl bg-indigo-600 px-4 py-3 text-center text-[17px] font-black text-white">📦 Export आणि Backup</Link>
        </div>
      ) : null}
    </section>
  );
}
