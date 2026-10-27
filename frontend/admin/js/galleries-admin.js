(() => {
  "use strict";
  const API = "http://localhost:5001/api";
  const TOKEN_KEY = "roomoAdminToken";
  const $ = id => document.getElementById(id);
  const state = { items: [], type: "IMAGE", uploadedUrl: "", uploadedType: "" };
  const token = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  function syncGalleryView() {
    const section = window.location.hash === "#add-gallery" ? "add-gallery" : "gallery-list";
    $("add-gallery").classList.toggle("hidden", section !== "add-gallery");
    $("gallery-list").classList.toggle("hidden", section !== "gallery-list");
    const menu = $("galleryMenu"); if (menu) menu.open = true;
    document.querySelectorAll("#galleryMenu [data-gallery-view]").forEach(link => link.classList.toggle("active", link.getAttribute("href").endsWith("#" + section)));
  }
  function notice(message, type="info") { const el=$("pageNotice"); el.textContent=message; el.className="notice show "+type; }
  async function request(path, options={}) {
    const headers={...(token()?{Authorization:"Bearer "+token()}:{}),...(options.body && !(options.body instanceof FormData)?{"Content-Type":"application/json"}:{})};
    const response=await fetch(API+path,{...options,headers});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) { if(response.status===401||response.status===403) { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } throw new Error(data.message||"Request failed ("+response.status+")."); }
    return data;
  }
  function youtubeId(value) {
    try { const u=new URL(value); if(u.hostname.includes("youtu.be")) return u.pathname.split("/").filter(Boolean)[0]||""; if(u.hostname.includes("youtube.com")) return u.searchParams.get("v")||((u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)||[])[1]||""); } catch(_) {}
    return "";
  }
  function normalizeYoutube(value) { const id=youtubeId(value); return id ? "https://www.youtube.com/embed/"+encodeURIComponent(id) : value.trim(); }
  function updateFields() {
    const type=$("mediaType").value, source=$("sourceType").value;
    if(type==="IMAGE" && source==="YOUTUBE") $("sourceType").value="URL";
    const selected=$("sourceType").value;
    $("uploadField").classList.toggle("hidden",selected!=="UPLOAD");
    $("urlField").classList.toggle("hidden",selected==="UPLOAD");
    $("thumbnailField").classList.toggle("hidden",type!=="VIDEO");
    $("mediaUrlLabel").textContent=selected==="YOUTUBE"?"YouTube URL":"Media URL";
    $("urlHelp").textContent=selected==="YOUTUBE"?"Paste a YouTube watch, share, or embed URL.":"Paste a publicly accessible direct "+(type==="IMAGE"?"image":"video")+" URL.";
    $("uploadHelp").textContent=type==="VIDEO"?"MP4, WebM, OGG or MOV · maximum 100 MB.":"JPG, PNG, WebP or AVIF · maximum 8 MB.";
    $("mediaFile").accept=type==="VIDEO"?"video/mp4,video/webm,video/ogg,video/quicktime":"image/jpeg,image/png,image/webp,image/avif";
    if(state.uploadedType && state.uploadedType!==type) { state.uploadedUrl="";state.uploadedType=""; }
    $("mediaPreview").classList.add("hidden");
  }
  async function uploadSelectedFile() {
    const file=$("mediaFile").files[0], type=$("mediaType").value;
    if(!file) throw new Error("Choose an image file before saving, or switch to Direct URL.");
    const max=type==="VIDEO"?100*1024*1024:8*1024*1024;
    if(file.size>max) throw new Error("This file is too large. Maximum size is "+(type==="VIDEO"?"100 MB":"8 MB")+".");
    const form=new FormData(); form.append("file",file);
    const data=await request("/admin/gallery/upload?type="+type.toLowerCase(),{method:"POST",body:form});
    if(!data.mediaUrl) throw new Error("The upload finished, but the server did not return a media URL. Please try again.");
    state.uploadedUrl=data.mediaUrl;state.uploadedType=type;$("mediaUrl").value=data.mediaUrl;
    $("mediaPreview").src=type==="IMAGE"?data.mediaUrl:URL.createObjectURL(file);$("mediaPreview").classList.remove("hidden");
    return data.mediaUrl;
  }
  async function uploadFile() {
    const button=$("uploadMediaButton"); button.disabled=true; button.textContent="Uploading…";
    try {
      await uploadSelectedFile();
      notice("Upload complete. Save the gallery item to keep it in the library.","success");
    } catch(error) { notice(error.message,"error"); }
    finally { button.disabled=false;button.textContent="Upload selected file"; }
  }
  function previewFor(item) {
    if(item.thumbnailUrl) return item.thumbnailUrl;
    if(item.type==="IMAGE") return item.mediaUrl;
    if(item.sourceType==="YOUTUBE") { const id=youtubeId(item.mediaUrl); return id?"https://img.youtube.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg":""; }
    return "";
  }
  function renderList() {
    const list=$("galleryAdminList"), items=state.items.filter(item=>item.type===state.type);
    $("galleryItemCount").textContent=state.items.length+" total item"+(state.items.length===1?"":"s");
    list.innerHTML="";
    if(!items.length) { list.innerHTML='<div class="empty-state" style="grid-column:1/-1">No '+(state.type==="IMAGE"?"images":"videos")+' yet. Add the first one using the form above.</div>';return; }
    items.forEach(item=>{
      const card=document.createElement("article");card.className="gallery-admin-card";
      const thumb=previewFor(item);
      const statusColor=item.status==="PUBLISHED"?"status-published":item.status==="ARCHIVED"?"status-archived":"status-draft";
      card.innerHTML='<div class="gallery-admin-thumb">'+(thumb?'<img loading="lazy" src="'+escapeHtml(thumb)+'" alt="'+escapeHtml(item.title)+'">':'<i class="bi bi-play-circle"></i>')+'</div><div class="gallery-admin-card-body"><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.description||"No description added.")+'</p><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><span class="status '+statusColor+'">'+escapeHtml(item.status)+'</span><span class="muted small">'+escapeHtml(item.sourceType)+'</span></div><div class="gallery-admin-actions"><button type="button" class="button button-secondary" data-action="edit">Edit</button><button type="button" class="button button-secondary" data-action="toggle">'+(item.status==="PUBLISHED"?"Unpublish":"Publish")+'</button><button type="button" class="button button-secondary" data-action="delete">Delete</button></div></div>';
      card.querySelector('[data-action="edit"]').addEventListener("click",()=>editItem(item));
      card.querySelector('[data-action="toggle"]').addEventListener("click",()=>toggleStatus(item));
      card.querySelector('[data-action="delete"]').addEventListener("click",()=>deleteItem(item));
      list.appendChild(card);
    });
  }
  async function load() { try { const data=await request("/admin/gallery");state.items=data.items||[];renderList(); } catch(error) { notice(error.message,"error");$("galleryAdminList").innerHTML='<p class="muted">Unable to load the gallery. Make sure you are signed in as an administrator and the backend is running.</p>'; } }
  function resetForm() {
    $("galleryForm").reset();$("editingId").value="";state.uploadedUrl="";state.uploadedType="";
    $("formHeading").textContent="Add gallery media";$("saveMediaButton").textContent="Save gallery item";$("cancelEditButton").classList.add("hidden");$("sortOrder").value="0";$("mediaStatus").value="DRAFT";$("mediaPreview").classList.add("hidden");updateFields();
  }
  function editItem(item) {
    $("editingId").value=item.id;$("mediaType").value=item.type;$("sourceType").value=item.sourceType;$("mediaTitle").value=item.title;$("mediaDescription").value=item.description||"";$("mediaUrl").value=item.mediaUrl;$("thumbnailUrl").value=item.thumbnailUrl||"";$("mediaStatus").value=item.status;$("sortOrder").value=item.sortOrder||0;
    state.uploadedUrl=item.sourceType==="UPLOAD"?item.mediaUrl:"";state.uploadedType=item.type;
    $("formHeading").textContent="Edit gallery media";$("saveMediaButton").textContent="Update gallery item";$("cancelEditButton").classList.remove("hidden");updateFields();
    const preview=previewFor(item);if(preview){$("mediaPreview").src=preview;$("mediaPreview").classList.remove("hidden");}
    window.location.hash = "add-gallery";syncGalleryView();
    window.scrollTo({top:$("galleryForm").getBoundingClientRect().top+window.scrollY-30,behavior:"smooth"});
  }
  async function save(event) {
    event.preventDefault();
    const type=$("mediaType").value, sourceType=$("sourceType").value;
    let mediaUrl=sourceType==="UPLOAD"?(state.uploadedUrl||$("mediaUrl").value.trim()):$("mediaUrl").value.trim();
    if(sourceType==="UPLOAD" && (!mediaUrl || state.uploadedType!==type)) {
      const selectedFile=$("mediaFile").files[0];
      if(!selectedFile) return notice("Choose an image file first. You can then click Upload selected file or Save gallery item to upload it automatically.","error");
      const button=$("saveMediaButton"); button.disabled=true; button.textContent="Uploading and saving…";
      try { mediaUrl=await uploadSelectedFile(); }
      catch(error) { notice(error.message,"error"); return; }
      finally { button.disabled=false; button.textContent=$("editingId").value?"Update gallery item":"Save gallery item"; }
    }
    if(sourceType==="YOUTUBE") { mediaUrl=normalizeYoutube(mediaUrl); if(!/youtube(?:-nocookie)?\.com\/embed\//i.test(mediaUrl)) return notice("Enter a valid YouTube URL.","error"); }
    const payload={title:$("mediaTitle").value.trim(),description:$("mediaDescription").value.trim(),type,sourceType,mediaUrl,thumbnailUrl:$("thumbnailUrl").value.trim()||null,status:$("mediaStatus").value,sortOrder:Number($("sortOrder").value)||0};
    const id=$("editingId").value;
    try { const data=await request(id?"/admin/gallery/"+encodeURIComponent(id):"/admin/gallery",{method:id?"PUT":"POST",body:JSON.stringify(payload)});notice(data.message||"Gallery item saved.","success");resetForm();window.location.hash="gallery-list";syncGalleryView();await load(); }
    catch(error) { notice(error.message,"error"); }
  }
  async function toggleStatus(item) {
    const status=item.status==="PUBLISHED"?"DRAFT":"PUBLISHED";
    try { const data=await request("/admin/gallery/"+encodeURIComponent(item.id),{method:"PUT",body:JSON.stringify({...item,status})});notice(data.message||"Gallery status updated.","success");await load(); }
    catch(error) { notice(error.message,"error"); }
  }
  async function deleteItem(item) {
    if(!window.confirm('Delete "'+item.title+'" from Galleries? This cannot be undone.')) return;
    try { const data=await request("/admin/gallery/"+encodeURIComponent(item.id),{method:"DELETE"});notice(data.message||"Gallery item deleted.","success");if($("editingId").value===item.id)resetForm();await load(); }
    catch(error) { notice(error.message,"error"); }
  }
  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll("#galleryMenu .sidebar-sublink").forEach(link=>link.dataset.galleryView="true");
    window.addEventListener("hashchange",syncGalleryView);syncGalleryView();
    $("mediaType").addEventListener("change",updateFields);$("sourceType").addEventListener("change",updateFields);
    $("uploadMediaButton").addEventListener("click",uploadFile);$("galleryForm").addEventListener("submit",save);$("cancelEditButton").addEventListener("click",resetForm);
    document.querySelectorAll("[data-admin-type]").forEach(button=>button.addEventListener("click",()=>{state.type=button.dataset.adminType;document.querySelectorAll("[data-admin-type]").forEach(b=>b.classList.toggle("active",b===button));renderList();}));
    $("logoutButton").addEventListener("click",()=>{localStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(TOKEN_KEY);window.location.href="admin.html";});
    updateFields();load();
  });
})();