(() => {
  "use strict";
  const API="http://localhost:5001/api", TOKEN_KEY="roomoAdminToken", $=id=>document.getElementById(id);
  let token=localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY);
  const fields=["siteTitle","seoDescription","heroBadge","heroTitleLine","heroTitleAccent","heroDescription","heroImageUrl","festivalTitle","festivalDescription","festivalDate","footerDescription","contactPhone","whatsappNumber"];
  const defaultFooterLinks={social:[{label:"Facebook",url:"#",icon:"bi-facebook"},{label:"Instagram",url:"#",icon:"bi-instagram"},{label:"WhatsApp",url:"https://wa.me/919444000000",icon:"bi-whatsapp"},{label:"YouTube",url:"#",icon:"bi-youtube"}],sanctuaries:[{label:"Ashrams & Meditation Kutir",url:"index.html#popularStays"},{label:"Heritage Haveli Courtyards",url:"index.html#popularStays"},{label:"Temple Gopuram View Suites",url:"index.html#popularStays"},{label:"Girivalam Pradakshina Inns",url:"index.html#popularStays"},{label:"Sattvic Homestays",url:"index.html#popularStays"}],pilgrimCare:[{label:"Karthigai Deepam 2026 Passes",url:"index.html#karthigaiPromo"},{label:"Pournami Girivalam Calendar",url:"index.html#spiritualGuide"},{label:"Annamalaiyar Darshan Timings",url:"index.html#spiritualGuide"},{label:"Ashram Taxi & Station Pickups",url:"#"}],legal:[{label:"Pilgrim Code of Conduct",url:"#"},{label:"Privacy Terms",url:"#"},{label:"Host an Ashram or Haveli",url:"roomo-signup.html"}]};
  const footerFields={social:"footerSocial",sanctuaries:"footerSanctuaries",pilgrimCare:"footerPilgrimCare",legal:"footerLegal"};
  function linksToText(items){return (items||[]).map(item=>(item.label||"")+" | "+(item.url||"#")).join("\n");}
  function textToLinks(value,withIcon=false){return value.split("\n").map(line=>line.trim()).filter(Boolean).map((line,index)=>{const parts=line.split("|");const label=(parts.shift()||"").trim();const url=parts.join("|").trim();if(!label||!url)throw new Error("Footer links must use the format Link name | URL, with both values filled in.");return withIcon?{label,url,icon:(defaultFooterLinks.social[index]||{}).icon||"bi-link-45deg"}:{label,url};});}
  function clearAdminToken(){localStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(TOKEN_KEY);token=null;}\n  function notice(message,type="info"){const el=$("pageNotice");if(el){el.textContent=message;el.className="notice show "+type;}}
  async function request(path,options={}){let response;try{response=await fetch(API+path,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})}});}catch{throw new Error("Cannot connect to ROOMO API. Start the backend on port 5001.");}const data=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401){clearAdminToken();}const error=new Error(data.message||"Request failed.");error.status=response.status;throw error;}return data;}
  function dateForInput(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return "2026-11-26T18:00";return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
  function readForm(){const data={};fields.forEach(key=>data[key]=$(key).value.trim());const rawOverrides=$("contentOverridesJson")?.value.trim();if(rawOverrides){try{data.contentOverrides=JSON.parse(rawOverrides);}catch{throw new Error("Homepage content overrides must be valid JSON.");}if(!data.contentOverrides||Array.isArray(data.contentOverrides)||typeof data.contentOverrides!=="object")throw new Error("Homepage content overrides must be a JSON object.");}else data.contentOverrides={};const date=new Date(data.festivalDate);if(Number.isNaN(date.getTime()))throw new Error("Choose a valid festival date and time.");data.festivalDate=date.toISOString();data.footerLinks={};Object.entries(footerFields).forEach(([key,id])=>{data.footerLinks[key]=textToLinks($(id).value,key==="social");});return data;}
  function updateHeroImagePreview(){const input=$("heroImageUrl"),preview=$("heroImagePreview"),empty=$("heroImagePreviewEmpty");if(!input||!preview||!empty)return;const value=input.value.trim();let valid=false;try{const url=new URL(value);valid=url.protocol==="https:"||(url.protocol==="http:"&&url.hostname==="localhost"&&url.port==="5001");}catch{}preview.style.display="none";empty.style.display="block";preview.onerror=()=>{preview.style.display="none";empty.textContent="Could not load this image. Check the URL and access permissions.";empty.style.display="block";};preview.onload=()=>{preview.style.display="block";empty.style.display="none";};if(valid){preview.src=value;empty.textContent="Loading image preview…";}}
  function fillForm(data){const overrides=$("contentOverridesJson");if(overrides)overrides.value=JSON.stringify(data.contentOverrides||{},null,2);fields.forEach(key=>{const el=$(key);if(el)el.value=key==="festivalDate"?dateForInput(data[key]):(key==="heroImageUrl"?(data[key]||"https://lh3.googleusercontent.com/aida/AEtjO1WPqpw7U-3cK3DXCWtQksdvMd_FQT7Rln8b36_TSmYoqFe_eoL-rZTeovlHRw4_W7FTImYN5QacCN-1Cz14CYXGLt86TlJglU6w9p0m_aon-hpDBhxdS8xRvjZ_UKVSjjmzDRlYBzMlKmPFnt3Xn6skMZ9EGrQA8ktbnSt1NSIYOsb58ERgJrMAl7HfibYOkZFXHDc94lf5tOduqxrlZW6NqVJjEpshssz6wkLAr39DOdQTOhry7YUfHg"):(data[key]??""));});updateHeroImagePreview();const footer={...defaultFooterLinks,...(data.footerLinks||{})};Object.entries(footerFields).forEach(([key,id])=>{$(id).value=linksToText(footer[key]||defaultFooterLinks[key]);});}
  async function load(){const data=await request("/admin/homepage");fillForm(data.draft);const status=$("editorStatus");status.textContent=data.hasPublished?"Live homepage last published "+new Date(data.publishedAt).toLocaleString()+". You can continue editing a separate draft.":"No homepage has been published from this editor yet. Publish once to make the current draft live.";status.classList.add("show");}
  async function init(){ $("logoutButton").addEventListener("click",()=>{clearAdminToken();location.href="admin.html";});if(!token){location.replace("admin.html");return;}try{await load();}catch(error){notice(error.message,"error");if(error.status===401){clearAdminToken();setTimeout(()=>location.replace("admin.html"),900);}else if(error.status===403){notice("This account does not have administrator access. Sign in with an ADMIN account.","error");}return;}
    $("homepageForm").addEventListener("submit",async event=>{event.preventDefault();const button=$("saveDraftButton");button.disabled=true;button.textContent="Saving…";try{const data=await request("/admin/homepage",{method:"PUT",body:JSON.stringify(readForm())});notice(data.message,"success");await load();}catch(error){notice(error.message,"error");}finally{button.disabled=false;button.textContent="Save Draft";}});
    $("publishButton").addEventListener("click",async()=>{if(!confirm("Publish the saved homepage draft for all visitors?"))return;const button=$("publishButton");button.disabled=true;button.textContent="Publishing…";try{const data=await request("/admin/homepage/publish",{method:"POST"});notice(data.message,"success");await load();}catch(error){notice(error.message,"error");}finally{button.disabled=false;button.textContent="Publish Homepage";}});
    $("reloadButton").addEventListener("click",async()=>{try{await load();notice("Saved draft loaded.","success");}catch(error){notice(error.message,"error");}});
    $("heroImageUrl").addEventListener("input",updateHeroImagePreview);
    $("uploadHeroImageButton").addEventListener("click",async()=>{
      const file=$("heroImageFile").files[0];
      const status=$("heroUploadStatus");
      const button=$("uploadHeroImageButton");
      if(!file){status.textContent="Choose an image file from your computer first.";return;}
      if(file.size>8*1024*1024){status.textContent="The image must be 8 MB or smaller.";return;}
      if(!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type)){status.textContent="Choose a JPG, PNG, WebP or AVIF image.";return;}
      const formData=new FormData();
      formData.append("image",file);
      button.disabled=true;button.textContent="Uploading…";status.textContent="Uploading image…";
      try{
        const response=await fetch(API+"/admin/homepage/hero-image",{method:"POST",headers:token?{Authorization:"Bearer "+token}:{},body:formData});
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.message||"Image upload failed.");
        $("heroImageUrl").value=result.heroImageUrl;
        updateHeroImagePreview();
        status.textContent="Image uploaded. Click Save Draft, then Publish Homepage to make it live.";
        notice(result.message||"Hero image uploaded successfully.","success");
      }catch(error){status.textContent=error.message;notice(error.message,"error");}
      finally{button.disabled=false;button.textContent="Upload image";}
    });
  }
  document.addEventListener("DOMContentLoaded",init);
})();
