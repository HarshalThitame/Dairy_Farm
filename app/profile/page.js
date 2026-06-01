"use client";

import { useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useSpeechNotification } from "@/hooks/useSpeechNotification";
import { formatCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

const districts = [
  "पुणे",
  "मुंबई",
  "नाशिक",
  "छत्रपती संभाजीनगर",
  "नागपूर",
  "अहमदनगर",
  "सोलापूर",
  "सातारा",
  "सांगली",
  "कोल्हापूर",
  "जळगाव",
  "धुळे",
  "नंदुरबार",
  "अमरावती",
  "अकोला",
  "बुलढाणा",
  "यवतमाळ",
  "वर्धा",
  "भंडारा",
  "गोंदिया",
  "चंद्रपूर",
  "गडचिरोली",
  "लातूर",
  "उस्मानाबाद",
  "बीड",
  "नांदेड",
  "परभणी",
  "हिंगोली",
  "जालना",
  "रत्नागिरी",
  "सिंधुदुर्ग",
  "रायगड",
  "ठाणे",
  "पालघर"
];

const tabs = ["मूलभूत माहिती", "डेअरी माहिती", "पशुवैद्यक माहिती", "सेटिंग्ज"];

function emptyForm() {
  return {
    farm_name: "",
    owner_name: "",
    owner_mobile: "",
    village_name: "",
    taluka_name: "",
    district_name: "पुणे",
    state_name: "महाराष्ट्र",
    farm_address: "",
    total_cows: "",
    dairy_name: "",
    dairy_member_number: "",
    milk_rate_default: "32",
    morning_session_time: "06:00",
    evening_session_time: "17:00",
    vet_name: "",
    vet_mobile: "",
    show_marathi_numbers: true,
    low_milk_alert_litres: "5"
  };
}

function farmToForm(farm) {
  return {
    farm_name: farm?.farmName || "",
    owner_name: farm?.ownerName || "",
    owner_mobile: farm?.ownerMobile || "",
    village_name: farm?.villageName || "",
    taluka_name: farm?.talukaName || "",
    district_name: farm?.districtName || "पुणे",
    state_name: farm?.stateName || "महाराष्ट्र",
    farm_address: farm?.farmAddress || "",
    total_cows: farm?.totalCows ?? "",
    dairy_name: farm?.dairyName || "",
    dairy_member_number: farm?.dairyMemberNumber || "",
    milk_rate_default: farm?.milkRateDefault ?? "32",
    morning_session_time: farm?.morningSessionTime || "06:00",
    evening_session_time: farm?.eveningSessionTime || "17:00",
    vet_name: farm?.vetName || "",
    vet_mobile: farm?.vetMobile || "",
    show_marathi_numbers: farm?.showMarathiNumbers !== false,
    low_milk_alert_litres: farm?.lowMilkAlertLitres ?? "5"
  };
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-[20px] font-extrabold text-slate-900">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? (
        <span className="mt-2 block text-[18px] font-bold text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function inputClass(readOnly = false) {
  return [
    "min-h-[56px] w-full rounded-lg border-2 px-4 text-[20px] font-bold outline-none",
    readOnly
      ? "border-slate-200 bg-slate-100 text-slate-600"
      : "border-slate-200 bg-white text-slate-950 focus:border-sheti"
  ].join(" ");
}

export default function ProfilePage() {
  const { farm, isFarmOwner, isAdmin, isSuperAdmin, refreshFarm } = useAuth();
  const {
    settings: voiceSettings,
    supported: speechSupported,
    voiceInfo,
    updateSettings: updateVoiceSettings,
    testVoice
  } = useSpeechNotification();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const canEdit = isFarmOwner || isAdmin || isSuperAdmin;

  useEffect(() => {
    if (farm) {
      setForm(farmToForm(farm));
    }
  }, [farm]);

  useEffect(() => {
    refreshFarm().catch(() => {});
  }, [refreshFarm]);

  const ownerMobileDisplay = useMemo(() => {
    return form.owner_mobile ? toMarathiNumerals(form.owner_mobile) : "माहिती नाही";
  }, [form.owner_mobile]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
    setError("");
    setSuccess("");
  }

  function toggleVoiceNotifications() {
    if (!speechSupported) {
      setError("या browser मध्ये आवाज सूचना support नाही.");
      return;
    }

    updateVoiceSettings({ enabled: !voiceSettings.enabled });
  }

  function updateVoiceVolume(value) {
    updateVoiceSettings({ volume: Number(value) / 100 });
  }

  function testVoiceNotification() {
    if (!speechSupported) {
      setError("या browser मध्ये आवाज सूचना support नाही.");
      return;
    }

    testVoice();
    setSuccess("🔊 आवाज तपासणी सुरू झाली.");
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      total_cows: Number(form.total_cows || 0),
      milk_rate_default: Number(form.milk_rate_default || 0),
      low_milk_alert_litres: Number(form.low_milk_alert_litres || 0)
    };
    delete payload.owner_mobile;

    try {
      const token = localStorage.getItem("goshala_token") || "";
      const response = await fetch("/api/farms/current", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "माहिती जतन झाली नाही.");
      }

      if (result.data) {
        setForm(farmToForm(result.data));
      }
      await refreshFarm();
      setSuccess("✅ माहिती जतन झाली!");
    } catch (saveError) {
      setError(saveError.message || "माहिती जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (!farm) {
    return <LoadingState text="डेअरीची माहिती लोड होत आहे..." />;
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="🏠 डेअरीची माहिती" subtitle={farm.farmName} />

      {!canEdit ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-[19px] font-bold text-blue-900">
          ℹ️ फक्त मालकच माहिती बदलू शकतात.
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-[19px] font-extrabold text-green-800">
          {success}
        </div>
      ) : null}

      {error ? <ErrorState message={error} /> : null}

      <section className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-[52px] shrink-0 rounded-full border-2 px-4 text-[18px] font-extrabold ${
                activeTab === tab
                  ? "border-green-300 bg-green-100 text-sheti"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "मूलभूत माहिती" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-slate-950">डेअरी ओळख</h2>
          <Field label="डेअरीचे नाव *">
            <MarathiTextInput
              readOnly={!canEdit}
              value={form.farm_name}
              onValueChange={(value) => updateField("farm_name", value)}
              className={inputClass(!canEdit)}
            />
          </Field>
          <Field label="मालकाचे नाव *">
            <MarathiTextInput
              readOnly={!canEdit}
              value={form.owner_name}
              onValueChange={(value) => updateField("owner_name", value)}
              className={inputClass(!canEdit)}
            />
          </Field>
          <Field label="मोबाइल नंबर *" hint="मोबाइल नंबर बदलता येत नाही.">
            <input readOnly value={ownerMobileDisplay} className={inputClass(true)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="गावाचे नाव">
              <MarathiTextInput
                readOnly={!canEdit}
                value={form.village_name}
                onValueChange={(value) => updateField("village_name", value)}
                className={inputClass(!canEdit)}
              />
            </Field>
            <Field label="तालुक्याचे नाव">
              <MarathiTextInput
                readOnly={!canEdit}
                value={form.taluka_name}
                onValueChange={(value) => updateField("taluka_name", value)}
                className={inputClass(!canEdit)}
              />
            </Field>
          </div>
          <Field label="जिल्ह्याचे नाव *">
            <select
              disabled={!canEdit}
              value={form.district_name}
              onChange={(event) => updateField("district_name", event.target.value)}
              className={inputClass(!canEdit)}
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </Field>
          <Field label="राज्य">
            <MarathiTextInput
              readOnly={!canEdit}
              value={form.state_name}
              onValueChange={(value) => updateField("state_name", value)}
              className={inputClass(!canEdit)}
            />
          </Field>
          <Field label="पूर्ण पत्ता">
            <MarathiTextInput
              multiline
              readOnly={!canEdit}
              rows={4}
              value={form.farm_address}
              onValueChange={(value) => updateField("farm_address", value)}
              className={`${inputClass(!canEdit)} py-3`}
            />
          </Field>
          <Field label="एकूण गायी" hint="ही संख्या केवळ माहितीसाठी आहे.">
            <input
              readOnly={!canEdit}
              type="number"
              inputMode="numeric"
              min="0"
              value={form.total_cows}
              onChange={(event) => updateField("total_cows", event.target.value)}
              className={inputClass(!canEdit)}
            />
          </Field>
        </section>
      ) : null}

      {activeTab === "डेअरी माहिती" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-slate-950">डेअरी माहिती</h2>
          <Field label="दूध संकलन केंद्राचे नाव">
            <MarathiTextInput
              readOnly={!canEdit}
              value={form.dairy_name}
              onValueChange={(value) => updateField("dairy_name", value)}
              placeholder="उदा. नांदूर डेअरी"
              className={inputClass(!canEdit)}
            />
          </Field>
          <Field label="डेअरी सदस्य नंबर">
            <input
              readOnly={!canEdit}
              value={form.dairy_member_number}
              onChange={(event) => updateField("dairy_member_number", event.target.value)}
              placeholder="उदा. १०४२"
              className={inputClass(!canEdit)}
            />
          </Field>
          <Field label="दुधाचा सरासरी दर">
            <input
              readOnly={!canEdit}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.milk_rate_default}
              onChange={(event) => updateField("milk_rate_default", event.target.value)}
              className={inputClass(!canEdit)}
            />
            <span className="mt-2 block text-[18px] font-bold text-slate-500">
              सध्याचा दर: {formatCurrency(form.milk_rate_default || 0)} / लिटर
            </span>
          </Field>
          <Field label="सकाळचे दूध काढण्याची वेळ">
            <input
              readOnly={!canEdit}
              type="time"
              value={form.morning_session_time}
              onChange={(event) => updateField("morning_session_time", event.target.value)}
              className={inputClass(!canEdit)}
            />
          </Field>
          <Field label="संध्याकाळचे दूध काढण्याची वेळ">
            <input
              readOnly={!canEdit}
              type="time"
              value={form.evening_session_time}
              onChange={(event) => updateField("evening_session_time", event.target.value)}
              className={inputClass(!canEdit)}
            />
          </Field>
        </section>
      ) : null}

      {activeTab === "पशुवैद्यक माहिती" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-slate-950">पशुवैद्यक माहिती</h2>
          <Field label="पशुवैद्यकाचे नाव">
            <MarathiTextInput
              readOnly={!canEdit}
              value={form.vet_name}
              onValueChange={(value) => updateField("vet_name", value)}
              className={inputClass(!canEdit)}
            />
          </Field>
          <Field label="पशुवैद्यकाचा मोबाइल नंबर">
            <input
              readOnly={!canEdit}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.vet_mobile}
              onChange={(event) => updateField("vet_mobile", event.target.value.replace(/\D/g, "").slice(0, 10))}
              className={inputClass(!canEdit)}
            />
          </Field>
          {form.vet_mobile ? (
            <a
              href={`tel:${form.vet_mobile}`}
              className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white shadow-soft"
            >
              📞 फोन करा
            </a>
          ) : null}
        </section>
      ) : null}

      {activeTab === "सेटिंग्ज" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-slate-950">सेटिंग्ज</h2>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[20px] font-extrabold text-slate-950">आवाज सूचना</p>
                <p className="mt-1 text-[18px] font-bold text-slate-600">
                  नवीन आठवण आली की app मराठीत मोठ्याने वाचून दाखवेल.
                </p>
                <p className="mt-2 text-[16px] font-bold text-slate-500">
                  {speechSupported
                    ? `Voice: ${voiceInfo.voiceName || "browser default"} ${voiceInfo.voiceLanguage ? `(${voiceInfo.voiceLanguage})` : ""}`
                    : "या browser मध्ये voice support नाही."}
                </p>
              </div>
              <button
                type="button"
                disabled={!speechSupported}
                onClick={toggleVoiceNotifications}
                className={`min-h-[52px] min-w-[86px] rounded-full px-3 text-[18px] font-extrabold text-white ${
                  voiceSettings.enabled && speechSupported ? "bg-sheti" : "bg-slate-400"
                } disabled:opacity-60`}
              >
                {voiceSettings.enabled && speechSupported ? "चालू" : "बंद"}
              </button>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[18px] font-extrabold text-slate-900">आवाजाची तीव्रता</p>
                <p className="text-[20px] font-black text-sheti">
                  {toMarathiNumerals(Math.round(Number(voiceSettings.volume || 0) * 100))}%
                </p>
              </div>
              <input
                disabled={!speechSupported}
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(Number(voiceSettings.volume || 0) * 100)}
                onChange={(event) => updateVoiceVolume(event.target.value)}
                className="mt-2 w-full accent-green-600 disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              disabled={!speechSupported}
              onClick={testVoiceNotification}
              className="mt-4 min-h-[52px] w-full rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
            >
              🔊 आवाज तपासा
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[20px] font-extrabold text-slate-950">मराठी अंक दाखवा</p>
                <p className="mt-1 text-[18px] font-bold text-slate-500">
                  दूध, तारखा इ. मराठी अंकात दाखवा.
                </p>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => updateField("show_marathi_numbers", !form.show_marathi_numbers)}
                className={`min-h-[52px] min-w-[86px] rounded-full px-3 text-[18px] font-extrabold text-white ${
                  form.show_marathi_numbers ? "bg-sheti" : "bg-slate-400"
                } disabled:opacity-60`}
              >
                {form.show_marathi_numbers ? "चालू" : "बंद"}
              </button>
            </div>
          </div>
          <Field label="कमी दूध सूचना" hint="जर दूध या लिटर पेक्षा कमी झाले तर सूचना.">
            <input
              readOnly={!canEdit}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={form.low_milk_alert_litres}
              onChange={(event) => updateField("low_milk_alert_litres", event.target.value)}
              className={inputClass(!canEdit)}
            />
          </Field>
        </section>
      ) : null}

      {canEdit ? (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-3xl px-4 sm:px-6">
          <button
            type="button"
            disabled={saving}
            onClick={saveProfile}
            className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-lg disabled:bg-slate-400"
          >
            {saving ? "जतन होत आहे..." : "✅ बदल जतन करा"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
