import { useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";

export default function TransportBookingPage() {
  const [form, setForm] = useState({ guestName: "", guestPhone: "", guestEmail: "", pickupLocation: "", dropoffLocation: "", travelAt: "", passengerCount: "2", vehicleType: "CAR", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  function change(event) { setForm(current => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess(null);
    try {
      const response = await fetch(API + "/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, passengerCount: Number(form.passengerCount), travelAt: new Date(form.travelAt).toISOString() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to submit your transport request.");
      setSuccess(data.booking); setForm(current => ({ ...current, guestName: "", guestPhone: "", guestEmail: "", pickupLocation: "", dropoffLocation: "", travelAt: "", notes: "" }));
    } catch (e) { setError(e.message || "Unable to submit your request. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink"><Header /><main className="flex-1 px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
    <section className="rounded-lg bg-[#102747] p-6 text-white sm:p-8 lg:sticky lg:top-6"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-100">ROOMO Travel</span><h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">Travel comfortably around Tiruvannamalai.</h1><p className="mt-4 text-sm leading-7 text-blue-100">Request a car or van for temple visits, Girivalam, station transfers and local journeys. Eligible drivers are notified, and the first driver to accept is assigned to your trip.</p><div className="mt-8 space-y-4 text-sm"><p className="flex gap-3"><span className="text-emerald-300">✓</span> Request a ride in a few simple steps</p><p className="flex gap-3"><span className="text-emerald-300">✓</span> Driver assignment handled by ROOMO</p><p className="flex gap-3"><span className="text-emerald-300">✓</span> Keep your trip reference for follow-up</p></div></section>
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Plan your journey</p><h2 className="mt-2 text-2xl font-semibold">Request a car or van</h2><p className="mt-2 text-sm leading-6 text-slate-500">Submit your trip details and ROOMO will notify matching drivers.</p></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-900">Your request has been received.</p><p className="mt-1 text-sm text-emerald-800">Reference: <strong>{success.bookingCode}</strong> · Status: {success.status}. Keep this reference for your records.</p><p className="mt-2 text-sm text-emerald-800">Driver availability and confirmation may take a little time.</p></div>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Your name<input className={inputClass} name="guestName" autoComplete="name" required minLength={2} maxLength={120} value={form.guestName} onChange={change} /></label>
        <label className="text-sm font-medium">Mobile number<input className={inputClass} name="guestPhone" autoComplete="tel" type="tel" required minLength={7} maxLength={32} value={form.guestPhone} onChange={change} /></label>
        <label className="text-sm font-medium sm:col-span-2">Email (optional)<input className={inputClass} name="guestEmail" type="email" autoComplete="email" value={form.guestEmail} onChange={change} /></label>
        <label className="text-sm font-medium sm:col-span-2">Pickup location<input className={inputClass} name="pickupLocation" required minLength={3} maxLength={500} placeholder="Hotel, ashram, railway station or address" value={form.pickupLocation} onChange={change} /></label>
        <label className="text-sm font-medium sm:col-span-2">Destination<input className={inputClass} name="dropoffLocation" required minLength={3} maxLength={500} placeholder="Where would you like to go?" value={form.dropoffLocation} onChange={change} /></label>
        <label className="text-sm font-medium">Pickup date & time<input className={inputClass} name="travelAt" type="datetime-local" required min={new Date(Date.now() + 60000).toISOString().slice(0,16)} value={form.travelAt} onChange={change} /></label>
        <label className="text-sm font-medium">Vehicle type<select className={inputClass} name="vehicleType" value={form.vehicleType} onChange={change}><option value="CAR">Car</option><option value="SUV">SUV</option><option value="VAN">Van</option><option value="TEMPO_TRAVELLER">Tempo traveller</option></select></label>
        <label className="text-sm font-medium">Passengers<input className={inputClass} name="passengerCount" type="number" min="1" max="30" required value={form.passengerCount} onChange={change} /></label>
        <label className="text-sm font-medium sm:col-span-2">Trip notes (optional)<textarea className={inputClass} name="notes" rows="3" maxLength={1000} placeholder="Luggage, additional stops or pickup instructions" value={form.notes} onChange={change} /></label>
        <div className="sm:col-span-2"><button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-60 sm:w-auto">{busy ? "Sending request…" : "Request a driver →"}</button><p className="mt-3 text-xs leading-5 text-slate-500">Submitting this form requests a ride; it does not guarantee a driver until the trip is confirmed.</p></div>
      </form>
    </section>
  </div></main><Footer /></div>;
}
