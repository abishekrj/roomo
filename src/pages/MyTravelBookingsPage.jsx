import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
const tabs = [{ id: "PENDING", label: "Pending" }, { id: "CONFIRMED", label: "Confirmed" }, { id: "COMPLETED", label: "Completed" }];
const dateTime = value => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const statusOf = booking => booking.status === "IN_PROGRESS" ? "CONFIRMED" : booking.status === "COMPLETED" ? "COMPLETED" : booking.status === "CONFIRMED" ? "CONFIRMED" : "PENDING";

export default function MyTravelBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const session = await fetch(API + "/guest-auth/me", { credentials: "include", cache: "no-store", signal: controller.signal });
        if (session.status === 401) { setSignedOut(true); return; }
        if (!session.ok) throw new Error("Unable to verify your account. Please try again.");
        const response = await fetch(API + "/transport/my-bookings", { credentials: "include", cache: "no-store", signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load your travel bookings.");
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch (e) { if (e.name !== "AbortError") setError(e.message || "Unable to load travel bookings."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, []);

  const grouped = useMemo(() => ({
    PENDING: bookings.filter(b => statusOf(b) === "PENDING"),
    CONFIRMED: bookings.filter(b => statusOf(b) === "CONFIRMED"),
    COMPLETED: bookings.filter(b => statusOf(b) === "COMPLETED")
  }), [bookings]);
  const visible = grouped[tab] || [];

  return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink"><Header /><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-[#2563a6]">Your ROOMO journey</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold">My Travel Bookings</h1><p className="mt-2 text-sm text-slate-600">Track your driver requests, upcoming trips and completed journeys.</p></div><a href="/transport-booking" className="rounded-lg bg-[#2563a6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d4f86]">Book a travel</a></div>
    {signedOut && <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-700">Sign in to view your travel bookings.</p><a className="mt-3 inline-flex rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white" href={"/login?returnTo="+encodeURIComponent("/my-travel-bookings")}>Sign in</a></div>}
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!signedOut && <><div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="tablist" aria-label="Travel booking status">{tabs.map(item => <button key={item.id} role="tab" aria-selected={tab===item.id} onClick={()=>setTab(item.id)} className={"rounded-lg px-4 py-2.5 text-sm font-semibold "+(tab===item.id?"bg-[#2563a6] text-white":"bg-slate-100 text-slate-700 hover:bg-slate-200")}>{item.label}<span className="ml-2 opacity-80">{grouped[item.id].length}</span></button>)}</div>
    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading your trips…</p> : visible.length === 0 ? <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center"><h2 className="font-semibold text-slate-800">No {tab.toLowerCase()} trips</h2><p className="mt-2 text-sm text-slate-500">{tab==="PENDING"?"New driver requests will appear here until they are accepted or assigned.":tab==="CONFIRMED"?"Your accepted and upcoming trips will appear here.":"Your completed journeys will be listed here."}</p>{tab==="PENDING" && <a href="/transport-booking" className="mt-4 inline-flex text-sm font-semibold text-[#2563a6] hover:underline">Request a driver →</a>}</div> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{visible.map(booking=><article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#2563a6]">{booking.bookingCode || "Travel booking"}</p><h2 className="mt-2 font-semibold text-slate-900">{booking.pickupLocation} <span className="text-slate-400">→</span> {booking.dropoffLocation}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{String(booking.status||"PENDING").replaceAll("_"," ")}</span></div>
      <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Pickup date & time</p><p className="mt-1 font-medium">{dateTime(booking.travelAt)}</p></div><div><p className="text-xs text-slate-500">Vehicle</p><p className="mt-1 font-medium">{String(booking.vehicleType||"").replaceAll("_"," ")} · {booking.passengerCount} passenger(s)</p></div><div><p className="text-xs text-slate-500">Contact number</p><p className="mt-1 font-medium">{booking.guestPhone||"—"}</p></div><div><p className="text-xs text-slate-500">Requested on</p><p className="mt-1 font-medium">{booking.createdAt?new Date(booking.createdAt).toLocaleDateString("en-IN",{dateStyle:"medium"}):"—"}</p></div></div>
      {booking.notes && <p className="mt-3 text-sm text-slate-600"><strong>Trip notes:</strong> {booking.notes}</p>}
      {booking.assignedDriver && <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-sm font-semibold text-emerald-900">Driver: {booking.assignedDriver.fullName}</p><p className="mt-1 text-sm text-emerald-800">{String(booking.assignedDriver.vehicleType||"").replaceAll("_"," ")}{booking.assignedDriver.vehicleNumber?" · "+booking.assignedDriver.vehicleNumber:""}</p>{booking.assignedDriver.phoneNumber && <a className="mt-2 inline-block text-sm font-semibold text-emerald-900 underline" href={"tel:"+booking.assignedDriver.phoneNumber}>Call {booking.assignedDriver.phoneNumber}</a>}</div>}
    </article>)}</div>}</>}
    <div className="mt-10 border-t border-slate-100 pt-5"><a href="/my-room-bookings" className="text-sm font-semibold text-[#2563a6] hover:underline">View my room bookings →</a></div>
  </main><Footer /></div>;
}
