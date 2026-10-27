import { useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport/admin";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";
const primaryButton = "inline-flex items-center justify-center rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-50";
const secondaryButton = "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const emptyDriver = { fullName: "", email: "", phoneNumber: "", password: "", licenseNumber: "", vehicleType: "CAR", vehicleMake: "", vehicleModel: "", vehicleNumber: "", passengerCapacity: "4", serviceAreas: "Tiruvannamalai", notes: "", isActive: true, isAvailable: true };
function csrfHeaders() { const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf=")); return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {}; }
async function request(path, options = {}) {
  const response = await fetch(API + path, { ...options, credentials: "include", headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: "Bearer " + (sessionStorage.getItem("roomo_admin_token") || ""), ...csrfHeaders(), ...(options.headers || {}) }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}
function formatDate(value) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function statusStyle(status) { return status === "CONFIRMED" || status === "IN_PROGRESS" ? "bg-emerald-50 text-emerald-800" : status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"; }

export default function DriverAdminWorkspace({ pageKey, onNotice }) {
  const isAdd = pageKey === "drivers/add";
  const isList = pageKey === "drivers/list";
  const [form, setForm] = useState(emptyDriver);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      if (isAdd || isList) {
        // The Add Driver page only depends on the driver directory. Do not let
        // a separate booking-list/API failure block the form from opening.
        const driverData = await request("/drivers");
        setDrivers(driverData.drivers || []);
      } else {
        const [driverData, bookingData] = await Promise.all([request("/drivers"), request("/bookings")]);
        setDrivers(driverData.drivers || []);
        setBookings(bookingData.bookings || []);
      }
    } catch (e) {
      setError(e.message || (isAdd ? "Unable to load the driver directory." : "Unable to load transport booking data."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [isAdd, isList]);

  const filteredBookings = useMemo(() => bookings.filter(booking => {
    const categoryMatches = tab === "PENDING" ? booking.status === "PENDING" : ["CONFIRMED", "IN_PROGRESS"].includes(booking.status);
    const query = search.trim().toLowerCase();
    const searchMatches = !query || [booking.bookingCode, booking.guestName, booking.guestPhone, booking.pickupLocation, booking.dropoffLocation, booking.assignedDriver?.fullName].some(value => String(value || "").toLowerCase().includes(query));
    return categoryMatches && searchMatches;
  }), [bookings, tab, search]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm(current => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }
  async function addDriver(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const data = await request("/drivers", { method: "POST", body: JSON.stringify({ ...form, passengerCapacity: Number(form.passengerCapacity), serviceAreas: form.serviceAreas.split(",").map(area => area.trim()).filter(Boolean) }) });
      setDrivers(current => [data.driver, ...current]); setForm(emptyDriver);
      onNotice?.("Driver created. Share the login email and temporary password with the driver securely.");
    } catch (e) { setError(e.message || "Unable to create driver."); }
    finally { setSaving(false); }
  }
  async function assignDriver() {
    if (!selected || !assignDriverId) return;
    setSaving(true); setError("");
    try {
      await request("/bookings/" + selected.id + "/assign", { method: "PATCH", body: JSON.stringify({ driverId: assignDriverId }) });
      onNotice?.("Driver assigned successfully."); setSelected(null); await load();
    } catch (e) { setError(e.message || "Unable to assign driver."); }
    finally { setSaving(false); }
  }
  async function changeDriverStatus(driver, key) {
    try {
      const data = await request("/drivers/" + driver.id + "/status", { method: "PATCH", body: JSON.stringify({ isActive: key === "isActive" ? !driver.isActive : driver.isActive, isAvailable: key === "isAvailable" ? !driver.isAvailable : driver.isAvailable }) });
      setDrivers(current => current.map(item => item.id === driver.id ? data.driver : item));
    } catch (e) { setError(e.message); }
  }
  async function updateBookingStatus(status) {
    if (!selected) return;
    const label = status === "COMPLETED" ? "mark this trip completed" : "cancel this transport booking";
    if (!window.confirm("Are you sure you want to " + label + "?")) return;
    setSaving(true); setError("");
    try {
      await request("/bookings/" + selected.id + "/status", { method: "PATCH", body: JSON.stringify({ status }) });
      onNotice?.(status === "COMPLETED" ? "Trip marked as completed." : "Transport booking cancelled.");
      setSelected(null); await load();
    } catch (e) { setError(e.message || "Unable to update booking status."); }
    finally { setSaving(false); }
  }

  if (isAdd) return <div className="space-y-6">
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Driver management</p><h2 className="mt-2 text-xl font-semibold">Add a driver</h2><p className="mt-1 text-sm leading-6 text-slate-500">Create the driver's login, vehicle profile and service area. A driver can sign in at <span className="font-medium text-slate-700">/driver</span>.</p></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={addDriver} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium">Full name *<input className={inputClass} name="fullName" value={form.fullName} onChange={change} required minLength="2" maxLength="120" /></label>
        <label className="text-sm font-medium">Email address *<input className={inputClass} name="email" type="email" value={form.email} onChange={change} required maxLength="254" /></label>
        <label className="text-sm font-medium">Mobile number *<input className={inputClass} name="phoneNumber" type="tel" value={form.phoneNumber} onChange={change} required minLength="7" maxLength="32" /></label>
        <label className="text-sm font-medium">Initial password *<input className={inputClass} name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} required minLength="12" maxLength="72" /><span className="mt-1 block text-xs font-normal text-slate-500">At least 12 characters. Share it securely.</span></label>
        <label className="text-sm font-medium">Driving licence number<input className={inputClass} name="licenseNumber" value={form.licenseNumber} onChange={change} maxLength="80" /></label>
        <label className="text-sm font-medium">Vehicle type *<select className={inputClass} name="vehicleType" value={form.vehicleType} onChange={change}><option value="CAR">Car</option><option value="SUV">SUV</option><option value="VAN">Van</option><option value="TEMPO_TRAVELLER">Tempo traveller</option></select></label>
        <label className="text-sm font-medium">Vehicle make<input className={inputClass} name="vehicleMake" value={form.vehicleMake} onChange={change} maxLength="80" placeholder="e.g. Maruti Suzuki" /></label>
        <label className="text-sm font-medium">Vehicle model<input className={inputClass} name="vehicleModel" value={form.vehicleModel} onChange={change} maxLength="80" placeholder="e.g. Ertiga" /></label>
        <label className="text-sm font-medium">Registration number *<input className={inputClass} name="vehicleNumber" value={form.vehicleNumber} onChange={change} required minLength="3" maxLength="30" /></label>
        <label className="text-sm font-medium">Passenger capacity *<input className={inputClass} name="passengerCapacity" type="number" min="1" max="30" value={form.passengerCapacity} onChange={change} required /></label>
        <label className="text-sm font-medium sm:col-span-2">Service areas (comma separated)<input className={inputClass} name="serviceAreas" value={form.serviceAreas} onChange={change} placeholder="Tiruvannamalai, Chengam" /><span className="mt-1 block text-xs font-normal text-slate-500">Leave blank to make this driver eligible for all areas.</span></label>
        <label className="text-sm font-medium sm:col-span-2 xl:col-span-3">Admin notes<textarea className={inputClass} name="notes" rows="2" value={form.notes} onChange={change} maxLength="1000" /></label>
        <div className="flex flex-wrap gap-5 sm:col-span-2 xl:col-span-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" checked={form.isActive} onChange={change} className="rounded border-slate-300 text-[#2563a6] focus:ring-blue-200" /> Account active</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={change} className="rounded border-slate-300 text-[#2563a6] focus:ring-blue-200" /> Available for trips</label></div>
        <div className="sm:col-span-2 xl:col-span-3"><button disabled={saving} className={primaryButton}>{saving ? "Creating driver…" : "Create driver"}</button></div>
      </form>
    </section>
  </div>;

  if (isList) return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="font-semibold">Driver directory</h2><p className="mt-1 text-sm text-slate-500">{drivers.length} driver account{drivers.length === 1 ? "" : "s"}</p></div><button className={secondaryButton} onClick={load}>Refresh</button></div>
      {loading ? <p className="p-5 text-sm text-slate-500">Loading drivers…</p> : drivers.length ? <div className="divide-y divide-slate-100">{drivers.map(driver => <div key={driver.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="font-semibold">{driver.fullName}</p><p className="mt-1 text-sm text-slate-500">{driver.email} · {driver.phoneNumber}</p><p className="mt-1 text-xs text-slate-500">{driver.vehicleType.replaceAll("_", " ")} · {driver.vehicleNumber} · {driver.passengerCapacity} seats</p></div><div className="flex flex-wrap gap-2"><button className={secondaryButton} onClick={() => changeDriverStatus(driver, "isAvailable")}>{driver.isAvailable ? "Set unavailable" : "Set available"}</button><button className={secondaryButton} onClick={() => changeDriverStatus(driver, "isActive")}>{driver.isActive ? "Deactivate" : "Activate"}</button></div></div>)}</div> : <p className="p-5 text-sm text-slate-500">No drivers have been added yet.</p>}
</section>;

  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Transport operations</p><h2 className="mt-2 text-xl font-semibold">Transport booking list</h2><p className="mt-1 text-sm text-slate-500">Open any trip to view the full request and assign a driver if needed.</p></div><button className={secondaryButton} onClick={load}>↻ Refresh</button></div>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Transport booking status"><button role="tab" aria-selected={tab === "CONFIRMED"} className={tab === "CONFIRMED" ? primaryButton : secondaryButton} onClick={() => setTab("CONFIRMED")}>Confirmed <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{bookings.filter(b => ["CONFIRMED", "IN_PROGRESS"].includes(b.status)).length}</span></button><button role="tab" aria-selected={tab === "PENDING"} className={tab === "PENDING" ? primaryButton : secondaryButton} onClick={() => setTab("PENDING")}>Pending <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{bookings.filter(b => b.status === "PENDING").length}</span></button></div>
      <div className="mt-4"><input className={inputClass} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search booking reference, guest, phone or location…" aria-label="Search transport bookings" /></div>
    </div>
    {error && <p role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="p-6 text-sm text-slate-500">Loading transport bookings…</p> : filteredBookings.length ? <div className="divide-y divide-slate-100">{filteredBookings.map(booking => <button type="button" key={booking.id} onClick={() => { setSelected(booking); setAssignDriverId(booking.assignedDriverId || ""); setError(""); }} className="grid w-full gap-3 p-4 text-left transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-center sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{booking.bookingCode}</span><span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + statusStyle(booking.status)}>{booking.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm font-medium">{booking.pickupLocation}</p><p className="mt-0.5 text-sm text-slate-500">to {booking.dropoffLocation}</p></div><div><p className="text-sm font-medium">{booking.guestName}</p><p className="mt-1 text-sm text-slate-500">{booking.guestPhone}</p><p className="mt-1 text-xs text-slate-500">{formatDate(booking.travelAt)}</p></div><span className="text-sm font-semibold text-[#2563a6]">View trip details →</span></button>)}</div> : <div className="p-10 text-center"><p className="font-semibold">No {tab.toLowerCase()} bookings found</p><p className="mt-1 text-sm text-slate-500">Transport requests will appear here when visitors submit them.</p></div>}
    {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="transport-detail-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Trip details</p><h2 id="transport-detail-title" className="mt-2 text-xl font-semibold">{selected.bookingCode}</h2><p className="mt-1 text-sm text-slate-500">Created {formatDate(selected.createdAt)}</p></div><button className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close trip details" onClick={() => setSelected(null)}>×</button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{[["Status", selected.status.replaceAll("_", " ")],["Pickup date & time", formatDate(selected.travelAt)],["Pickup location", selected.pickupLocation],["Destination", selected.dropoffLocation],["Guest name", selected.guestName],["Guest phone", selected.guestPhone],["Guest email", selected.guestEmail || "Not provided"],["Vehicle requested", selected.vehicleType.replaceAll("_", " ")],["Passengers", String(selected.passengerCount)],["Assigned driver", selected.assignedDriver ? selected.assignedDriver.fullName + " · " + selected.assignedDriver.phoneNumber : "Not assigned"],["Vehicle registration", selected.assignedDriver?.vehicleNumber || "—"],["Assigned at", formatDate(selected.assignedAt)]].map(([label,value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p></div>)}</div>
      {selected.notes && <div className="mt-3 rounded-lg border border-slate-200 p-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Trip notes</p><p className="mt-1 whitespace-pre-wrap text-sm">{selected.notes}</p></div>}
      {selected.status !== "CANCELLED" && selected.status !== "COMPLETED" && <div className="mt-5 border-t border-slate-200 pt-5"><label className="block text-sm font-medium">Assign / reassign driver<select className={inputClass} value={assignDriverId} onChange={e => setAssignDriverId(e.target.value)}><option value="">Choose an eligible driver</option>{drivers.filter(d => d.isActive && d.vehicleType === selected.vehicleType && d.passengerCapacity >= selected.passengerCount).map(d => <option key={d.id} value={d.id}>{d.fullName} · {d.vehicleNumber} · {d.isAvailable ? "Available" : "Currently assigned"}</option>)}</select></label><div className="mt-3 flex flex-wrap gap-2"><button className={primaryButton} disabled={saving || !assignDriverId} onClick={assignDriver}>{saving ? "Saving…" : selected.assignedDriverId ? "Reassign driver" : "Assign driver"}</button>{selected.assignedDriverId && <button className={secondaryButton} disabled={saving} onClick={() => updateBookingStatus("COMPLETED")}>Mark completed</button>}<button className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={saving} onClick={() => updateBookingStatus("CANCELLED")}>Cancel trip</button><button className={secondaryButton} onClick={() => setSelected(null)}>Close</button></div></div>}
    </section></div>}
  </section>;
}
