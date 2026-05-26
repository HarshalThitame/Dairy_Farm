"use client";

import { useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";

const weakPins = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "4321"
]);

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function PinBoxes({ label, value, onChange }) {
  const refs = useRef([]);

  function updateDigit(index, nextValue) {
    const digit = onlyDigits(nextValue).slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div>
      <p className="text-[20px] font-extrabold text-slate-900">{label}</p>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {value.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className="h-[58px] rounded-lg border-2 border-slate-200 text-center text-[28px] font-extrabold outline-none focus:border-sheti"
          />
        ))}
      </div>
    </div>
  );
}

export default function ChangePinPage() {
  const { logout } = useAuth();
  const [currentPin, setCurrentPin] = useState(["", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function submitPin(event) {
    event.preventDefault();
    const currentValue = currentPin.join("");
    const newValue = newPin.join("");
    const confirmValue = confirmPin.join("");

    if (currentValue.length !== 4 || newValue.length !== 4 || confirmValue.length !== 4) {
      setError("सर्व PIN ४ अंकी लिहा.");
      return;
    }

    if (currentValue === newValue) {
      setError("नवीन PIN सध्याच्या PIN पेक्षा वेगळा असावा.");
      return;
    }

    if (newValue !== confirmValue) {
      setError("नवीन PIN दोन्ही ठिकाणी सारखा नाही.");
      return;
    }

    if (weakPins.has(newValue)) {
      setError("हा PIN खूप सोपा आहे. वेगळा PIN निवडा.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("goshala_token") || "";
      const response = await fetch("/api/auth/change-pin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPin: currentValue,
          newPin: newValue
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "PIN बदलला नाही.");
      }

      setSuccess("✅ PIN यशस्वीरित्या बदलला! नवीन PIN सह पुन्हा खाते उघडा.");
      window.setTimeout(() => logout(), 2000);
    } catch (changeError) {
      setError(changeError.message || "PIN बदलला नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="🔑 PIN बदला" />

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-[19px] font-extrabold text-green-800">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[19px] font-extrabold text-red-800">
          {error}
        </div>
      ) : null}

      <form onSubmit={submitPin} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <PinBoxes label="सध्याचा PIN" value={currentPin} onChange={setCurrentPin} />
        <PinBoxes label="नवीन PIN" value={newPin} onChange={setNewPin} />
        <PinBoxes label="नवीन PIN पुन्हा" value={confirmPin} onChange={setConfirmPin} />
        <button
          type="submit"
          disabled={saving}
          className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
        >
          {saving ? "PIN बदलत आहे..." : "✅ PIN बदला"}
        </button>
      </form>
    </div>
  );
}
