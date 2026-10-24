import { useState } from "react";
import roomoLogo from "../../../roomo-frontend/assets/roomo-logo.png";

const API_BASE = "http://localhost:5001";
const TOKEN_KEY = "roomoGuestToken";
const USER_KEY = "roomoGuest";

export default function AuthPage({ mode = "login" }) {
  const isSignup = mode === "signup";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const notify = (text, type = "error") => { setMessage(text); setMessageType(type); };
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (isSignup && fullName.trim().length < 2) return notify("Please enter your full name.");
    if (isSignup && password.length < 12) return notify("Please use a password with at least 12 characters.");
    setBusy(true);
    setMessage("");
    try {
      let response;
      try {
        response = await fetch(`${API_BASE}/api/guest-auth/${isSignup ? "register" : "login"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isSignup
            ? { fullName: fullName.trim(), email: email.trim().toLowerCase(), password, ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}) }
            : { email: email.trim().toLowerCase(), password })
        });
      } catch {
        throw new Error("Unable to connect to ROOMO. Make sure the backend is running on port 5001.");
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.message || "Authentication failed. Please try again.");
        error.code = data.code;
        throw error;
      }
      if (isSignup) {
        notify(data.message || "Account created. Check your email for the verification link.", "success");
        return;
      }
      if (!data.token || !data.user) throw new Error("The server response is missing the guest session.");
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, data.token);
      storage.setItem(USER_KEY, JSON.stringify(data.user));
      (remember ? sessionStorage : localStorage).removeItem(TOKEN_KEY);
      (remember ? sessionStorage : localStorage).removeItem(USER_KEY);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      if (returnTo) {
        try {
          const target = new URL(returnTo, window.location.origin);
          if (target.origin === window.location.origin) {
            window.location.replace(target.href);
            return;
          }
        } catch { /* Fall back to the staging homepage for invalid return URLs. */ }
      }
      window.location.replace("/staging");
    } catch (error) {
      notify(error.message || "Unable to authenticate. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="mx-auto w-full max-w-7xl flex-1 bg-white font-sans text-[#212529]">
    <div className="grid min-h-[680px] lg:grid-cols-2">
      <section className="flex min-h-[680px] items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-[#9a7132]">{isSignup ? "BEGIN YOUR JOURNEY" : "WELCOME BACK"}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#212529]">{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{isSignup ? "Save your favourite stays and keep your pilgrimage plans close." : "Sign in to continue your pilgrimage journey and access your saved stays."}</p>
          </div>
          {message && <div role="status" aria-live="polite" className={`mb-5 rounded-lg border px-4 py-3 text-sm leading-5 ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
          <form onSubmit={submit} className="space-y-4">
            {isSignup && <label className="block text-sm font-medium text-slate-700">Full name<input autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} placeholder="Your full name" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100" /></label>}
            <label className="block text-sm font-medium text-slate-700">Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100" /></label>
            {isSignup && <label className="block text-sm font-medium text-slate-700">Mobile number <span className="font-normal text-slate-400">(optional)</span><input type="tel" autoComplete="tel" inputMode="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+919876543210" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100" /></label>}
            <label className="block text-sm font-medium text-slate-700">Password<div className="mt-2 flex rounded-lg border border-slate-300 focus-within:border-[#2563a6] focus-within:ring-2 focus-within:ring-blue-100"><input type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : 1} value={password} onChange={e => setPassword(e.target.value)} required placeholder={isSignup ? "At least 12 characters" : "Enter your password"} className="min-w-0 flex-1 rounded-l-lg px-4 py-3 text-sm font-normal outline-none" /><button type="button" onClick={() => setShowPassword(v => !v)} className="rounded-r-lg px-4 text-xs font-semibold text-[#2563a6] hover:bg-slate-50">{showPassword ? "Hide" : "Show"}</button></div></label>
            {!isSignup && <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4 accent-[#2563a6]" />Remember me</label><button type="button" onClick={() => notify("Password reset is not available yet. Please contact the ROOMO team for assistance.")} className="text-sm font-medium text-[#2563a6] hover:underline">Forgot password?</button></div>}
            <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2563a6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-60">{busy ? "PLEASE WAIT…" : isSignup ? "CREATE ACCOUNT" : "SIGN IN"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">{isSignup ? "Already have an account?" : "New to ROOMO Sacred?"} <a href={`/staging/${isSignup ? "login" : "signup"}${window.location.search}`} className="font-semibold text-[#2563a6] hover:underline">{isSignup ? "Sign in" : "Create an account"}</a></p>
          {!isSignup && <p className="mt-5 text-center text-sm text-slate-600">Property owner? <a href="/owner/admin.html" className="font-semibold text-[#2563a6] hover:underline">Open Owner Dashboard</a></p>}
          <p className="mt-8 text-center text-xs leading-5 text-slate-500">By continuing, you agree to our <a href="/staging/terms" className="underline">Terms of Service</a> and <a href="/staging/privacy" className="underline">Privacy Policy</a>.</p>
          <p className="mt-4 text-center text-xs text-slate-400">♧ Secure sign-in powered by ROOMO</p>
        </div>
      </section>
    </div>
  </main>;
}
