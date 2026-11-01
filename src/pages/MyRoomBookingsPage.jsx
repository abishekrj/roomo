import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
const tabs = [{ id: "PENDING", label: "Pending" }, { id: "CONFIRMED", label: "Confirmed" }, { id: "COMPLETED", label: "Completed" }];
const dateLabel = value => value ? new Date(value).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
function bookingGroup(item) {
  if (item.status === "CANCELLED") return "CANCELLED";
  if (item.status === "COMPLETED" || (item.status === "CONFIRMED" && item.checkOut && new Date(item.checkOut) < new Date())) return "COMPLETED";
  if (item.status === "CONFIRMED") return "CONFIRMED";
  return "PENDING";
}

export default function MyRoomBookingsPage() {
  const [reservations,setReservations] = useState([]);
  const [tab,setTab] = useState("PENDING");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [signedOut,setSignedOut] = useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    (async()=>{
      try {
        const session=await fetch(API+"/guest-auth/me",{credentials:"include",cache:"no-store",signal:controller.signal});
        if(session.status===401){setSignedOut(true);return;}
        if(!session.ok) throw new Error("Unable to verify your account. Please try again.");
        const response=await fetch(API+"/reservations/mine",{credentials:"include",cache:"no-store",signal:controller.signal});
        const data=await response.json().catch(()=>({}));
        if(!response.ok) throw new Error(data.message||"Unable to load your room bookings.");
        setReservations(Array.isArray(data.reservations)?data.reservations:[]);
      } catch(e){if(e.name!=="AbortError")setError(e.message||"Unable to load room bookings.");}
      finally{if(!controller.signal.aborted)setLoading(false);}
    })();
    return ()=>controller.abort();
  },[]);
  const grouped=useMemo(()=>({
    PENDING:reservations.filter(x=>bookingGroup(x)==="PENDING"),
    CONFIRMED:reservations.filter(x=>bookingGroup(x)==="CONFIRMED"),
    COMPLETED:reservations.filter(x=>bookingGroup(x)==="COMPLETED")
  }),[reservations]);
  async function cancelBooking(id){
    if(!window.confirm("Cancel this room booking request?"))return;
    try{
      const cookie=document.cookie.split("; ").find(x=>x.startsWith("roomo_csrf="));
      const response=await fetch(API+"/reservations/"+encodeURIComponent(id)+"/cancel",{method:"PATCH",credentials:"include",headers:cookie?{"X-CSRF-Token":decodeURIComponent(cookie.slice("roomo_csrf=".length))}:{},});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.message||"Unable to cancel this booking.");
      setReservations(items=>items.map(item=>item.id===id?{...item,...data.reservation}:item));
    }catch(e){setError(e.message||"Unable to cancel this booking.");}
  }
  const visible=grouped[tab]||[];
  return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink"><Header/><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-[#2563a6]">Your ROOMO stays</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold">My Room Bookings</h1><p className="mt-2 text-sm text-slate-600">View your stay requests, confirmed reservations and completed stays.</p></div><a href="/properties" className="rounded-lg bg-[#2563a6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d4f86]">Explore stays</a></div>
    {signedOut&&<div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-700">Sign in to view your room bookings.</p><a className="mt-3 inline-flex rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white" href={"/login?returnTo="+encodeURIComponent("/my-room-bookings")}>Sign in</a></div>}
    {error&&<p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!signedOut&&<><div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="tablist" aria-label="Room booking status">{tabs.map(item=><button key={item.id} role="tab" aria-selected={tab===item.id} onClick={()=>setTab(item.id)} className={"rounded-lg px-4 py-2.5 text-sm font-semibold "+(tab===item.id?"bg-[#2563a6] text-white":"bg-slate-100 text-slate-700 hover:bg-slate-200")}>{item.label}<span className="ml-2 opacity-80">{grouped[item.id].length}</span></button>)}</div>
    {loading?<p className="py-12 text-center text-sm text-slate-500">Loading your stays…</p>:visible.length===0?<div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center"><h2 className="font-semibold text-slate-800">No {tab.toLowerCase()} room bookings</h2><p className="mt-2 text-sm text-slate-500">{tab==="PENDING"?"Your new room requests will appear here.":tab==="CONFIRMED"?"Confirmed upcoming stays will appear here.":"Your completed stays will be listed here."}</p>{tab==="PENDING"&&<a href="/properties" className="mt-4 inline-flex text-sm font-semibold text-[#2563a6] hover:underline">Find a stay →</a>}</div>:<div className="mt-5 grid gap-4 lg:grid-cols-2">{visible.map(item=>{
      const property=item.property||{}, room=item.roomType||{}, image=property.images?.[0]?.url||property.images?.[0]?.imageUrl||"";
      const src=image?( /^https?:\/\//i.test(image)?image:"http://localhost:5001"+(image.startsWith("/")?image:"/"+image)):"";
      return <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex gap-4 p-5">{src?<img src={src} alt={property.title||"ROOMO stay"} className="h-24 w-28 rounded-lg object-cover"/>:<div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">ROOMO stay</div>}<div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-[#2563a6]">{item.reservationCode}</p><h2 className="mt-1 font-semibold text-slate-900">{property.title||"Room reservation"}</h2><p className="mt-1 text-sm text-slate-500">{[property.city,property.address].filter(Boolean).join(", ")}</p></div></div><div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 text-sm"><div><p className="text-xs text-slate-500">Check-in</p><p className="mt-1 font-medium">{dateLabel(item.checkIn)}</p></div><div><p className="text-xs text-slate-500">Check-out</p><p className="mt-1 font-medium">{dateLabel(item.checkOut)}</p></div><div><p className="text-xs text-slate-500">Room / guests</p><p className="mt-1 font-medium">{room.name||"Room"} · {item.roomCount||1} room(s), {(item.adults||0)+(item.children||0)} guest(s)</p></div><div><p className="text-xs text-slate-500">Total</p><p className="mt-1 font-semibold text-slate-900">₹{Number(item.totalAmount||0).toLocaleString("en-IN")}</p></div></div><div className="flex flex-wrap items-center justify-between gap-3 p-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{bookingGroup(item)==="COMPLETED"?"COMPLETED":String(item.status||"REQUESTED").replaceAll("_"," ")}</span><div className="flex gap-3"><a href={"/property-details?id="+encodeURIComponent(property.id||"")} className="text-sm font-semibold text-[#2563a6]">View stay</a>{item.status==="REQUESTED"&&<button onClick={()=>cancelBooking(item.id)} className="text-sm font-semibold text-rose-700 hover:underline">Cancel request</button>}</div></div></article>;
    })}</div>}</>}
    <div className="mt-10 border-t border-slate-100 pt-5"><a href="/my-travel-bookings" className="text-sm font-semibold text-[#2563a6] hover:underline">View my travel bookings →</a></div>
  </main><Footer/></div>;
}
