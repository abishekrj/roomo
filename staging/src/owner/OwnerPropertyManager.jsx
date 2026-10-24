import { useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
function csrfHeaders() {
  const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf="));
  return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {};
}
const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const buttonClass = "inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50";
const secondaryClass = "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const facilityGroups = [
  { title: "Most popular facilities", items: ["Free Wi-Fi", "Free parking", "Air conditioning", "Family rooms", "Non-smoking rooms", "24-hour front desk", "Airport shuttle", "Lift", "Heating", "Breakfast available"] },
  { title: "Room & bathroom", items: ["Private bathroom", "Hot water", "Shower", "Fresh towels", "Bed linen", "Wardrobe", "Work desk", "Room service"] },
  { title: "Food & kitchen", items: ["Restaurant", "Kitchen", "Electric kettle", "Dining area", "Breakfast included", "Tea / coffee maker"] },
  { title: "Wellness & access", items: ["Meditation space", "Yoga area", "Garden", "Wheelchair accessible", "Accessible parking", "Family-friendly"] },
  { title: "Safety & services", items: ["CCTV", "Fire extinguishers", "Luggage storage", "Laundry service", "Daily housekeeping", "Power backup"] }
];
const landmarks = [
  ["annamalaiyar-temple","Annamalaiyar Temple"],["sri-ramanasramam","Sri Ramanasramam"],["girivalam-path","Girivalam pathway"],
  ["arunachala-hill","Arunachala Hill"],["skandashramam","Skandashramam"],["virupaksha-cave","Virupaksha Cave"],
  ["sathanur-dam","Sathanur Dam"],["central-bus-stand","Central bus stand"],["railway-station","Railway station"],
  ["yogi-ram-surathkumar-ashram","Yogi Ramsuratkumar Ashram"]
];
const emptyForm = () => ({
  title:"", description:"", propertyType:"Hotel", address:"", mapLocation:"", city:"Tiruvannamalai", state:"Tamil Nadu", country:"India", postalCode:"",
  nightlyPrice:"", maxGuests:"2", bedrooms:"1", bathrooms:"1", livingRooms:"0", kitchens:"0", areaSquareMeters:"",
  totalUnits:"1", availabilityCount:"", amenities:facilityGroups.flatMap(group=>group.items), nearbyLandmarks:[], perks:[],
  imageUrls:[""], media:[], policies:{checkIn:"From 12:00 PM",checkOut:"Until 11:00 AM",cancellation:"Please contact the property for cancellation terms.",children:"Children are welcome. Please confirm availability with the property.",pets:"Pets are not allowed unless approved by the property.",smoking:"Smoking is not permitted in indoor areas."},
  showPolicies:true, allowPayAtProperty:false, noCreditCardRequired:false
});
const statusLabel = status => ({DRAFT:"Draft",PENDING_APPROVAL:"Pending approval",PUBLISHED:"Approved & live",REJECTED:"Changes requested",ARCHIVED:"Archived"})[status] || status || "Draft";
const statusClass = status => status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : status === "PENDING_APPROVAL" ? "bg-amber-50 text-amber-800" : status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700";

export default function OwnerPropertyManager({ properties = [], onRefresh }) {
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [search, setSearch] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const formRef = useRef(null);
  const filtered = useMemo(() => properties.filter(item => [item.title,item.city,item.status].some(v=>String(v||"").toLowerCase().includes(search.toLowerCase()))),[properties,search]);
  const update = (key,value) => setForm(current=>({...current,[key]:value}));
  const toggle = (key,value) => update(key, form[key].includes(value) ? form[key].filter(v=>v!==value) : [...form[key],value]);
  const openNew = () => { setEditingId(""); setForm(emptyForm()); setImageFiles([]); setVideoFiles([]); setNotice(""); };
  const openEdit = property => {
    const value = emptyForm();
    const merged = {...value,...property,
      nightlyPrice:String(property.nightlyPrice??""),maxGuests:String(property.maxGuests??2),bedrooms:String(property.bedrooms??1),bathrooms:String(property.bathrooms??1),
      livingRooms:String(property.livingRooms??0),kitchens:String(property.kitchens??0),areaSquareMeters:property.areaSquareMeters==null?"":String(property.areaSquareMeters),
      totalUnits:String(property.totalUnits??1),availabilityCount:property.availabilityCount==null?"":String(property.availabilityCount),
      amenities:Array.isArray(property.amenities)?property.amenities:value.amenities,nearbyLandmarks:Array.isArray(property.nearbyLandmarks)?property.nearbyLandmarks:[],
      perks:Array.isArray(property.perks)?property.perks:[],imageUrls:[...(Array.isArray(property.images)?property.images.map(item=>item.imageUrl):Array.isArray(property.imageUrls)?property.imageUrls:[])],
      policies:{...value.policies,...(property.policies||{})},media:Array.isArray(property.media)?property.media:[]};
    if (!merged.imageUrls.length) merged.imageUrls=[""];
    setEditingId(property.id);setForm(merged);setImageFiles([]);setVideoFiles([]);setNotice("");
  };
  const payload = () => ({
    ...form, title:form.title.trim(), description:form.description.trim(), nightlyPrice:Number(form.nightlyPrice), maxGuests:Number(form.maxGuests),
    bedrooms:Number(form.bedrooms),bathrooms:Number(form.bathrooms),livingRooms:Number(form.livingRooms||0),kitchens:Number(form.kitchens||0),
    areaSquareMeters:form.areaSquareMeters===""?null:Number(form.areaSquareMeters),totalUnits:Number(form.totalUnits||1),
    availabilityCount:form.availabilityCount===""?null:Number(form.availabilityCount),imageUrls:form.imageUrls.map(v=>v.trim()).filter(Boolean),
    amenities:form.amenities,nearbyLandmarks:form.nearbyLandmarks,perks:form.perks,media:Array.isArray(form.media)?form.media:[],isFeatured:false,featuredSortOrder:0
  });
  async function api(path, options={}) {
    const response=await fetch(API+path,{...options,credentials:"include",headers:{...(options.body?{"Content-Type":"application/json"}:{}),...csrfHeaders(),...(options.headers||{})},cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message||"Unable to save property details.");
    return data;
  }
  async function save(event, submitForApproval=false) {
    event?.preventDefault();
    if(!form)return;
    if(!formRef.current?.reportValidity()) return;
    setBusy(true);setNotice("");
    try {
      const body=payload();
      if (body.imageUrls.length + imageFiles.length > 10) throw new Error("A property can have up to 10 photos. Remove a photo URL or choose fewer files.");
      if (imageFiles.length) {
        const fd = new FormData();
        imageFiles.forEach(file => fd.append("images", file));
        const response = await fetch(API + "/properties/owner/upload-images", { method:"POST", credentials:"include", headers:csrfHeaders(), body:fd });
        const uploaded = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(uploaded.message || "Image upload failed.");
        const added = (uploaded.images||[]).map(item=>({type:"IMAGE",...item}));
        body.imageUrls = [...body.imageUrls, ...added.map(item=>item.imageUrl)];
        body.media = [...(body.media||[]), ...added];
      }
      for (const file of videoFiles) {
        const fd = new FormData(); fd.append("video", file);
        const response = await fetch(API + "/properties/owner/upload-video", { method:"POST", credentials:"include", headers:csrfHeaders(), body:fd });
        const uploaded = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(uploaded.message || "Video upload failed.");
        body.media = [...(body.media||[]), {type:"VIDEO",mediaUrl:uploaded.mediaUrl,originalName:uploaded.originalName}];
      }
      const saved=await api(editingId?"/properties/owner/"+editingId+"/draft":"/properties/owner",{
        method:editingId?"PATCH":"POST",body:JSON.stringify(body)
      });
      const id=saved.property?.id;
      if(submitForApproval) {
        if(!id) throw new Error("Draft was saved but its property ID was not returned. Refresh and try again.");
        const result=await api("/properties/owner/"+id+"/submit",{method:"POST"});
        setNoticeType("success");setNotice(result.message||"Property submitted for approval.");
      } else {
        setNoticeType("success");setNotice(saved.message||"Property draft saved.");
      }
      setForm(null);setEditingId("");setImageFiles([]);setVideoFiles([]);await onRefresh?.();
    } catch(error) {setNoticeType("error");setNotice(error.message||"Unable to save property.");}
    finally {setBusy(false);}
  }
  const field=(key,label,type="text",required=false,extra={})=><label key={key} className="block text-sm font-medium text-slate-700">{label}<input className={fieldClass} type={type} required={required} value={form[key]??""} onChange={e=>update(key,e.target.value)} {...extra}/></label>;
  const textarea=(key,label,required=false,rows=4)=><label className="block text-sm font-medium text-slate-700">{label}<textarea className={fieldClass} rows={rows} required={required} value={form[key]??""} onChange={e=>update(key,e.target.value)}/></label>;
  const section=(title,description,children)=><section className="rounded-lg border border-slate-200 bg-white p-5"><div className="mb-4"><h3 className="font-semibold text-slate-900">{title}</h3>{description&&<p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{children}</section>;

  return <div className="space-y-5">
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-semibold">My Properties</h2><p className="mt-1 text-sm text-slate-500">Create a complete property listing, save it as a draft, and submit it to ROOMO for approval.</p></div><button type="button" className={buttonClass} onClick={openNew}>＋ Add property</button></div>
      {notice&&!form&&<p role="status" className={"mt-4 rounded-lg border p-3 text-sm "+(noticeType==="error"?"border-red-200 bg-red-50 text-red-800":"border-emerald-200 bg-emerald-50 text-emerald-800")}>{notice}</p>}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input aria-label="Search properties" className={fieldClass+" mt-0 sm:max-w-sm"} placeholder="Search your properties…" value={search} onChange={e=>setSearch(e.target.value)}/><p className="self-center text-xs text-slate-500">{filtered.length} property record(s)</p></div>
      {filtered.length ? <div className="mt-4 grid gap-3 xl:grid-cols-2">{filtered.map(property=><article key={property.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{property.title||"Untitled property"}</h3><p className="mt-1 text-sm text-slate-500">{[property.address,property.city,property.state].filter(Boolean).join(", ")}</p></div><span className={"shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold "+statusClass(property.status)}>{statusLabel(property.status)}</span></div><p className="mt-3 text-sm text-slate-600">₹{Number(property.nightlyPrice||0).toLocaleString("en-IN")} / night · {property.totalUnits||1} room(s)</p>{property.status==="REJECTED"&&<p className="mt-2 text-sm text-rose-700">ROOMO has requested changes. Edit the details and resubmit for approval.</p>}{["DRAFT","REJECTED"].includes(property.status)&&<button type="button" onClick={()=>openEdit(property)} className={secondaryClass+" mt-3"}>Edit draft</button>}</article>)}</div>:<p className="py-8 text-center text-sm text-slate-500">No properties yet. Select “Add property” to create your first listing.</p>}
    </section>
    {form&&<form ref={formRef} onSubmit={e=>save(e,false)} className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Property submission</p><h2 className="mt-1 text-xl font-semibold">{editingId?"Edit property draft":"Add a property"}</h2><p className="mt-1 text-sm text-slate-500">Complete the details below. Your property will not appear publicly until Super Admin approves it.</p></div><button type="button" className={secondaryClass} onClick={()=>setForm(null)}>Close</button></div></section>
      {section("1. Basic information","Tell guests what makes your property special.",<div className="grid gap-4 md:grid-cols-2">{field("title","Property name","text",true,{maxLength:150})}{<label className="block text-sm font-medium text-slate-700">Property type<select className={fieldClass} value={form.propertyType} onChange={e=>update("propertyType",e.target.value)}>{["Hotel","Guest House","Homestay","Resort","Ashram & Retreat","Vedic Matha","Pilgrim Inn","Temple View Suite","Heritage Haveli","Serviced Apartment","Villa","Hostel"].map(v=><option key={v}>{v}</option>)}</select></label>}{textarea("description","Property description",true,5)}</div>)}
      {section("2. Location","Add the complete address and map location.",<div className="grid gap-4 md:grid-cols-2">{field("address","Street address","text",true)}{field("mapLocation","Google Maps link / map location")}{field("city","City","text",true)}{field("state","State","text",true)}{field("country","Country","text",true)}{field("postalCode","Postal code")}</div>)}
      {section("3. Rooms and pricing","These details help guests compare stays.",<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{field("nightlyPrice","Nightly price (INR)","number",true,{min:"1",step:"0.01"})}{field("maxGuests","Maximum guests","number",true,{min:"1",max:"100"})}{field("totalUnits","Total rooms / units","number",true,{min:"1",max:"1000"})}{field("availabilityCount","Available rooms (optional)","number",false,{min:"0",max:"1000"})}{field("bedrooms","Bedrooms","number",true,{min:"1"})}{field("bathrooms","Bathrooms","number",true,{min:"1"})}{field("livingRooms","Living rooms","number",false,{min:"0"})}{field("kitchens","Kitchens","number",false,{min:"0"})}{field("areaSquareMeters","Area (m²)","number",false,{min:"0",step:"0.1"})}</div>)}
      {section("4. Facilities","Select all facilities available at this property.",<div className="space-y-5">{facilityGroups.map(group=><div key={group.title}><h4 className="mb-3 text-sm font-semibold">{group.title}</h4><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{group.items.map(item=><label key={item} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.amenities.includes(item)} onChange={()=>toggle("amenities",item)} className="h-4 w-4 rounded border-slate-300 accent-blue-700"/>{item}</label>)}</div></div>)}</div>)}
      {section("5. Nearby landmarks","Select nearby sacred and transport locations.",<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{landmarks.map(([value,label])=><label key={value} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.nearbyLandmarks.includes(value)} onChange={()=>toggle("nearbyLandmarks",value)} className="h-4 w-4 rounded border-slate-300 accent-blue-700"/>{label}</label>)}</div>)}
      {section("6. Property highlights","Add the key benefits guests should notice.",<div className="space-y-3">{form.perks.map((perk,index)=><div key={index} className="flex gap-2"><input className={fieldClass+" mt-0"} value={perk} onChange={e=>update("perks",form.perks.map((v,i)=>i===index?e.target.value:v))} placeholder="e.g. Walking distance to temple"/><button type="button" className={secondaryClass} onClick={()=>update("perks",form.perks.filter((_,i)=>i!==index))}>Remove</button></div>)}<button type="button" className={secondaryClass} onClick={()=>update("perks",[...form.perks,""])}>＋ Add highlight</button></div>)}
      {section("7. Property photos","Add direct image URLs (HTTPS preferred). You can add more than one photo.",<div className="space-y-3"><label className="block text-sm font-medium text-slate-700">Upload property photos (JPG, PNG, WebP or AVIF, up to 8 MB each)<input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={e=>setImageFiles(Array.from(e.target.files||[]).slice(0,10))}/></label>{imageFiles.length>0&&<p className="text-xs text-slate-500">{imageFiles.length} photo file(s) selected; files upload when you save.</p>}{form.imageUrls.map((url,index)=><div key={index} className="flex gap-2"><input className={fieldClass+" mt-0"} type="url" value={url} onChange={e=>update("imageUrls",form.imageUrls.map((v,i)=>i===index?e.target.value:v))} placeholder="https://example.com/property-photo.jpg"/>{form.imageUrls.length>1&&<button type="button" className={secondaryClass} onClick={()=>update("imageUrls",form.imageUrls.filter((_,i)=>i!==index))}>Remove</button>}</div>)}<button type="button" disabled={form.imageUrls.length>=10} className={secondaryClass} onClick={()=>update("imageUrls",[...form.imageUrls,""])}>＋ Add photo URL (up to 10)</button><label className="block text-sm font-medium text-slate-700">Upload property videos (MP4, WebM or MOV, up to 50 MB each)<input className={fieldClass} type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={e=>setVideoFiles(Array.from(e.target.files||[]).slice(0,5))}/></label>{videoFiles.length>0&&<p className="text-xs text-slate-500">{videoFiles.length} video file(s) selected; files upload when you save.</p>}{Array.isArray(form.media)&&form.media.filter(item=>item.type==="VIDEO").map((item,index)=><p key={item.mediaUrl||index} className="text-xs text-slate-600">Existing video: {item.originalName||item.mediaUrl}</p>)}</div>)}
      {section("8. Policies and payment","Set clear expectations for guests.",<div className="grid gap-4 md:grid-cols-2">{Object.entries(form.policies).map(([key,value])=><label key={key} className="block text-sm font-medium text-slate-700">{({checkIn:"Check-in",checkOut:"Check-out",cancellation:"Cancellation policy",children:"Children policy",pets:"Pets policy",smoking:"Smoking policy"})[key]||key}<textarea className={fieldClass} rows={2} value={value} onChange={e=>update("policies",{...form.policies,[key]:e.target.value})}/></label>)}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showPolicies} onChange={e=>update("showPolicies",e.target.checked)} className="h-4 w-4"/>Show policies on listing</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowPayAtProperty} onChange={e=>update("allowPayAtProperty",e.target.checked)} className="h-4 w-4"/>Allow pay at property</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.noCreditCardRequired} onChange={e=>update("noCreditCardRequired",e.target.checked)} className="h-4 w-4"/>No credit card required</label></div>)}
      {notice&&<p role="alert" className={"rounded-lg border p-3 text-sm "+(noticeType==="error"?"border-red-200 bg-red-50 text-red-800":"border-emerald-200 bg-emerald-50 text-emerald-800")}>{notice}</p>}
      <div className="flex flex-wrap justify-end gap-3 rounded-lg border border-slate-200 bg-white p-4"><button type="button" className={secondaryClass} onClick={()=>setForm(null)} disabled={busy}>Cancel</button><button type="submit" className={secondaryClass} disabled={busy}>{busy?"Saving…":"Save draft"}</button><button type="button" className={buttonClass} disabled={busy} onClick={()=>save(null,true)}>{busy?"Submitting…":"Save & submit for approval →"}</button></div>
      <p className="text-xs leading-5 text-slate-500">Your draft remains private to your owner account. Only an approved property is published to the ROOMO guest listing pages.</p>
    </form>}
  </div>;
}
