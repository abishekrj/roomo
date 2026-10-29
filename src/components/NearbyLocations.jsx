import {useEffect,useRef,useState} from "react";
const API_BASE=import.meta.env.VITE_ROOMO_API_URL||"http://localhost:5001/api";
const API_URL=API_BASE+"/homepage/nearby-places";
const API_ORIGIN=new URL(API_BASE).origin;
function resolveSingleImageUrl(raw){
 if(!raw||typeof raw!=="string")return "";
 const path=raw.trim().replace(/\\\\/g,"/");
 if(!path)return "";
 if(/^(data:|blob:)/i.test(path))return path;
 try{
  const url=new URL(path,API_ORIGIN);
  if(["localhost","127.0.0.1"].includes(url.hostname)&&url.port!=="5001"&&url.pathname.startsWith("/uploads/")){
   url.protocol="http:";url.hostname="localhost";url.port="5001";
  }
  return url.protocol==="http:"||url.protocol==="https:"?url.href:"";
 }catch{return ""}
}
function imageCandidates(value){
 const fields=["imageUrl","imagePath","fileUrl","mediaUrl","thumbnailUrl","url","path","src","image","photo","coverImage","featuredImage"];
 const values=typeof value==="string"?[value]:fields.map(key=>value?.[key]);
 return [...new Set(values.map(resolveSingleImageUrl).filter(Boolean))];
}
function resolveImageUrl(value){return imageCandidates(value)[0]||"";}
function handleImageError(event,value){
 const image=event.currentTarget;
 const candidates=imageCandidates(value);
 const next=Number(image.dataset.fallbackIndex||0)+1;
 if(next<candidates.length){
  image.dataset.fallbackIndex=String(next);
  image.src=candidates[next];
 }else{
  image.style.display="none";
 }
}
export default function NearbyLocations(){
 const [section,setSection]=useState(null),[selectedPlace,setSelectedPlace]=useState(null);const trackRef=useRef(null);
 useEffect(()=>{let cancelled=false;fetch(API_URL,{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error("Unable to load travel destinations.");return r.json()}).then(d=>{if(!cancelled)setSection(d||null)}).catch(()=>{if(!cancelled)setSection(null)});return()=>{cancelled=true}},[]);
 useEffect(()=>{if(!selectedPlace)return;const key=e=>{if(e.key==="Escape")setSelectedPlace(null)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[selectedPlace]);
 const places=Array.isArray(section?.places)?[...section.places].filter(p=>p&&p.visible!==false).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)):[];
 const scroll=dir=>{const t=trackRef.current;if(!t)return;const c=t.querySelector("[data-nearby-card]"),s=window.getComputedStyle(t),g=Number.parseFloat(s.columnGap||s.gap)||0;t.scrollBy({left:dir*(c?c.getBoundingClientRect().width+g:t.clientWidth*.85),behavior:"smooth"})};
 const journeyUrl=p=>"/transport-booking?"+new URLSearchParams({destination:p.name||"",source:"nearby-place",placeId:p.id||""}).toString();
 const cleanSecondItemText=(value,index)=>index===1&&typeof value==="string"?value.replace(/\ballow\s+/gi,"").replace(/\s*by road\b/gi,"").trim():value;
 if(!section||section.enabled===false||!places.length)return null;
 return <section aria-labelledby="nearby-locations-title" className="w-full bg-white py-12 sm:py-16"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
 <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8 sm:gap-5"><div className="max-w-3xl">{section.eyebrow&&<p className="mb-3 text-xs font-semibold uppercase tracking-[.18em] text-[#2563A6] sm:text-sm">{section.eyebrow}</p>}<h2 id="nearby-locations-title" className="text-2xl font-semibold leading-tight tracking-tight text-[#212529] sm:text-3xl lg:text-4xl">{section.title||"Travel Outstations"}</h2>{section.description&&<p className="mt-4 max-w-2xl text-sm leading-6 text-[#5F6670] sm:text-base sm:leading-7">{section.description}</p>}</div><div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center"><a href="/transport-booking" className="hidden text-sm font-semibold text-[#2563A6] hover:underline sm:inline-flex">Request outstation ride →</a><div className="flex items-center gap-2"><button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-2xl text-slate-700 hover:border-[#2563A6] disabled:opacity-40" onClick={()=>scroll(-1)} aria-label="Previous travel destinations" disabled={places.length<2}>‹</button><button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-2xl text-slate-700 hover:border-[#2563A6] disabled:opacity-40" onClick={()=>scroll(1)} aria-label="Next travel destinations" disabled={places.length<2}>›</button></div></div></div>
 <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5" aria-label="Travel outstations">{places.map((p,i)=><article key={p.id||p.name||i} data-nearby-card className="flex w-[84%] min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]"><button type="button" onClick={()=>setSelectedPlace(p)} className="flex h-full flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563A6]" aria-label={`Explore outstation destination ${p.name}`}><div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">{resolveImageUrl(p)?<img src={resolveImageUrl(p)} alt={p.name||""} loading="lazy" onError={event=>handleImageError(event,p)} className="h-full w-full object-cover"/>:<div className="grid h-full w-full place-items-center text-4xl text-slate-400">⌖</div>}{p.category&&<span className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#2563A6]">{p.category}</span>}</div><div className="flex flex-1 flex-col p-4 sm:p-5"><h3 className="text-base font-semibold leading-snug text-[#212529] sm:text-lg">{p.name}</h3>{p.location&&<p className="mt-1 text-xs font-medium text-slate-500">{p.location}</p>}<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">{p.distance&&<span>⌖ {cleanSecondItemText(p.distance,i)}</span>}{p.travelTime&&<span>↗ {cleanSecondItemText(p.travelTime,i)}</span>}</div><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2563A6]">View details →</span></div></button><a href={journeyUrl(p)} className="mx-4 mb-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2563A6] px-3 py-2 text-sm font-semibold text-[#2563A6] hover:bg-[#2563A6] hover:text-white sm:mx-5 sm:mb-5">Plan outstation ride</a></article>)}</div></div>
 {selectedPlace&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101820]/65 p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedPlace(null)}}><div role="dialog" aria-modal="true" aria-labelledby="nearby-place-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">{resolveImageUrl(selectedPlace)&&<img src={resolveImageUrl(selectedPlace)} alt={selectedPlace.name||""} onError={event=>handleImageError(event,selectedPlace)} className="max-h-72 w-full object-cover"/>}<div className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div>{selectedPlace.category&&<p className="text-xs font-semibold uppercase tracking-wider text-[#2563A6]">{selectedPlace.category}</p>}<h3 id="nearby-place-dialog-title" className="mt-1 text-xl font-semibold text-[#212529] sm:text-2xl">{selectedPlace.name}</h3></div><button type="button" onClick={()=>setSelectedPlace(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E4E8ED] text-xl text-[#526170]" aria-label="Close place details">×</button></div>{selectedPlace.location&&<p className="mt-3 text-sm font-medium text-[#2563A6]">{selectedPlace.location}</p>}{selectedPlace.description&&<p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5F6670]">{selectedPlace.description}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2">{selectedPlace.distance&&<div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approx. road distance</p><p className="mt-1 text-sm text-slate-800">{selectedPlace.distance}</p></div>}{selectedPlace.travelTime&&<div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated road time</p><p className="mt-1 text-sm text-slate-800">{selectedPlace.travelTime}</p></div>}{selectedPlace.openingHours&&<div className="rounded-lg bg-slate-50 p-3 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Journey information</p><p className="mt-1 text-sm leading-6 text-slate-700">{selectedPlace.openingHours}</p></div>}</div><div className="mt-6 flex flex-wrap gap-3">{selectedPlace.mapUrl&&<a href={selectedPlace.mapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">View route ↗</a>}<a href={journeyUrl(selectedPlace)} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2563A6] px-4 py-2.5 text-sm font-semibold text-white">Plan an outstation ride →</a></div></div></div></div>}
 </section>;
}