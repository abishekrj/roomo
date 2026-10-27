import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
function csrfHeaders() { const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf=")); return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {}; }

function PageShell({ children }) {
  return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink"><Header /><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main><Footer /></div>;
}
function Notice({ children, type = "info" }) {
  return children ? <p role="status" className={"mt-4 rounded-lg border p-3 text-sm " + (type === "error" ? "border-red-200 bg-red-50 text-red-800" : type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700")}>{children}</p> : null;
}
function ActionLink({ href, children }) {
  return <a href={href} className="inline-flex items-center justify-center rounded-lg bg-[#2563A6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d4f86]">{children}</a>;
}

export function PostPropertyPage() {
  const [values, setValues] = useState({ title:"", description:"", propertyType:"HOTEL", address:"", city:"Tiruvannamalai", state:"Tamil Nadu", country:"India", postalCode:"", nightlyPrice:"", maxGuests:"2", totalUnits:"1", bedrooms:"1", bathrooms:"1" });
  const [images, setImages] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const update = (key, value) => setValues(current => ({ ...current, [key]: value }));
  const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  async function submit(event) {
    event.preventDefault(); setBusy(true); setNotice("");
    const token = "cookie-session";
    if (!token) { setNoticeType("error"); setNotice("Please sign in to your owner account before submitting a property."); setBusy(false); return; }
    const imageUrls = images.map(x => x.trim()).filter(Boolean);
    if (imageUrls.some(url => { try { return !["http:","https:"].includes(new URL(url).protocol); } catch { return true; } })) {
      setNoticeType("error"); setNotice("Please enter valid HTTP or HTTPS URLs for property images."); setBusy(false); return;
    }
    const payload = { ...values, nightlyPrice:Number(values.nightlyPrice), maxGuests:Number(values.maxGuests), totalUnits:Number(values.totalUnits), bedrooms:Number(values.bedrooms), bathrooms:Number(values.bathrooms), imageUrls };
    ["postalCode"].forEach(key => { if (!payload[key]) delete payload[key]; });
    try {
      const response = await fetch(API + "/properties", { method:"POST", headers:{ "Content-Type":"application/json", ...csrfHeaders() }, credentials:"include", body:JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to submit your property.");
      setNoticeType("success"); setNotice("Your property has been saved as a draft. Property ID: " + (data.property?.id ?? "created") + ". It is not publicly listed yet.");
      setValues({ title:"", description:"", propertyType:"HOTEL", address:"", city:"Tiruvannamalai", state:"Tamil Nadu", country:"India", postalCode:"", nightlyPrice:"", maxGuests:"2", totalUnits:"1", bedrooms:"1", bathrooms:"1" }); setImages([""]);
    } catch (error) { setNoticeType("error"); setNotice(error.message || "Could not connect to ROOMO. Check that the backend is running on port 5001."); }
    finally { setBusy(false); }
  }
  const fields = [["title","Property name","text",true],["address","Street address","text",true],["city","City","text",true],["state","State","text",true],["country","Country","text",true],["postalCode","Postal code","text",false],["nightlyPrice","Nightly price (INR)","number",true],["maxGuests","Maximum guests","number",true],["totalUnits","Total rooms / units","number",true],["bedrooms","Bedrooms","number",true],["bathrooms","Bathrooms","number",true]];
  return <PageShell><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-700">ROOMO Sacred · Property partners</p><h1 className="mt-2 text-3xl font-semibold">List your property</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Share your stay with guests planning a pilgrimage to Tiruvannamalai. Submitted properties are saved as drafts until reviewed.</p><form onSubmit={submit} className="mt-7 space-y-6 rounded-lg border border-slate-200 bg-white p-5 sm:p-7">
    <div className="grid gap-4 sm:grid-cols-2">{fields.slice(0,6).map(([key,label,type,required])=><label key={key} className="block text-sm font-medium text-slate-700">{label}<input className={fieldClass} type={type} required={required} value={values[key]} onChange={e=>update(key,e.target.value)} /></label>)}
    <label className="block text-sm font-medium text-slate-700">Property type<select className={fieldClass} value={values.propertyType} onChange={e=>update("propertyType",e.target.value)}>{["HOTEL","GUEST_HOUSE","HOMESTAY","APARTMENT","ASHRAM","HOSTEL","VILLA","OTHER"].map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select></label>
    {fields.slice(6).map(([key,label,type,required])=><label key={key} className="block text-sm font-medium text-slate-700">{label}<input className={fieldClass} type={type} min={type==="number"?"0":undefined} step={key==="nightlyPrice"?"0.01":type==="number"?"1":undefined} required={required} value={values[key]} onChange={e=>update(key,e.target.value)} /></label>)}</div>
    <label className="block text-sm font-medium text-slate-700">Property description<textarea className={fieldClass} rows="4" maxLength="5000" required value={values.description} onChange={e=>update("description",e.target.value)} /></label>
    <section><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Property image URLs</h2><button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={()=>setImages(x=>[...x,""])}>Add image</button></div><div className="mt-3 space-y-2">{images.map((url,i)=><div key={i} className="flex gap-2"><input aria-label={"Image URL "+(i+1)} className={fieldClass+" mt-0"} type="url" maxLength="2000" placeholder="https://example.com/property-photo.jpg" value={url} onChange={e=>setImages(list=>list.map((item,index)=>index===i?e.target.value:item))}/>{images.length>1&&<button type="button" className="rounded-lg border px-3 text-sm" onClick={()=>setImages(list=>list.filter((_,index)=>index!==i))} aria-label="Remove image URL">×</button>}</div>)}</div></section>
    <Notice type={noticeType}>{notice}</Notice><div className="flex flex-wrap items-center gap-3"><button disabled={busy} className="rounded-lg bg-[#2563A6] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy?"Submitting…":"Submit property details →"}</button><a className="text-sm font-semibold text-blue-700 underline" href="/owner/login">Owner sign in</a></div></form></div></PageShell>;
}

export function VerifyEmailPage() {
  const [status,setStatus]=useState("Checking your verification link…");
  const [done,setDone]=useState(false);
  useEffect(()=>{let cancelled=false; const token=new URLSearchParams(window.location.search).get("token"); if(!token){setStatus("This verification link is missing its token. Please request a new verification email.");setDone(true);return;} fetch(API+"/guest-auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||"This verification link is invalid or expired.");return data;}).then(data=>{if(!cancelled){setStatus(data.message||"Your email has been verified. You can now sign in.");setDone(true);}}).catch(e=>{if(!cancelled){setStatus(e.message||"Unable to verify your email.");setDone(true);}});return()=>{cancelled=true;};},[]);
  return <PageShell><div className="mx-auto mt-12 max-w-lg rounded-lg border border-slate-200 p-8 text-center"><p className="font-semibold tracking-[.12em] text-blue-700">ROOMO SACRED</p><h1 className="mt-5 text-2xl font-semibold">Verify your email</h1><p role="status" className="mt-4 text-sm leading-6 text-slate-600">{status}</p>{done&&<div className="mt-6"><ActionLink href="/login">Continue to sign in</ActionLink></div>}</div></PageShell>;
}

export function CmsGuidePage({ slug: explicitSlug }) {
  const slug = explicitSlug || new URLSearchParams(window.location.search).get("slug") || window.location.pathname.split("/").filter(Boolean).pop() || "";
  const [page,setPage]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{let cancelled=false;fetch(API+"/cms-pages/"+encodeURIComponent(slug),{headers:{Accept:"application/json"}}).then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||"This guide has not been published yet.");return data.page||data;}).then(data=>{if(!cancelled)setPage(data);}).catch(()=>{if(!cancelled)setPage(null);}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[slug]);
  return <PageShell><article className="mx-auto max-w-5xl">{loading?<div className="animate-pulse py-20 text-center text-slate-500">Loading guide…</div>:page?<><header className="border-b border-slate-200 pb-7"><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-700">ROOMO Sacred · Tiruvannamalai Guide</p><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{page.title||"Tiruvannamalai Guide"}</h1>{page.excerpt&&<p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{page.excerpt}</p>}{(page.heroImage||page.imageUrl)&&<img className="mt-6 max-h-[440px] w-full rounded-lg object-cover" src={page.heroImage||page.imageUrl} alt={page.title||"Tiruvannamalai"} />}</header>{page.intro&&<p className="mt-6 text-base leading-8 text-slate-700">{page.intro}</p>}<div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="space-y-7">{(page.sections||[]).map((section,i)=><section key={section.id||section.heading||i}><h2 className="text-xl font-semibold">{section.heading}</h2><div className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">{section.body}</div></section>)}</div><aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-5"><h2 className="font-semibold">Planning your stay?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Compare locations, amenities and room details before making your plans.</p><div className="mt-4"><ActionLink href="/properties?destination=Tiruvannamalai">Explore stays</ActionLink></div></aside></div>{(page.ctaTitle||page.ctaText)&&<section className="mt-8 rounded-lg bg-slate-50 p-6"><h2 className="text-xl font-semibold">{page.ctaTitle||"Find your stay in Tiruvannamalai"}</h2><p className="mt-2 text-sm text-slate-600">{page.ctaText||"Compare properties and plan your visit."}</p><div className="mt-4"><ActionLink href={page.ctaUrl||"/properties"}>{page.ctaLabel||"Explore stays"}</ActionLink></div></section>}</>:<div className="rounded-lg border border-slate-200 p-8 text-center"><h1 className="text-2xl font-semibold">This guide is not available yet</h1><p className="mt-3 text-sm text-slate-600">Please explore current stays in Tiruvannamalai or check back soon.</p><div className="mt-5"><ActionLink href="/properties?destination=Tiruvannamalai">Explore stays</ActionLink></div></div>}</article></PageShell>;
}

export function MyBookingsPage() {
  const [sessionState, setSessionState] = useState("checking");
  const [message, setMessage] = useState("");
  const [favourites, setFavourites] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [transportMessage, setTransportMessage] = useState("");
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const sessionResponse = await fetch(API + "/guest-auth/me", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (sessionResponse.status === 401) {
          setSessionState("signed-out");
          return;
        }
        const sessionData = await sessionResponse.json().catch(() => ({}));
        if (!sessionResponse.ok || !sessionData.user) {
          throw new Error(sessionData.message || "We couldn't verify your session. Please refresh and try again.");
        }
        setSessionState("signed-in");
        const response = await fetch(API + "/favorites", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "We couldn't load your saved stays right now.");
        setFavourites(Array.isArray(data.favorites) ? data.favorites : []);
        setMessage("");
        try {
          const travelResponse = await fetch(API + "/transport/my-bookings", {
            credentials: "include", cache: "no-store", signal: controller.signal,
          });
          const travelData = await travelResponse.json().catch(() => ({}));
          if (!travelResponse.ok) throw new Error(travelData.message || "Unable to load your driver bookings.");
          setTransportBookings(Array.isArray(travelData.bookings) ? travelData.bookings : []);
          setTransportMessage("");
        } catch (travelError) {
          if (travelError.name !== "AbortError") setTransportMessage(travelError.message || "Unable to load your driver bookings.");
        }
      } catch (error) {
        if (error.name !== "AbortError") setMessage(error.message || "Unable to load your saved stays.");
      }
    }
    load();
    return () => controller.abort();
  }, []);

  async function removeFavourite(propertyId) {
    if (!propertyId || removingId) return;
    setRemovingId(String(propertyId));
    setMessage("");
    try {
      const response = await fetch(API + "/favorites/" + encodeURIComponent(propertyId), {
        method: "DELETE",
        credentials: "include",
        headers: csrfHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to remove this favourite.");
      setFavourites(items => items.filter(item => String(item.propertyId) !== String(propertyId)));
    } catch (error) {
      setMessage(error.message || "Unable to remove this favourite.");
    } finally {
      setRemovingId("");
    }
  }

  const imageFor = item => {
    const value = item?.img || "";
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || /^data:|^blob:/i.test(value)) return value;
    return "http://localhost:5001" + (value.startsWith("/") ? value : "/" + value);
  };

  return <PageShell><div className="mx-auto w-full max-w-7xl">
    <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Your ROOMO journey</p>
    <h1 className="mt-2 text-3xl font-semibold">My Travel</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">Manage your driver requests, review trip details and keep your favourite sacred stays together in one place.</p>
    {sessionState === "checking" && <Notice>Checking your secure session…</Notice>}
    {sessionState === "signed-out" && <><Notice>Sign in to view your reservations and saved favourite stays.</Notice><div className="mt-5"><ActionLink href={"/staging/login?returnTo="+encodeURIComponent("/staging/my-bookings")}>Sign in to continue</ActionLink></div></>}
    {message && <Notice type="error">{message}</Notice>}
    {sessionState === "signed-in" && <>
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold">My driver bookings</h2><p className="mt-2 text-sm text-slate-600">Trip requests you have submitted and their latest status.</p></div><a href="/staging/transport-booking" className="text-sm font-semibold text-[#2563a6] hover:underline">Request a driver ↗</a></div>
        {transportMessage && <Notice type="error">{transportMessage}</Notice>}
        {!transportBookings.length && !transportMessage && <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6"><p className="text-sm font-medium text-slate-800">No driver bookings yet</p><p className="mt-1 text-sm text-slate-500">When you request a car or van, your trip details and status will appear here.</p><div className="mt-4"><ActionLink href="/staging/transport-booking">Request a driver</ActionLink></div></div>}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{transportBookings.map(booking => <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#2563a6]">{booking.bookingCode}</p><h3 className="mt-2 font-semibold text-slate-900">{booking.pickupLocation} <span className="text-slate-400">→</span> {booking.dropoffLocation}</h3></div><span className={"rounded-full px-3 py-1 text-xs font-semibold " + (booking.status === "CONFIRMED" || booking.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800" : booking.status === "CANCELLED" ? "bg-red-50 text-red-700" : booking.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800")}>{String(booking.status || "PENDING").replaceAll("_", " ")}</span></div>
          <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Pickup date & time</p><p className="mt-1 font-medium text-slate-800">{booking.travelAt ? new Date(booking.travelAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}</p></div><div><p className="text-xs text-slate-500">Vehicle</p><p className="mt-1 font-medium text-slate-800">{String(booking.vehicleType || "").replaceAll("_", " ")} · {booking.passengerCount} passenger(s)</p></div><div><p className="text-xs text-slate-500">Contact number</p><p className="mt-1 font-medium text-slate-800">{booking.guestPhone || "—"}</p></div><div><p className="text-xs text-slate-500">Requested on</p><p className="mt-1 font-medium text-slate-800">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}</p></div></div>
          {booking.notes && <p className="mt-3 text-sm text-slate-600"><span className="font-medium">Trip notes:</span> {booking.notes}</p>}
          {booking.assignedDriver && <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-sm font-semibold text-emerald-900">Driver assigned: {booking.assignedDriver.fullName}</p><p className="mt-1 text-sm text-emerald-800">{booking.assignedDriver.vehicleType?.replaceAll("_", " ")}{booking.assignedDriver.vehicleNumber ? " · " + booking.assignedDriver.vehicleNumber : ""}</p>{booking.assignedDriver.phoneNumber && <a className="mt-2 inline-block text-sm font-semibold text-emerald-900 underline" href={"tel:" + booking.assignedDriver.phoneNumber}>Call driver: {booking.assignedDriver.phoneNumber}</a>}</div>}
        </article>)}</div>
      </section>
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold">My favourite stays</h2><p className="mt-2 text-sm text-slate-600">Stays you save from the homepage or property pages appear here.</p></div><a href="/staging/properties" className="text-sm font-semibold text-[#2563a6] hover:underline">Explore stays ↗</a></div>
        {!favourites.length && !message && <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6"><p className="text-sm font-medium text-slate-800">No favourite stays saved yet</p><p className="mt-1 text-sm text-slate-500">Use the heart icon on a stay to keep it here for your pilgrimage planning.</p></div>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{favourites.map(favourite => {
          const item = favourite.propertySnapshot || {};
          const id = String(favourite.propertyId);
          const title = item.name || "ROOMO stay";
          const image = imageFor(item);
          return <article key={id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <a href={"/staging/property-details?id="+encodeURIComponent(id)} className="block">{image ? <img src={image} alt={title} loading="lazy" className="aspect-[4/3] w-full object-cover"/> : <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-slate-500">Photo coming soon</div>}<div className="p-4">{item.type && <p className="text-xs font-medium text-[#2563a6]">{item.type}</p>}<h3 className="mt-1 font-semibold text-slate-800">{title}</h3>{item.location && <p className="mt-1 text-sm text-slate-500">{item.location}</p>}<p className="mt-2 text-sm font-semibold text-[#2563a6]">{Number(item.price) > 0 ? "₹"+Number(item.price).toLocaleString("en-IN") : "Contact property"}<span className="font-normal text-slate-500"> / night</span></p></div></a>
            <div className="flex items-center justify-between border-t border-slate-100 p-3"><a href={"/staging/property-details?id="+encodeURIComponent(id)} className="text-sm font-semibold text-[#2563a6]">View stay</a><button type="button" disabled={!!removingId} onClick={() => removeFavourite(id)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">{removingId === id ? "Removing…" : "Remove"}</button></div>
          </article>;
        })}</div>
      </section>
      <section className="mt-10 rounded-lg border border-slate-200 p-5"><h2 className="text-xl font-semibold">My reservations</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your saved stays are shown above. Reservation details will appear here when a booking has been made through ROOMO.</p></section>
    </>}
  </div></PageShell>;
}


export function MyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const controller = new AbortController();
    fetch(API + "/guest-auth/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) throw new Error("Please sign in to view and update your profile.");
        if (!response.ok || !data.user) throw new Error(data.message || "Unable to load your profile.");
        setUser(data.user);
        setFullName(data.user.fullName || "");
        setEmail(data.user.email || "");
        setPhoneNumber(data.user.phoneNumber || "");
      })
      .catch(error => { if (error.name !== "AbortError") { setMessage(error.message || "Unable to load your profile."); setMessageType("error"); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch(API + "/guest-auth/me", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Your session has expired. Please sign in again.");
      if (!response.ok || !data.user) throw new Error(data.message || "Unable to save your profile.");
      setUser(data.user);
      setFullName(data.user.fullName || "");
      setEmail(data.user.email || "");
      setPhoneNumber(data.user.phoneNumber || "");
      setMessage("Your profile has been updated.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Unable to save your profile.");
      setMessageType("error");
    } finally { setSaving(false); }
  }

  const fieldClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";
  return <PageShell><div className="mx-auto w-full max-w-7xl">
    <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Your ROOMO account</p>
    <h1 className="mt-2 text-3xl font-semibold">My Profile</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">Manage your personal details used for your ROOMO pilgrimage plans.</p>
    {loading ? <Notice>Loading your profile…</Notice> : !user ? <><Notice type="error">{message || "Please sign in to continue."}</Notice><div className="mt-5"><ActionLink href={"/staging/login?returnTo="+encodeURIComponent("/staging/my-profile")}>Sign in to continue</ActionLink></div></> : <form onSubmit={saveProfile} className="mt-7 max-w-3xl rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">Full name
          <input autoComplete="name" required minLength={2} maxLength={100} value={fullName} onChange={event=>setFullName(event.target.value)} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Email address
          <input type="email" value={email} readOnly className={fieldClass+" cursor-not-allowed bg-slate-50 text-slate-500"} />
          <span className="mt-1 block text-xs font-normal text-slate-500">Email address cannot be changed here.</span>
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Mobile number
          <input type="tel" autoComplete="tel" inputMode="tel" placeholder="+919876543210" value={phoneNumber} onChange={event=>setPhoneNumber(event.target.value)} className={fieldClass} />
          <span className="mt-1 block text-xs font-normal text-slate-500">Include country code, for example +919876543210.</span>
        </label>
      </div>
      {message && <Notice type={messageType}>{message}</Notice>}
      <div className="mt-6 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1d4f86] disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : "Save profile"}</button><a href="/staging/my-bookings" className="inline-flex items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">My Pilgrimage Bookings</a></div>
    </form>}
  </div></PageShell>;
}
