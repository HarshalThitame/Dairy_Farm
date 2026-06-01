"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import { SuperAdminProvider, useSuperAdmin } from "@/context/SuperAdminContext";

function AdminLoginContent() {
  const router = useRouter();
  const { login, isAuthenticated } = useSuperAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= 5;

  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      router.replace(params.get("from") || "/admin");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (locked) {
      setError("Too many failed attempts. Try again later.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setAttempts((value) => value + 1);
      setError(result.error || "Invalid credentials");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    router.replace(params.get("from") || "/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="text-[56px] leading-none">🔐</div>
          <BrandLockup size="sm" center invert className="mt-4" />
          <p className="mt-2 text-[18px] text-slate-400">Smart Dairy Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-[18px] font-bold text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="mt-2 min-h-[56px] w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-[18px] text-white outline-none focus:border-green-500"
              required
            />
          </label>

          <label className="block">
            <span className="text-[18px] font-bold text-slate-200">Password</span>
            <div className="mt-2 flex min-h-[56px] overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-green-500">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="min-h-[56px] flex-1 bg-transparent px-4 text-[18px] text-white outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="min-h-[56px] px-4 text-[18px] font-bold text-green-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-[18px] font-bold text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || locked}
            className="min-h-[56px] w-full rounded-lg bg-green-600 px-5 text-[20px] font-extrabold text-white shadow-lg transition active:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <SuperAdminProvider>
      <AdminLoginContent />
    </SuperAdminProvider>
  );
}
