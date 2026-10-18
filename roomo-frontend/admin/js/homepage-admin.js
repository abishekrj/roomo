(() => {
  "use strict";
  const API="http://localhost:5001/api", TOKEN_KEY="roomoAdminToken", $=id=>document.getElementById(id);
  let token=sessionStorage.getItem(TOKEN_KEY);
  const fields=["siteTitle","seoDescription","heroBadge","heroTitleLine","heroTitleAccent","heroDescription","festivalTitle","festivalDescription","festivalDate","footerDescription","contactPhone","whatsappNumber"];
  function notice(message,type="info"){const el=$("pageNotice");if(el){el.textContent=message;el.className="notice show "+type;}}
  async function request(path,options={}){let response;try{response=await fetch(API+path,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})}});}catch{throw new Error("Cannot connect to ROOMO API. Start the backend on port 5001.");}const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||"Request failed.");return data;}
  function dateForInput(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return "2026-11-26T18:00";return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
  function readForm(){const data={};fields.forEach(key=>data[key]=$(key).value.trim());const date=new Date(data.festivalDate);if(Number.isNaN(date.getTime()))throw new Error("Choose a valid festival date and time.");data.festivalDate=date.toISOString();return data;}
  function fillForm(data){fields.forEach(key=>{const el=$(key);if(el)el.value=key==="festivalDate"?dateForInput(data[key]):(data[key]??"");});}
  async function load(){const data=await request("/admin/homepage");fillForm(data.draft);const status=$("editorStatus");status.textContent=data.hasPublished?"Live homepage last published "+new Date(data.publishedAt).toLocaleString()+". You can continue editing a separate draft.":"No homepage has been published from this editor yet. Publish once to make the current draft live.";status.classList.add("show");}
  async function init(){ $("logoutButton").addEventListener("click",()=>{sessionStorage.removeItem(TOKEN_KEY);location.href="admin.html";});if(!token){location.replace("admin.html");return;}try{await load();}catch(error){notice(error.message,"error");if(/401|403|admin|token/i.test(error.message)){sessionStorage.removeItem(TOKEN_KEY);setTimeout(()=>location.replace("admin.html"),900);}return;}
    $("homepageForm").addEventListener("submit",async event=>{event.preventDefault();const button=$("saveDraftButton");button.disabled=true;button.textContent="Saving…";try{const data=await request("/admin/homepage",{method:"PUT",body:JSON.stringify(readForm())});notice(data.message,"success");await load();}catch(error){notice(error.message,"error");}finally{button.disabled=false;button.textContent="Save Draft";}});
    $("publishButton").addEventListener("click",async()=>{if(!confirm("Publish the saved homepage draft for all visitors?"))return;const button=$("publishButton");button.disabled=true;button.textContent="Publishing…";try{const data=await request("/admin/homepage/publish",{method:"POST"});notice(data.message,"success");await load();}catch(error){notice(error.message,"error");}finally{button.disabled=false;button.textContent="Publish Homepage";}});
    $("reloadButton").addEventListener("click",async()=>{try{await load();notice("Saved draft loaded.","success");}catch(error){notice(error.message,"error");}});
  }
  document.addEventListener("DOMContentLoaded",init);
})();
