"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "../app/store/hooks";
import { loginUser } from "../app/store/auth/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState<"email" | "password" | null>(null);

  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);

  // ============ Submit handler ============
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    const result = await dispatch(loginUser({ email, password }));
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } else {
      setError(result.message || "Invalid email or password.");
    }
  }

  // ============ Eye-tracking logic ============
  useEffect(() => {
    let rafId: number | null = null;
    let mouseX = 0;
    let mouseY = 0;

    const updatePupils = () => {
      const pupils = [leftPupilRef.current, rightPupilRef.current];

      pupils.forEach((pupil) => {
        if (!pupil) return;
        const socketEl = pupil.parentElement;
        if (!socketEl) return;

        const rect = socketEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
        const maxDistance = 5;

        const moveX = Math.cos(angle) * maxDistance;
        const moveY = Math.sin(angle) * maxDistance;

        pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });

      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(updatePupils);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);
  // ============================================

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#dbe6d5] p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[640px] border border-gray-100/60">

        {/* ================= Left: Form ================= */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2.5">
                Welcome back!
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
                >
                  Login successful! Redirecting…
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2"
                >
                  Email or Username
                </label>
                <input
                  id="email"
                  type="text"
                  placeholder="Enter your email address"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold tracking-wider uppercase text-gray-500"
                  >
                    Password
                  </label>
                  <a
                    href="#forgot"
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusField("password")}
                    onBlur={() => setFocusField(null)}
                    disabled={loading}
                    required
                    className="w-full px-4 py-3 pr-11 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="text-xs text-gray-600 cursor-pointer select-none"
                >
                  Remember this device
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl text-sm hover:bg-gray-800 active:scale-[0.99] transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In…
                  </>
                ) : success ? (
                  "Redirecting…"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-medium">or continue with</span>
              </div>
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button type="button" className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-150 shadow-sm" aria-label="Continue with Google">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
              </button>
              <button type="button" className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-150 shadow-sm" aria-label="Continue with GitHub">
                <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              </button>
              <button type="button" className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-150 shadow-sm" aria-label="Continue with Apple">
                <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1.01.08 2.02-.49 2.64-1.24z" /></svg>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-4 text-center text-xs text-gray-500">
            Not a member?{" "}
            <a href="#register" className="text-gray-900 font-bold hover:underline transition-colors">
              Register now
            </a>
          </div>
        </div>

        {/* ================= Right: Developer illustration ================= */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#eff5ec] via-[#e5efe1] to-[#d8e7d2] p-8 sm:p-12 flex flex-col items-center justify-between relative overflow-hidden border-t lg:border-t-0 lg:border-l border-gray-100">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-center w-full max-w-[480px] sm:max-w-[520px]">
            <div className="relative w-full">
              <img
                src="/avatar_image.png"
                alt="Cartoon developer"
                className="w-full h-auto object-contain"
                draggable={false}
              />

              {/* ====== EYE OVERLAY ====== */}
              <div className="absolute inset-0 pointer-events-none">
                {/* LEFT EYE */}
                <div
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    top: "17%",
                    left: "30%",
                    width: "3.4%",
                    height: "3.4%",
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "inset 0 1px 1.5px rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    ref={leftPupilRef}
                    className="relative rounded-full transition-transform duration-100 ease-out"
                    style={{
                      width: "75%",
                      height: "75%",
                      background:
                        "radial-gradient(circle at 35% 30%, #8a5a2f 0%, #5c3a21 55%, #2e1a0d 100%)",
                    }}
                  >
                    <div className="absolute rounded-full bg-black" style={{ width: "45%", height: "45%", top: "27%", left: "27%" }} />
                    <div className="absolute rounded-full bg-white" style={{ width: "22%", height: "22%", top: "18%", left: "22%", opacity: 0.95 }} />
                  </div>
                </div>

                {/* RIGHT EYE */}
                <div
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    top: "15.5%",
                    left: "37.5%",
                    width: "3.4%",
                    height: "3.4%",
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "inset 0 1px 1.5px rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    ref={rightPupilRef}
                    className="relative rounded-full transition-transform duration-100 ease-out"
                    style={{
                      width: "75%",
                      height: "75%",
                      background:
                        "radial-gradient(circle at 35% 30%, #8a5a2f 0%, #5c3a21 55%, #2e1a0d 100%)",
                    }}
                  >
                    <div className="absolute rounded-full bg-black" style={{ width: "45%", height: "45%", top: "27%", left: "27%" }} />
                    <div className="absolute rounded-full bg-white" style={{ width: "22%", height: "22%", top: "18%", left: "22%", opacity: 0.95 }} />
                  </div>
                </div>
              </div>
              {/* ====== END EYE OVERLAY ====== */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}