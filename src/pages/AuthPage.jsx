import { useEffect, useState } from "react";
import roomoLogo from "../../../Roomo/roomo-frontend/assets/roomo-logo.png";

const API_BASE = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";

function safePostLoginUrl(returnTo) {
  if (!returnTo) return "";
  try {
    const target = new URL(returnTo, window.location.origin);
    const path = target.pathname.replace(/\/+$/, "") || "/";
    const isAuthPage = ["/login", "/signup", "/login", "/signup"].includes(path);
    if (target.origin !== window.location.origin || isAuthPage) return "";
    return target.pathname + target.search + target.hash;
  } catch {
    return "";
  }
}

export default function AuthPage({ mode = "login" }) {
  const isSignup = mode === "signup";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleConfigMessage, setGoogleConfigMessage] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  const notify = (text, type = "error") => { setMessage(text); setMessageType(type); };

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/guest-auth/me`, { credentials: "include", cache: "no-store" })
      .then(response => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(data => {
        if (cancelled) return;
        if (data?.user) {
          const returnTo = new URLSearchParams(window.location.search).get("returnTo");
          window.location.replace(safePostLoginUrl(returnTo));
          return;
          return;
        }
        setSessionChecked(true);
      })
      .catch(() => { if (!cancelled) setSessionChecked(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderGoogleButton = clientId => {
      if (cancelled || !clientId || !window.google?.accounts?.id) return;
      const container = document.getElementById("roomo-google-signin");
      if (!container) return;
      container.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async credentialResponse => {
          if (!credentialResponse?.credential || cancelled) {
            if (!cancelled) notify("Google did not return a valid sign-in credential.");
            return;
          }
          setGoogleBusy(true);
          setMessage("");
          try {
            const response = await fetch(`${API_BASE}/guest-auth/google`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: credentialResponse.credential })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "Google sign-in failed. Please try again.");
            if (!data.user) throw new Error("The server response is missing the guest profile.");
            const returnTo = new URLSearchParams(window.location.search).get("returnTo");
            window.location.replace(safePostLoginUrl(returnTo));
          } catch (error) {
            notify(error.message || "Unable to sign in with Google. Please try again.");
          } finally {
            if (!cancelled) setGoogleBusy(false);
          }
        }
      });
      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: isSignup ? "signup_with" : "signin_with",
        logo_alignment: "left",
        width: Math.min(360, Math.max(240, Math.floor(container.getBoundingClientRect().width || 320)))
      });
      setGoogleReady(true);
      setGoogleConfigMessage("");
    };

    const loadGoogleIdentity = () => new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      let script = document.querySelector('script[data-roomo-google-identity]');
      if (script?.dataset.roomoLoadFailed === "true") {
        script.remove();
        script = null;
      }
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.roomoGoogleIdentity = "true";
        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener("error", () => {
          script.dataset.roomoLoadFailed = "true";
          reject(new Error("Google sign-in could not load. Check your internet connection and try again."));
        }, { once: true });
        document.head.appendChild(script);
        return;
      }
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("Google sign-in could not load. Check your internet connection and try again.")), { once: true });
      window.setTimeout(() => {
        if (window.google?.accounts?.id) resolve();
      }, 0);
    });

    fetch(`${API_BASE}/guest-auth/config`, { cache: "no-store", credentials: "include" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load Google sign-in configuration.");
        if (!data.googleClientId) throw new Error("Google sign-in is not configured. Add GOOGLE_CLIENT_ID to backend/.env and restart the backend.");
        await loadGoogleIdentity();
        if (!cancelled) renderGoogleButton(data.googleClientId);
      })
      .catch(error => {
        if (!cancelled) {
          setGoogleReady(false);
          setGoogleConfigMessage(error.message || "Google sign-in is unavailable.");
        }
      });

    return () => { cancelled = true; };
  }, [isSignup]);

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (isSignup && fullName.trim().length < 2) return notify("Please enter your full name.");
    if (isSignup && !/^\\+[1-9]\\d{7,14}$/.test(phoneNumber.trim())) return notify("Please enter a valid mobile number with country code, such as +919876543210.");
    if (isSignup && password.length < 12) return notify("Please use a password with at least 12 characters.");
    setBusy(true);
    setMessage("");
    try {
      let response;
      try {
        response = await fetch(`${API_BASE}/guest-auth/${isSignup ? "register" : "login"}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isSignup
            ? { fullName: fullName.trim(), email: email.trim().toLowerCase(), phoneNumber: phoneNumber.trim(), password }
            : { email: email.trim().toLowerCase(), password })
        });
      } catch {
        throw new Error("Unable to connect to ROOMO. Make sure the backend is running on port 5001.");
      }
      const responseText = await response.text();
      let data = {};
      try { data = responseText ? JSON.parse(responseText) : {}; } catch { data = {}; }
      if (!response.ok) {
        const fallbackMessage = response.status === 429
          ? "Too many sign-in attempts. Please wait 15 minutes before trying again."
          : response.status >= 500
            ? "ROOMO could not complete sign-in because of a server error. Check the backend terminal for details."
            : `Sign-in failed (HTTP ${response.status}). Please check your details and try again.`;
        const error = new Error(data.message || fallbackMessage);
        error.code = data.code;
        throw error;
      }
      if (isSignup) {
        notify(data.message || "Account created. Check your email for the verification link.", "success");
        return;
      }
      if (!data.user) throw new Error("The server response is missing the guest profile.");
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      window.location.replace(safePostLoginUrl(returnTo));
    } catch (error) {
      notify(error.message || "Unable to authenticate. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!sessionChecked) return <main className="flex min-h-[60vh] items-center justify-center bg-white font-sans text-slate-600"><p role="status">Checking your session…</p></main>;

  return <main className="mx-auto w-full max-w-7xl flex-1 bg-white px-4 font-sans text-[#212529] sm:px-6">
    <div className="grid min-h-[680px] lg:grid-cols-2">
      <section className="relative hidden min-h-[680px] overflow-hidden bg-[#f0f5f8] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="relative z-10 max-w-xl py-12">
          <span className="mb-5 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[.12em] text-[#2563a6]">✦ Your sacred journey begins here</span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#183b56] xl:text-5xl">Find peace.<br/>Feel at home.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">Discover thoughtfully chosen stays near Arunachala, Annamalaiyar Temple and the sacred Girivalam path.</p>
        </div>
        <p className="relative z-10 max-w-md border-l-2 border-[#d6b46a] pl-4 text-sm leading-6 text-slate-600">A peaceful place to rest is part of a meaningful pilgrimage.<span className="mt-2 block text-xs font-semibold tracking-[.12em] text-[#183b56]">ROOMO SACRED · TIRUVANNAMALAI</span></p>
        <div aria-hidden="true" className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full border-[48px] border-white/70" />
      </section>
      <section className="flex min-h-[680px] items-center justify-center py-10">
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
            {isSignup && <label className="block text-sm font-medium text-slate-700">Mobile number <span className="font-normal text-red-500">*</span><input type="tel" autoComplete="tel" inputMode="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required pattern="\\+[1-9][0-9]{7,14}" title="Enter a valid mobile number with country code, e.g. +919876543210" placeholder="+919876543210" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100" /><span className="mt-1 block text-xs font-normal text-slate-500">Include your country code so ROOMO can contact you about bookings.</span></label>}
            <label className="block text-sm font-medium text-slate-700">Password<div className="mt-2 flex rounded-lg border border-slate-300 focus-within:border-[#2563a6] focus-within:ring-2 focus-within:ring-blue-100"><input type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : 1} value={password} onChange={e => setPassword(e.target.value)} required placeholder={isSignup ? "At least 12 characters" : "Enter your password"} className="min-w-0 flex-1 rounded-l-lg px-4 py-3 text-sm font-normal outline-none" /><button type="button" onClick={() => setShowPassword(v => !v)} className="rounded-r-lg px-4 text-xs font-semibold text-[#2563a6] hover:bg-slate-50">{showPassword ? "Hide" : "Show"}</button></div></label>
            {!isSignup && <div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Your session expires automatically after 1 hour.</span><button type="button" onClick={() => notify("Password reset is not available yet. Please contact the ROOMO team for assistance.")} className="text-sm font-medium text-[#2563a6] hover:underline">Forgot password?</button></div>}
            <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2563a6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-60">{busy ? "PLEASE WAIT…" : isSignup ? "CREATE ACCOUNT" : "SIGN IN"}</button>
          </form>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200"></span><span className="text-xs font-medium uppercase tracking-wider text-slate-400">or continue with</span><span className="h-px flex-1 bg-slate-200"></span>
          </div>
          {googleConfigMessage && <p role="status" className="mb-3 text-center text-xs leading-5 text-slate-500">{googleConfigMessage}</p>}
          <div className="flex min-h-10 w-full justify-center" aria-label={isSignup ? "Sign up with Google" : "Sign in with Google"}>
            <div id="roomo-google-signin" className="flex w-full justify-center"></div>
          </div>
          {googleBusy && <p role="status" className="mt-3 text-center text-sm text-slate-500">Connecting your Google account…</p>}
          <p className="mt-6 text-center text-sm text-slate-600">{isSignup ? "Already have an account?" : "New to ROOMO Sacred?"} <a href={`/${isSignup ? "login" : "signup"}${window.location.search}`} className="font-semibold text-[#2563a6] hover:underline">{isSignup ? "Sign in" : "Create an account"}</a></p>
          {!isSignup && <p className="mt-5 text-center text-sm text-slate-600">Property owner? <a href="/owner/login" className="font-semibold text-[#2563a6] hover:underline">Open Owner Dashboard</a></p>}
          <p className="mt-8 text-center text-xs leading-5 text-slate-500">By continuing, you agree to our <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</p>
          <p className="mt-4 text-center text-xs text-slate-400">♧ Secure sign-in powered by ROOMO</p>
        </div>
      </section>
    </div>
  </main>;
}
