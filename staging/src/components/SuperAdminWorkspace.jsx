import { useCallback, useEffect, useMemo, useState } from "react";

const API = "http://localhost:5001/api";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const buttonClass = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50";
const secondaryClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";
const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";

async function api(path, token, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: "Bearer " + token, ...(options.headers || {}) },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}
const jsonBody = (body) => ({ method: "PUT", body: JSON.stringify(body) });
const postBody = (body) => ({ method: "POST", body: JSON.stringify(body) });
const patchBody = (body) => ({ method: "PATCH", body: JSON.stringify(body) });
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Panel({ title, description, children, action }) {
  return <section className={cardClass}><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h2 className="text-lg font-semibold text-slate-900">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>{children}</section>;
}
function Field({ label, value, onChange, type = "text", required = false, placeholder = "", ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input className={inputClass} value={value ?? ""} onChange={e => onChange(type === "number" ? e.target.value : e.target.value)} type={type} required={required} placeholder={placeholder} {...props} /></label>;
}
function TextField({ label, value, onChange, rows = 3, required = false, ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<textarea className={inputClass} value={value ?? ""} onChange={e => onChange(e.target.value)} rows={rows} required={required} {...props} /></label>;
}
function Toggle({ label, checked, onChange }) {
  return <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(checked)} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />{label}</label>;
}
function Empty({ children = "No records found." }) { return <p className="py-8 text-center text-sm text-slate-500">{children}</p>; }

export default function SuperAdminWorkspace({ pageKey, token, onNotice }) {
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const notify = (message) => { setLocalMessage(message); onNotice?.(message); };
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const load = useCallback(async () => {
    setBusy(true);
    try {
      let result = {};
      if (pageKey === "enquiries") result = await api("/enquiries/admin", token);
      else if (pageKey === "owners") result = await api("/admin/owners", token);
      else if (["rooms/listings", "rooms/add", "rooms/featured"].includes(pageKey)) {
        result = await api("/admin/properties", token);
        setProperties(result.properties || []);
      } else if (pageKey === "rooms/types") {
        const p = await api("/admin/room-types/properties", token);
        setProperties(p.properties || []);
        const id = selectedProperty || p.properties?.[0]?.id || "";
        if (id) { setSelectedProperty(id); result = await api("/admin/room-types?propertyId=" + encodeURIComponent(id), token); }
        else result = { roomTypes: [] };
      } else if (pageKey === "rooms/filters") result = await api("/admin/room-filters", token);
      else if (pageKey === "cms-pages") result = await api("/admin/cms-pages", token);
      else if (pageKey === "destinations") {
        const [places, suggestions] = await Promise.all([api("/admin/homepage/destinations", token), api("/admin/homepage/destination-suggestions", token)]);
        result = { ...places, suggestions: suggestions.suggestions || [] };
      } else if (pageKey === "nearby-locations") result = await api("/homepage/nearby-places/admin", token);
      else if (pageKey === "shopping-directory") result = await api("/homepage/shops/admin", token);
      else if (pageKey === "testimonials") result = await api("/admin/testimonials", token);
      else if (["gallery/add", "gallery/list"].includes(pageKey)) result = await api("/admin/gallery", token);
      else if (pageKey === "reports") {
        const [reservations, commissions] = await Promise.all([api("/admin/reservations", token), api("/admin/commissions", token)]);
        result = { ...(reservations || {}), commissions: commissions.reservations || [], commissionSummary: commissions };
      } else if (pageKey === "homepage/featured-stays") result = await api("/admin/homepage/featured-rooms", token);
      else if (pageKey === "rooms/listing-display") result = await api("/listing-display-settings/admin", token);
      else if (pageKey === "homepage/pilgrim-guide") result = await api("/admin/homepage/pilgrim-guide", token);
      else if (pageKey === "homepage/nearby-locations") result = await api("/homepage/nearby-places/admin", token);
      else if (pageKey === "homepage/shopping-directory") result = await api("/homepage/shops/admin", token);
      else if (pageKey === "homepage/testimonials") result = await api("/admin/testimonials", token);
      else if (pageKey === "homepage/galleries") result = await api("/admin/gallery", token);
      else if (pageKey === "homepage/footer" || pageKey === "homepage/header" || pageKey === "homepage/search-section" || pageKey === "homepage/upcoming-festival") result = await api("/admin/homepage", token);
      setData(result);
      setLocalMessage("");
    } catch (error) {
      setData({ __error: error.message || "Unable to load this section." });
    } finally { setBusy(false); }
  }, [pageKey, token, selectedProperty]);

  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => {
    const rows = data?.enquiries || data?.owners || data?.properties || data?.pages || data?.items || data?.reservations || data?.roomTypes || [];
    return rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  }, [data, query]);

  async function runAction(action, success) {
    setBusy(true);
    try { await action(); notify(success); await load(); }
    catch (error) { notify(error.message || "The change could not be saved."); }
    finally { setBusy(false); }
  }
  function beginEdit(item, idKey = "id") {
    setEditingId(item[idKey] || "");
    setForm({ ...item });
  }
  function resetForm() { setEditingId(""); setForm({}); }

  if (busy && !data) return <div className={cardClass}><p className="text-sm text-slate-500">Loading React admin workspace…</p></div>;
  if (data?.__error) return <Panel title={titleFor(pageKey)} description="This page is running inside the React Super Admin portal."><p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{data.__error}</p><button className={secondaryClass + " mt-4"} onClick={load}>Retry</button></Panel>;

  if (pageKey === "enquiries") return <Panel title="Enquiries & reservations" description="Guest requests and reservation records from the ROOMO backend."><SearchBar query={query} setQuery={setQuery} /><DataTable rows={filtered} columns={[["Guest", r => r.guest?.fullName || r.guestName || "—"],["Property",r=>r.property?.title || "—"],["Contact",r=>r.guest?.email || r.email || "—"],["Dates",r=>[r.checkIn,r.checkOut].filter(Boolean).map(fmtDate).join(" – ") || "Not selected"],["Guests / Rooms",r=>[r.adults && r.adults + " adults",r.children != null && r.children + " children",r.rooms && r.rooms + " room(s)"].filter(Boolean).join(", ") || "—"],["Status",r=>r.status || "—"],["Received",r=>fmtDate(r.createdAt)]]} /></Panel>;

  if (pageKey === "owners") return <div className="space-y-5">
    <Panel title={editingId ? "Edit owner permissions" : "Create owner account"} description="Manage property-owner accounts and whether owners may edit their assigned property details.">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); runAction(async () => { if (editingId) await api("/admin/owners/" + editingId + "/property-edit-permission", token, patchBody({ canEditProperties: Boolean(form.canEditProperties) })); else await api("/admin/owners", token, postBody({ fullName: form.fullName, email: form.email, password: form.password, phoneNumber: form.phoneNumber || undefined })); resetForm(); }, editingId ? "Owner permission updated." : "Owner account created."); }}>
        {!editingId && <><Field label="Full name" value={form.fullName} onChange={v=>update("fullName",v)} required /><Field label="Email" type="email" value={form.email} onChange={v=>update("email",v)} required /><Field label="Temporary password (12+ characters)" type="password" value={form.password} onChange={v=>update("password",v)} required minLength={12} /><Field label="Phone (optional)" value={form.phoneNumber} onChange={v=>update("phoneNumber",v)} /></>}
        {editingId && <><p className="sm:col-span-2 text-sm text-slate-600">Update access for <strong>{form.fullName}</strong>.</p><div className="sm:col-span-2"><Toggle label="Allow this owner to edit property details" checked={form.canEditProperties} onChange={v=>update("canEditProperties",v)} /></div></>}
        <div className="sm:col-span-2 flex gap-2"><button disabled={busy} className={buttonClass}>{editingId ? "Save permission" : "Create owner"}</button>{editingId && <button type="button" className={secondaryClass} onClick={resetForm}>Cancel</button>}</div>
      </form>
    </Panel>
    <Panel title="Registered owners" description="Select an owner to update their property-editing permission."><SearchBar query={query} setQuery={setQuery} /><DataTable rows={(data?.owners||[]).filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))} columns={[["Owner",r=>r.fullName],["Email",r=>r.email],["Role",r=>r.role],["Properties",r=>r._count?.properties ?? r.properties?.length ?? "—"],["Edit access",r=>r.canEditProperties ? "Enabled" : "Disabled"],["Joined",r=>fmtDate(r.createdAt)]]} actions={r=><button className={secondaryClass} onClick={()=>beginEdit(r)}>Permissions</button>} /></Panel>
  </div>;

  if (["rooms/listings","rooms/featured"].includes(pageKey)) return <Panel title={pageKey === "rooms/featured" ? "Featured rooms" : "Room listings"} description="Manage published status, drafts and featured placement without leaving the React admin."><SearchBar query={query} setQuery={setQuery} /><DataTable rows={(data?.properties||[]).filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))} columns={[["Property",r=>r.title],["Location",r=>[r.city,r.state].filter(Boolean).join(", ")],["Owner",r=>r.owner?.fullName || "—"],["Price / night",r=>r.nightlyPrice != null ? "₹"+Number(r.nightlyPrice).toLocaleString("en-IN") : "—"],["Status",r=>r.status || "—"],["Featured",r=>r.isFeatured ? "Yes" : "No"]]} actions={r=><div className="flex flex-wrap gap-2"><button className={secondaryClass} onClick={()=>runAction(()=>api("/admin/properties/"+r.id+"/featured",token,patchBody({isFeatured:!r.isFeatured})),r.isFeatured?"Removed from Featured Rooms.":"Added to Featured Rooms.")}>{r.isFeatured?"Unfeature":"Feature"}</button><select className={inputClass+" min-w-32"} aria-label={"Status for "+r.title} value={r.status||"DRAFT"} onChange={e=>runAction(()=>api("/admin/properties/"+r.id+"/status",token,patchBody({status:e.target.value})), "Property status updated.")}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>} /></Panel>;

  if (pageKey === "rooms/add") return <PropertyCreate token={token} busy={busy} setBusy={setBusy} notify={notify} onCreated={load} properties={data?.properties||[]} />;

  if (pageKey === "rooms/types") return <RoomTypes token={token} data={data} properties={properties} selectedProperty={selectedProperty} setSelectedProperty={setSelectedProperty} load={load} busy={busy} setBusy={setBusy} notify={notify} />;

  if (pageKey === "rooms/listing-display") return <ListingDisplayEditor token={token} settings={data?.settings||{}} notify={notify} busy={busy} />;

  if (pageKey === "rooms/filters") return <FilterManager token={token} groups={data?.groups||[]} load={load} notify={notify} busy={busy} runAction={runAction} />;

  if (pageKey === "cms-pages") return <CmsManager token={token} pages={data?.pages||[]} load={load} notify={notify} runAction={runAction} busy={busy} />;

  if (pageKey === "destinations") return <DestinationManager token={token} places={data?.places||[]} suggestions={data?.suggestions||[]} load={load} notify={notify} runAction={runAction} busy={busy} />;

  if (pageKey === "nearby-locations" || pageKey === "homepage/nearby-locations") return <CollectionConfig title="Nearby Locations" token={token} endpoint="/homepage/nearby-places/admin" keyName="places" data={data?.draft || {enabled:true,title:"Nearby Locations",description:"",places:[]}} load={load} notify={notify} busy={busy} />;

  if (pageKey === "shopping-directory" || pageKey === "homepage/shopping-directory") return <CollectionConfig title="Shopping Directory" token={token} endpoint="/homepage/shops/admin" keyName="shops" data={data?.draft || {enabled:true,title:"Shopping Directory",description:"",shops:[]}} load={load} notify={notify} busy={busy} />;

  if (pageKey === "testimonials" || pageKey === "homepage/testimonials") return <TestimonialsManager token={token} data={data?.draft || {eyebrow:"",title:"",description:"",ratingSummary:"",items:[]}} load={load} notify={notify} busy={busy} />;

  if (["gallery/add","gallery/list","homepage/galleries"].includes(pageKey)) return <GalleryManager token={token} items={data?.items||[]} load={load} notify={notify} busy={busy} startAdd={pageKey==="gallery/add"} />;

  if (pageKey === "reports") return <div className="space-y-5"><Panel title="Reservations report" description="Reservation activity available to Super Admin."><DataTable rows={data?.reservations||[]} columns={[["Reference",r=>r.referenceCode||r.id],["Guest",r=>r.guest?.fullName||"—"],["Property",r=>r.property?.title||"—"],["Check-in",r=>fmtDate(r.checkIn)],["Check-out",r=>fmtDate(r.checkOut)],["Status",r=>r.status||"—"],["Total",r=>r.totalAmount!=null?"₹"+Number(r.totalAmount).toLocaleString("en-IN"):"—"]]} /></Panel><Panel title="Commission overview" description="Current owner commission rates and reservation settlement details."><p className="mb-3 text-sm text-slate-600">Use the owner commission settings to change future rates. Existing reservations retain their saved rate.</p><DataTable rows={data?.commissionSummary?.owners||[]} columns={[["Owner",r=>r.fullName],["Email",r=>r.email],["Commission rate",r=>r.commissionRate+"%"],["Reservations",r=>r.reservationCount ?? "—"]]} /></Panel></div>;

  if (pageKey === "homepage/featured-stays") return <FeaturedSection token={token} data={data||{}} load={load} notify={notify} busy={busy} />;
  if (pageKey === "homepage/pilgrim-guide") return <PilgrimGuideEditor token={token} data={data?.draft||{}} load={load} notify={notify} busy={busy} />;
  if (["homepage/header","homepage/search-section","homepage/upcoming-festival","homepage/footer"].includes(pageKey)) return <HomepageFields token={token} pageKey={pageKey} data={data?.draft||{}} load={load} notify={notify} busy={busy} />;
  return <Panel title={titleFor(pageKey)} description="React-based content management workspace."><p className="text-sm text-slate-600">This section uses the React Super Admin portal. Choose another menu or refresh this section.</p><button onClick={load} className={secondaryClass+" mt-4"}>Refresh</button></Panel>;
}

function titleFor(key) {
  return ({ enquiries:"Enquiries",owners:"Owners","rooms/add":"Add Rooms","rooms/listings":"Room Listings","rooms/types":"Room Types","rooms/filters":"Room Filters","rooms/featured":"Featured Rooms","rooms/listing-display":"Listing Display Settings","cms-pages":"CMS Pages",destinations:"Destinations","nearby-locations":"Nearby Locations","shopping-directory":"Shopping Directory",testimonials:"Testimonials","gallery/add":"Add Gallery","gallery/list":"Gallery List",reports:"Reports","homepage/header":"Header","homepage/search-section":"Search Section","homepage/featured-stays":"Featured Stays","homepage/upcoming-festival":"Upcoming Festival","homepage/pilgrim-guide":"Pilgrim Guide","homepage/nearby-locations":"Nearby Locations","homepage/galleries":"Galleries","homepage/shopping-directory":"Shopping Directory","homepage/testimonials":"Testimonials","homepage/footer":"Footer" })[key] || "Admin Workspace";
}
function fmtDate(value) { if (!value) return "—"; const date=new Date(value); return Number.isNaN(date.getTime())?"—":date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function SearchBar({query,setQuery}) { return <input aria-label="Search records" placeholder="Search records…" className={inputClass+" mb-4 max-w-lg"} value={query} onChange={e=>setQuery(e.target.value)} />; }
function DataTable({rows,columns,actions}) {
  if (!rows?.length) return <Empty />;
  return <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{columns.map(([label])=><th key={label} className="px-4 py-3 font-semibold">{label}</th>)}{actions&&<th className="px-4 py-3 font-semibold">Actions</th>}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row,i)=><tr key={row.id||row.slug||i} className="align-top">{columns.map(([label,render])=><td key={label} className="max-w-[260px] whitespace-normal px-4 py-3">{render(row)}</td>)}{actions&&<td className="px-4 py-3">{actions(row)}</td>}</tr>)}</tbody></table></div>;
}
function PropertyCreate({token,busy,setBusy,notify,onCreated}) {
 const initial={title:"",description:"",propertyType:"Hotel",address:"",city:"Tiruvannamalai",state:"Tamil Nadu",country:"India",postalCode:"",nightlyPrice:"",maxGuests:"2",bedrooms:"1",bathrooms:"1",livingRooms:"0",kitchens:"0",amenities:[],nearbyLandmarks:[],perks:[],imageUrls:[],status:"DRAFT",isFeatured:false,featuredSortOrder:"0",availabilityCount:""};
 const [f,setF]=useState(initial); const set=(k,v)=>setF(s=>({...s,[k]:v}));
 const submit=async e=>{e.preventDefault();setBusy(true);try{const body={...f,nightlyPrice:Number(f.nightlyPrice),maxGuests:Number(f.maxGuests),bedrooms:Number(f.bedrooms),bathrooms:Number(f.bathrooms),livingRooms:Number(f.livingRooms),kitchens:Number(f.kitchens),featuredSortOrder:Number(f.featuredSortOrder),availabilityCount:f.availabilityCount===""?null:Number(f.availabilityCount),amenities:f.amenities,nearbyLandmarks:f.nearbyLandmarks,perks:f.perks,imageUrls:f.imageUrls};const r=await api("/admin/properties",token,postBody(body));notify(r.message||"Property created.");setF(initial);onCreated();}catch(err){notify(err.message);}finally{setBusy(false);}};
 return <Panel title="Add property / room listing" description="Create a property directly in the React Super Admin portal."><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Field label="Property name" value={f.title} onChange={v=>set("title",v)} required minLength={5}/><Field label="Property type" value={f.propertyType} onChange={v=>set("propertyType",v)} required/><Field label="Address" value={f.address} onChange={v=>set("address",v)} required/><Field label="City" value={f.city} onChange={v=>set("city",v)} required/><Field label="State" value={f.state} onChange={v=>set("state",v)} required/><Field label="Postal code" value={f.postalCode} onChange={v=>set("postalCode",v)}/><Field label="Nightly price (₹)" type="number" value={f.nightlyPrice} onChange={v=>set("nightlyPrice",v)} required min="1"/><Field label="Maximum guests" type="number" value={f.maxGuests} onChange={v=>set("maxGuests",v)} required min="1"/><Field label="Bedrooms" type="number" value={f.bedrooms} onChange={v=>set("bedrooms",v)} min="0"/><Field label="Bathrooms" type="number" value={f.bathrooms} onChange={v=>set("bathrooms",v)} min="1"/><Field label="Available rooms" type="number" value={f.availabilityCount} onChange={v=>set("availabilityCount",v)} min="0"/><label className="block text-sm font-medium">Status<select className={inputClass} value={f.status} onChange={e=>set("status",e.target.value)}><option>DRAFT</option><option>PUBLISHED</option></select></label><div className="sm:col-span-2"><TextField label="Description (minimum 20 characters)" value={f.description} onChange={v=>set("description",v)} rows={4} required minLength={20}/></div><div className="sm:col-span-2"><TextField label="Image URLs (one HTTPS URL per line)" value={f.imageUrls.join("\n")} onChange={v=>set("imageUrls",v.split("\n").map(x=>x.trim()).filter(Boolean))} rows={3}/></div><div className="sm:col-span-2"><button disabled={busy} className={buttonClass}>{busy?"Creating…":"Create property"}</button></div></form></Panel>;
}
function RoomTypes({token,data,properties,selectedProperty,setSelectedProperty,load,busy,setBusy,notify}) {
 const [f,setF]=useState({name:"",description:"",nightlyPrice:"",maxGuests:"2",quantity:"1",isActive:true,sortOrder:"0",imageUrls:[],facilities:[]});
 const set=(k,v)=>setF(s=>({...s,[k]:v}));
 return <div className="space-y-5"><Panel title="Room types" description="Select a property to manage its room types."><select className={inputClass+" max-w-xl"} value={selectedProperty} onChange={e=>setSelectedProperty(e.target.value)}><option value="">Choose a property</option>{properties.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><div className="mt-4"><DataTable rows={data?.roomTypes||[]} columns={[["Room type",r=>r.name],["Property",r=>r.property?.title||data?.property?.title||"—"],["Price",r=>"₹"+Number(r.nightlyPrice||0).toLocaleString("en-IN")],["Guests",r=>r.maxGuests],["Quantity",r=>r.quantity],["Active",r=>r.isActive?"Yes":"No"]]} actions={r=><button className={secondaryClass} onClick={()=>runRoomTypeDelete(token,r.id,notify,load,setBusy)}>Delete</button>} /></div></Panel><Panel title="Add room type" description="Add a room category to the selected property."><form className="grid gap-4 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();if(!selectedProperty){notify("Choose a property first.");return;}setBusy(true);try{await api("/admin/room-types",token,postBody({...f,propertyId:selectedProperty,nightlyPrice:Number(f.nightlyPrice),maxGuests:Number(f.maxGuests),quantity:Number(f.quantity),sortOrder:Number(f.sortOrder),imageUrls:f.imageUrls,facilities:f.facilities,bedConfiguration:[]}));notify("Room type created.");setF({name:"",description:"",nightlyPrice:"",maxGuests:"2",quantity:"1",isActive:true,sortOrder:"0",imageUrls:[],facilities:[]});load();}catch(err){notify(err.message);}finally{setBusy(false);}}}><Field label="Room type name" value={f.name} onChange={v=>set("name",v)} required/><Field label="Nightly price (₹)" type="number" value={f.nightlyPrice} onChange={v=>set("nightlyPrice",v)} required min="1"/><Field label="Maximum guests" type="number" value={f.maxGuests} onChange={v=>set("maxGuests",v)} required min="1"/><Field label="Quantity" type="number" value={f.quantity} onChange={v=>set("quantity",v)} required min="0"/><div className="sm:col-span-2"><TextField label="Description" value={f.description} onChange={v=>set("description",v)}/></div><button className={buttonClass} disabled={busy}>Create room type</button></form></Panel></div>;
}
async function runRoomTypeDelete(token,id,notify,load,setBusy){setBusy(true);try{await api("/admin/room-types/"+id,token,{method:"DELETE"});notify("Room type deleted.");await load();}catch(e){notify(e.message);}finally{setBusy(false);}}
function FilterManager({token,groups,load,notify,busy,runAction}) {
 const [title,setTitle]=useState(""); const [icon,setIcon]=useState("bi-sliders");
 return <div className="space-y-5"><Panel title="Room filter groups" description="Manage the filter headings displayed to visitors."><DataTable rows={groups} columns={[["Group",r=>r.title],["Icon",r=>r.icon],["Filters",r=>r.filters?.length||0],["Status",r=>r.isActive?"Active":"Inactive"]]} actions={r=><button className={secondaryClass} onClick={()=>runAction(()=>api("/admin/room-filters/groups/"+r.id,token,patchBody({isActive:!r.isActive})), "Filter group updated.")}>{r.isActive?"Disable":"Enable"}</button>} /></Panel><Panel title="Add filter group"><form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();runAction(()=>api("/admin/room-filters/groups",token,postBody({title,icon,sortOrder:groups.length,isActive:true})),"Filter group created.");setTitle("");}}><Field label="Group heading" value={title} onChange={setTitle} required/><Field label="Icon class" value={icon} onChange={setIcon} required/><div><button disabled={busy} className={buttonClass}>Add group</button></div></form></Panel><Panel title="Filter options" description="Existing filters grouped under each heading."><div className="space-y-4">{groups.map(group=><div key={group.id} className="rounded-lg border border-slate-200 p-4"><h3 className="font-semibold">{group.title}</h3>{group.filters?.length?<ul className="mt-3 divide-y divide-slate-100">{group.filters.map(f=><li key={f.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{f.label} <span className="text-slate-500">({f.filterType}: {f.value})</span></span><button className={secondaryClass} onClick={()=>runAction(()=>api("/admin/room-filters/filters/"+f.id,token,{method:"DELETE"}),"Filter deleted.")}>Delete</button></li>)}</ul>:<p className="mt-2 text-sm text-slate-500">No filters in this group.</p>}</div>)}</div></Panel></div>;
}
function CmsManager({token,pages,load,notify,runAction,busy}) {
 const [f,setF]=useState({slug:"",title:"",subtitle:"",seoTitle:"",seoDescription:"",heroImageUrl:"",intro:"",sectionHeading:"About this place",sectionBody:"",ctaTitle:"",ctaText:"",ctaLabel:"Explore stays",ctaUrl:"/properties"});
 const set=(k,v)=>setF(s=>({...s,[k]:v}));
 return <div className="space-y-5"><Panel title="Create CMS page" description="Create and publish visitor-facing content pages using structured React form fields."><form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();const page={slug:slugify(f.slug||f.title),title:f.title,subtitle:f.subtitle,seoTitle:f.seoTitle||f.title,seoDescription:f.seoDescription||f.intro.slice(0,150),heroImageUrl:f.heroImageUrl,intro:f.intro,sections:[{heading:f.sectionHeading,body:f.sectionBody}],ctaTitle:f.ctaTitle,ctaText:f.ctaText,ctaLabel:f.ctaLabel,ctaUrl:f.ctaUrl};runAction(()=>api("/admin/cms-pages",token,jsonBody({page,publish:false})),"CMS page draft saved.");}}><Field label="Page title" value={f.title} onChange={v=>set("title",v)} required/><Field label="URL slug" value={f.slug} onChange={v=>set("slug",slugify(v))} placeholder="about-roomo" required/><Field label="Subtitle" value={f.subtitle} onChange={v=>set("subtitle",v)}/><Field label="SEO title" value={f.seoTitle} onChange={v=>set("seoTitle",v)} required/><div className="sm:col-span-2"><TextField label="SEO description" value={f.seoDescription} onChange={v=>set("seoDescription",v)} required/></div><div className="sm:col-span-2"><TextField label="Introduction (minimum 20 characters)" value={f.intro} onChange={v=>set("intro",v)} required minLength={20}/></div><Field label="Hero image URL" value={f.heroImageUrl} onChange={v=>set("heroImageUrl",v)}/><Field label="Section heading" value={f.sectionHeading} onChange={v=>set("sectionHeading",v)} required/><div className="sm:col-span-2"><TextField label="Section content" value={f.sectionBody} onChange={v=>set("sectionBody",v)} required/></div><Field label="CTA title" value={f.ctaTitle} onChange={v=>set("ctaTitle",v)}/><Field label="CTA label" value={f.ctaLabel} onChange={v=>set("ctaLabel",v)}/><Field label="CTA text" value={f.ctaText} onChange={v=>set("ctaText",v)}/><Field label="CTA URL" value={f.ctaUrl} onChange={v=>set("ctaUrl",v)}/><div className="sm:col-span-2"><button className={buttonClass} disabled={busy}>Save page draft</button></div></form></Panel><Panel title="Existing CMS pages" description="Publish saved drafts or remove pages."><DataTable rows={pages} columns={[["Page",r=>r.draft?.title||r.slug],["URL",r=>"/pages/"+r.slug],["Status",r=>r.isPublished?"Published":"Draft"],["Updated",r=>fmtDate(r.updatedAt)]]} actions={r=><div className="flex gap-2"><button className={buttonClass} onClick={()=>runAction(()=>api("/admin/cms-pages/"+r.id+"/publish",token,{method:"POST"}),"Page published.")}>Publish</button><button className={secondaryClass} onClick={()=>runAction(()=>api("/admin/cms-pages/"+r.id,token,{method:"DELETE"}),"CMS page deleted.")}>Delete</button></div>} /></Panel></div>;
}
function DestinationManager({token,places,suggestions,load,notify,runAction,busy}) {
 const [name,setName]=useState("");
 return <div className="space-y-5"><Panel title="Approved destinations" description="Maintain canonical destinations and avoid duplicate spellings."><form className="mb-4 flex flex-col gap-3 sm:flex-row" onSubmit={e=>{e.preventDefault();runAction(()=>api("/admin/homepage/destinations",token,postBody({name})), "Destination added.");setName("");}}><input className={inputClass+" max-w-xl"} placeholder="Destination name" value={name} onChange={e=>setName(e.target.value)} required minLength={2}/><button className={buttonClass} disabled={busy}>Add destination</button></form><DataTable rows={places||[]} columns={[["Destination",r=>r.name],["Canonical ID",r=>r.id]]} actions={r=><button className={secondaryClass} onClick={()=>runAction(()=>api("/admin/homepage/destinations/"+r.id,token,{method:"DELETE"}),"Destination removed.")}>Delete</button>} /></Panel><Panel title="Pending destination suggestions" description="Approve suggestions only after checking spelling and duplicates."><DataTable rows={suggestions} columns={[["Suggestion",r=>r.name],["Submitted",r=>fmtDate(r.createdAt)],["Status",r=>r.status]]} actions={r=><div className="flex gap-2"><button className={buttonClass} onClick={()=>runAction(()=>api("/admin/homepage/destination-suggestions/"+r.id,token,jsonBody({action:"approve",name:r.name})),"Suggestion approved.")}>Approve</button><button className={secondaryClass} onClick={()=>runAction(()=>api("/admin/homepage/destination-suggestions/"+r.id,token,jsonBody({action:"reject",name:r.name})),"Suggestion rejected.")}>Reject</button></div>} /></Panel></div>;
}
function CollectionConfig({title,token,endpoint,keyName,data,load,notify,busy}) {
 const [draft,setDraft]=useState(data); const [editIndex,setEditIndex]=useState(-1);
 useEffect(()=>setDraft(data),[data]);
 const items=draft[keyName]||[];
 const set=(k,v)=>setDraft(s=>({...s,[k]:v}));
 const itemDefaults=keyName==="places"?{id:"",name:"",location:"",description:"",imageUrl:"",mapUrl:"",visible:true,sortOrder:items.length+1}:{id:"",name:"",category:"",location:"",address:"",openingHours:"",contactNumber:"",imageUrl:"",directionsUrl:"",description:"",offerTag:"",offerDetails:"",specialties:"",priceRange:"",visible:false,sortOrder:items.length+1};
 const [item,setItem]=useState(itemDefaults);
 useEffect(()=>setItem(itemDefaults),[keyName,items.length]);
 const save=async()=>{try{await api(endpoint,token,jsonBody(draft));notify(title+" saved and published.");await load();}catch(e){notify(e.message);}};
 const saveItem=()=>{if(!item.name?.trim()){notify("Enter a name first.");return;}const next=[...items];if(editIndex>=0)next[editIndex]=item;else next.push({...item,id:item.id||slugify(item.name),sortOrder:next.length+1});setDraft(s=>({...s,[keyName]:next}));setEditIndex(-1);setItem(itemDefaults);};
 const edit=(i)=>{setEditIndex(i);setItem({...items[i]});};
 const fields=keyName==="places"?[["name","Name"],["location","Location"],["description","Description"],["imageUrl","Image URL"],["mapUrl","Map URL"]]:[["name","Name"],["category","Category"],["location","Location"],["address","Address"],["openingHours","Opening hours"],["contactNumber","Contact number"],["imageUrl","Image URL"],["directionsUrl","Directions URL"],["description","Description"],["offerTag","Offer tag"],["offerDetails","Offer details"],["specialties","Specialties"],["priceRange","Price range"]];
 return <div className="space-y-5"><Panel title={title+" section settings"} description="Edit the section heading and individual cards using form fields. Changes save to the published homepage configuration."><div className="grid gap-4 sm:grid-cols-2"><Field label="Section title" value={draft.title} onChange={v=>set("title",v)} required/><Toggle label="Section enabled" checked={draft.enabled} onChange={v=>set("enabled",v)}/><div className="sm:col-span-2"><TextField label="Section description" value={draft.description} onChange={v=>set("description",v)} required/></div></div><div className="mt-5 flex justify-end"><button className={buttonClass} onClick={save} disabled={busy}>Save section</button></div></Panel><Panel title={editIndex>=0?"Edit item":"Add item"}><div className="grid gap-3 sm:grid-cols-2">{fields.map(([key,label])=><Field key={key} label={label} value={item[key]} onChange={v=>setItem(s=>({...s,[key]:v}))}/>) }<Field label="Sort order" type="number" value={item.sortOrder} onChange={v=>setItem(s=>({...s,sortOrder:Number(v)}))}/><Toggle label="Visible on homepage" checked={item.visible} onChange={v=>setItem(s=>({...s,visible:v}))}/></div><div className="mt-4 flex gap-2"><button className={buttonClass} onClick={saveItem}>{editIndex>=0?"Update item":"Add item"}</button>{editIndex>=0&&<button className={secondaryClass} onClick={()=>{setEditIndex(-1);setItem(itemDefaults);}}>Cancel</button>}</div></Panel><Panel title={keyName==="places"?"Nearby places":"Directory entries"}><DataTable rows={items} columns={[["Name",r=>r.name],["Location",r=>r.location],["Visibility",r=>r.visible?"Visible":"Hidden"],["Sort order",r=>r.sortOrder]]} actions={(_,i)=><></>} /><div className="mt-3 flex flex-wrap gap-2">{items.map((r,i)=><div key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><span>{r.name}</span><button className={secondaryClass} onClick={()=>edit(i)}>Edit</button><button className={secondaryClass} onClick={()=>setDraft(s=>({...s,[keyName]:s[keyName].filter((_,j)=>j!==i)}))}>Remove</button></div>)}</div><div className="mt-4 flex justify-end"><button className={buttonClass} onClick={save} disabled={busy}>Save all items</button></div></Panel></div>;
}
function TestimonialsManager({token,data,load,notify,busy}) {
 const [draft,setDraft]=useState(data); useEffect(()=>setDraft(data),[data]);
 const set=(k,v)=>setDraft(s=>({...s,[k]:v}));
 const updateItem=(i,k,v)=>setDraft(s=>({...s,items:s.items.map((it,j)=>i===j?{...it,[k]:v}:it)}));
 const add=()=>setDraft(s=>({...s,items:[...s.items,{id:"testimonial-"+Date.now(),quote:"",name:"",location:"",rating:5,hidden:false}]}));
 return <Panel title="Testimonials" description="Edit testimonial copy and visibility; save the draft and publish it when ready."><div className="grid gap-4 sm:grid-cols-2"><Field label="Eyebrow" value={draft.eyebrow} onChange={v=>set("eyebrow",v)} required/><Field label="Rating summary" value={draft.ratingSummary} onChange={v=>set("ratingSummary",v)} required/><Field label="Section title" value={draft.title} onChange={v=>set("title",v)} required/><div className="sm:col-span-2"><TextField label="Section description" value={draft.description} onChange={v=>set("description",v)} required/></div></div><div className="my-5 flex items-center justify-between"><h3 className="font-semibold">Reviews ({draft.items?.length||0})</h3><button className={secondaryClass} onClick={add}>Add testimonial</button></div><div className="space-y-4">{(draft.items||[]).map((it,i)=><div key={it.id} className="rounded-lg border border-slate-200 p-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Reviewer name" value={it.name} onChange={v=>updateItem(i,"name",v)} required/><Field label="Location" value={it.location} onChange={v=>updateItem(i,"location",v)}/><div className="sm:col-span-2"><TextField label="Review" value={it.quote} onChange={v=>updateItem(i,"quote",v)} required/></div><Field label="Rating (1–5)" type="number" min="1" max="5" value={it.rating} onChange={v=>updateItem(i,"rating",Number(v))}/><Toggle label="Hide this review" checked={it.hidden} onChange={v=>updateItem(i,"hidden",v)}/></div><button className={secondaryClass+" mt-3"} onClick={()=>setDraft(s=>({...s,items:s.items.filter((_,j)=>j!==i)}))}>Remove review</button></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><button className={buttonClass} disabled={busy} onClick={async()=>{try{await api("/admin/testimonials",token,jsonBody(draft));notify("Testimonials draft saved.");await load();}catch(e){notify(e.message);}}}>Save draft</button><button className={secondaryClass} disabled={busy} onClick={async()=>{try{await api("/admin/testimonials/publish",token,{method:"POST"});notify("Testimonials published.");await load();}catch(e){notify(e.message);}}}>Publish testimonials</button></div></Panel>;
}
function GalleryManager({token,items,load,notify,busy,startAdd}) {
 const [f,setF]=useState({title:"",description:"",type:"IMAGE",sourceType:"URL",mediaUrl:"",thumbnailUrl:"",status:"DRAFT",sortOrder:"0"});
 const [showForm,setShowForm]=useState(startAdd);
 const set=(k,v)=>setF(s=>({...s,[k]:v}));
 return <div className="space-y-5">{showForm&&<Panel title="Add gallery image or video" description="Add media by URL. Uploaded media can also be managed from this React page."><form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();runGalleryCreate(token,f,notify,load,setBusy,setShowForm,setF);}}><Field label="Title" value={f.title} onChange={v=>set("title",v)} required/><label className="block text-sm font-medium">Media type<select className={inputClass} value={f.type} onChange={e=>set("type",e.target.value)}><option value="IMAGE">Image</option><option value="VIDEO">Video</option></select></label><label className="block text-sm font-medium">Source<select className={inputClass} value={f.sourceType} onChange={e=>set("sourceType",e.target.value)}><option value="URL">URL</option><option value="UPLOAD">Uploaded file URL</option>{f.type==="VIDEO"&&<option value="YOUTUBE">YouTube embed</option>}</select></label><Field label="Media URL" value={f.mediaUrl} onChange={v=>set("mediaUrl",v)} type="url" required/><Field label="Thumbnail URL (optional)" value={f.thumbnailUrl} onChange={v=>set("thumbnailUrl",v)} type="url"/><Field label="Sort order" type="number" value={f.sortOrder} onChange={v=>set("sortOrder",v)}/><div className="sm:col-span-2"><TextField label="Description" value={f.description} onChange={v=>set("description",v)}/></div><div className="sm:col-span-2"><button className={buttonClass} disabled={busy}>Add media</button></div></form></Panel>}{!startAdd&&<div className="flex justify-end"><button className={buttonClass} onClick={()=>setShowForm(v=>!v)}>{showForm?"Close add form":"Add media"}</button></div>}<Panel title="Gallery library" description="Manage image and video items used by ROOMO."><DataTable rows={items} columns={[["Preview",r=>r.type==="VIDEO"?"Video":<img src={r.thumbnailUrl||r.mediaUrl} alt={r.title} className="h-12 w-16 rounded object-cover"/>],["Title",r=>r.title],["Type",r=>r.type],["Status",r=>r.status],["Updated",r=>fmtDate(r.updatedAt)]]} actions={r=><button className={secondaryClass} onClick={()=>runGalleryDelete(token,r.id,notify,load,setBusy)}>Delete</button>} /></Panel></div>;
}
async function runGalleryCreate(token,f,notify,load,setBusy,setShowForm,setF){setBusy(true);try{await api("/admin/gallery",token,postBody({...f,sortOrder:Number(f.sortOrder),thumbnailUrl:f.thumbnailUrl||null}));notify("Gallery item created.");setShowForm(false);setF({title:"",description:"",type:"IMAGE",sourceType:"URL",mediaUrl:"",thumbnailUrl:"",status:"DRAFT",sortOrder:"0"});await load();}catch(e){notify(e.message);}finally{setBusy(false);}}
async function runGalleryDelete(token,id,notify,load,setBusy){setBusy(true);try{await api("/admin/gallery/"+id,token,{method:"DELETE"});notify("Gallery item deleted.");await load();}catch(e){notify(e.message);}finally{setBusy(false);}}
function ListingDisplayEditor({token,settings,notify,busy}) {
 const [draft,setDraft]=useState(settings); useEffect(()=>setDraft(settings),[settings]);
 const set=(key,value)=>setDraft(s=>({...s,[key]:value}));
 const flags=[["showAccommodationSummary","Accommodation summary"],["showBedDetails","Bed details"],["showPaymentMessage","Payment message"],["showAvailabilityMessage","Availability message"],["showLocation","Location"],["showGuestRating","Guest rating"],["showDescription","Property description"]];
 return <Panel title="Listing display settings" description="Choose which details appear on property listing cards and manage the messages shown to guests."><div className="grid gap-3 sm:grid-cols-2">{flags.map(([key,label])=><div key={key} className="rounded-lg border border-slate-200 p-3"><Toggle label={label} checked={draft[key]} onChange={v=>set(key,v)}/></div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Payment message" value={draft.paymentMessage} onChange={v=>set("paymentMessage",v)}/><Field label="Availability message (must include {count})" value={draft.availabilityMessageTemplate} onChange={v=>set("availabilityMessageTemplate",v)}/></div><button className={buttonClass+" mt-5"} disabled={busy} onClick={async()=>{try{await api("/listing-display-settings/admin",token,jsonBody(draft));notify("Listing display settings saved.");}catch(e){notify(e.message);}}}>Save display settings</button></Panel>;
}
function FeaturedSection({token,data,load,notify,busy}) {
 const [draft,setDraft]=useState({title:data.title||"Featured Stays",description:data.description||"",rooms:data.rooms||[]});useEffect(()=>setDraft({title:data.title||"Featured Stays",description:data.description||"",rooms:data.rooms||[]}),[data]);
 const update=(k,v)=>setDraft(s=>({...s,[k]:v}));
 return <Panel title="Featured Stays section" description="Edit the section heading and featured room cards."><div className="grid gap-4 sm:grid-cols-2"><Field label="Section title" value={draft.title} onChange={v=>update("title",v)} required/><div className="sm:col-span-2"><TextField label="Section description" value={draft.description} onChange={v=>update("description",v)} required/></div></div><div className="mt-5"><h3 className="mb-3 font-semibold">Featured cards</h3><DataTable rows={draft.rooms} columns={[["Name",r=>r.name],["Type",r=>r.type],["Location",r=>r.location],["Price",r=>r.price]]} /></div><button className={buttonClass+" mt-5"} disabled={busy} onClick={async()=>{try{await api("/admin/homepage/featured-rooms",token,jsonBody(draft));notify("Featured Stays saved and published.");await load();}catch(e){notify(e.message);}}}>Save Featured Stays</button></Panel>;
}
function PilgrimGuideEditor({token,data,load,notify,busy}) {
 const [draft,setDraft]=useState(data);useEffect(()=>setDraft(data),[data]);
 const set=(k,v)=>setDraft(s=>({...s,[k]:v}));
 return <Panel title="Pilgrim Guide" description="Edit the Pilgrim Guide section title, description and cards."><div className="grid gap-4 sm:grid-cols-2"><Field label="Section title" value={draft.title} onChange={v=>set("title",v)} required/><div className="sm:col-span-2"><TextField label="Description" value={draft.description} onChange={v=>set("description",v)} required/></div></div><div className="mt-5 space-y-4">{(draft.cards||[]).map((card,i)=><div key={card.id||i} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"><Field label="Eyebrow" value={card.eyebrow} onChange={v=>set("cards",draft.cards.map((c,j)=>j===i?{...c,eyebrow:v}:c))}/><Field label="Title" value={card.title} onChange={v=>set("cards",draft.cards.map((c,j)=>j===i?{...c,title:v}:c))}/><div className="sm:col-span-2"><TextField label="Description" value={card.description} onChange={v=>set("cards",draft.cards.map((c,j)=>j===i?{...c,description:v}:c))}/></div></div>)}</div><button className={buttonClass+" mt-5"} disabled={busy} onClick={async()=>{try{await api("/admin/homepage/pilgrim-guide",token,jsonBody(draft));notify("Pilgrim Guide draft saved. Publish the homepage to make it live.");await load();}catch(e){notify(e.message);}}}>Save Pilgrim Guide</button></Panel>;
}
function HomepageFields({token,pageKey,data,load,notify,busy}) {
 const [draft,setDraft]=useState(data);useEffect(()=>setDraft(data),[data]);
 const keys=pageKey==="homepage/header"?["siteTitle","contactPhone","whatsappNumber","seoDescription"]:pageKey==="homepage/upcoming-festival"?["festivalTitle","festivalDescription","festivalDate"]:pageKey==="homepage/footer"?["footerDescription","contactPhone","whatsappNumber","seoDescription"]:["seoDescription"];
 const labels={siteTitle:"Site title",contactPhone:"Contact phone",whatsappNumber:"WhatsApp number (digits only)",seoDescription:"SEO description",festivalTitle:"Festival title",festivalDescription:"Festival description",festivalDate:"Festival date",footerDescription:"Footer description"};
 const save=async()=>{try{await api("/admin/homepage",token,jsonBody(draft));notify("Homepage draft saved. Use Publish Homepage to make it live.");await load();}catch(e){notify(e.message);}};
 return <Panel title={titleFor(pageKey)} description="Edit the corresponding homepage content fields using the React editor."><div className="grid gap-4 sm:grid-cols-2">{keys.map(k=>k.toLowerCase().includes("description")? <div key={k} className="sm:col-span-2"><TextField label={labels[k]} value={draft[k]} onChange={v=>setDraft(s=>({...s,[k]:v}))} required/></div>:<Field key={k} label={labels[k]} value={draft[k]} onChange={v=>setDraft(s=>({...s,[k]:v}))} required/>)}</div><div className="mt-5 flex flex-wrap gap-2"><button className={buttonClass} disabled={busy} onClick={save}>Save draft</button><button className={secondaryClass} disabled={busy} onClick={async()=>{if(!window.confirm("Publish the complete saved homepage draft?"))return;try{await api("/admin/homepage/publish",token,{method:"POST"});notify("Homepage published.");await load();}catch(e){notify(e.message);}}}>Publish homepage</button></div></Panel>;
}
