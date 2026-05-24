"use client";

import { useEffect, useState } from "react";

const styles = {
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
  error: "border-red-200 bg-red-50 text-red-800"
};

export function showToast(message, type = "success", duration = 3500) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("goshala-toast", {
        detail: { message, type, duration }
      })
    );
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function addToast(event) {
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message: event.detail?.message || "",
        type: event.detail?.type || "success"
      };

      setToasts((current) => [...current, toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, event.detail?.duration || 3500);
    }

    window.addEventListener("goshala-toast", addToast);
    return () => window.removeEventListener("goshala-toast", addToast);
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-12 z-[70] mx-auto flex max-w-3xl flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border-2 px-4 py-3 text-[18px] font-extrabold shadow-soft ${
            styles[toast.type] || styles.success
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
