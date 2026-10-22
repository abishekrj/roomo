(() => {
  "use strict";
  const API="http://localhost:5001/api";
  const defaults={siteTitle:"ROOMO Sacred | Tiruvannamalai Heritage Stays & Temple Retreats",heroBadge:"Abode of Silence & Divine Fire (Agni Sthalam)",heroTitleLine:"Find Sacred Solace at",heroTitleAccent:"Holy Arunachala",heroDescription:"Hand-curated sanctuary stays, peaceful ashram guest rooms, and heritage havelis situated in revered proximity to Annamalaiyar Temple & Sri Ramanasramam.",heroImageUrl:"https://lh3.googleusercontent.com/aida/AEtjO1WPqpw7U-3cK3DXCWtQksdvMd_FQT7Rln8b36_TSmYoqFe_eoL-rZTeovlHRw4_W7FTImYN5QacCN-1Cz14CYXGLt86TlJglU6w9p0m_aon-hpDBhxdS8xRvjZ_UKVSjjmzDRlYBzMlKmPFnt3Xn6skMZ9EGrQA8ktbnSt1NSIYOsb58ERgJrMAl7HfibYOkZFXHDc94lf5tOduqxrlZW6NqVJjEpshssz6wkLAr39DOdQTOhry7YUfHg",pournamiItems:[{"eyebrow":"FULL MOON GIRIVALAM","title":"Walk Around Arunachala","description":"A sacred 14-km hill circuit."},{"eyebrow":"ANNAMALAIYAR TEMPLE","title":"Plan Your Darshan","description":"Visit the grand Arunachaleswarar Temple."},{"eyebrow":"SRI RAMANASRAMAM","title":"Find Quietude","description":"Pause in the ashram’s serene setting."},{"eyebrow":"ARUNACHALA HILL","title":"Sacred Hill Views","description":"Take in the presence of holy Arunachala."},{"eyebrow":"KARTHIGAI DEEPAM","title":"Plan Your Festival Stay","description":"Reserve early for the Deepam season."}],spiritualGuide:{"visible":true,"eyebrow":"Pilgrim Compendium","title":"Sacred Traditions of Tiruvannamalai","description":"Practical guidance for exploring the sacred places around Arunachala.","items":[{"eyebrow":"HOLY PRADAKSHINA","title":"14 km Girivalam Path","description":"Explore the sacred circumambulation route around Mount Arunachala.","meta":"Plan your route","icon":"bi-compass"},{"eyebrow":"SILENT SANCTUM","title":"Sri Ramanasramam & Caves","description":"Discover places for quiet reflection at the ashram and on the hill.","meta":"Explore the hill","icon":"bi-brightness-high"},{"eyebrow":"AGNI STHALAM","title":"Annamalaiyar Temple","description":"Learn about visiting the renowned temple at the foot of Arunachala.","meta":"Temple information","icon":"bi-bank2"}]},festivalTitle:"Upcoming Festival",festivalDescription:"Plan your visit to Tiruvannamalai and explore upcoming local celebrations. Check official sources for event dates and arrangements.",festivalDate:"2026-11-26T18:00:00+05:30",footerDescription:"Stay Blessed, Stay Serene. ROOMO Sacred is your devoted hospitality companion in holy Tiruvannamalai. We hand-vet every retreat to guarantee quietude, sattvic cleanliness, and authentic sacred warmth.",contactPhone:"+91 94440 00000",whatsappNumber:"919444000000",seoDescription:"Discover peaceful heritage stays, ashrams and temple-view retreats in Tiruvannamalai with ROOMO Sacred."};
  const setText=(id,value)=>{const el=document.getElementById(id);if(el&&typeof value==="string")el.textContent=value;};
  const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function renderFeaturedRooms(data){
    const title=document.getElementById("featuredSectionTitle"), description=document.getElementById("featuredSectionDescription"), track=document.getElementById("stayTrack");
    if(title&&data.featuredSectionTitle)title.textContent=data.featuredSectionTitle;
    if(description&&data.featuredSectionDescription)description.textContent=data.featuredSectionDescription;
    if(!track)return;
    const properties=Array.isArray(data.featuredProperties)?data.featuredProperties:[];
    const rooms=properties.map(p=>({
      id:p.id,name:p.title,type:p.propertyType||"Sanctuary stay",
      location:[p.city,p.state].filter(Boolean).join(", "),
      price:Number(p.nightlyPrice||0),desc:p.description||"",
      img:p.images?.[0]?.imageUrl||"",rating:Number(p.rating||0),reviews:Number(p.reviews||0),
      sortOrder:Number(p.featuredSortOrder||0)
    }));
    rooms.sort((a,b)=>a.sortOrder-b.sortOrder);
    track.innerHTML=rooms.map(room=>'<div class="popular-stay-item"><a class="sanctuary-card h-100 d-flex flex-column text-decoration-none" href="roomo-stay-details.html?stay='+encodeURIComponent(room.id)+'" aria-label="View details for '+escapeHtml(room.name)+'"><div class="sanctuary-img-holder"><img alt="'+escapeHtml(room.name)+'" src="'+escapeHtml(room.img||"")+'" loading="lazy"><div class="sanctuary-rating-tag"><i class="bi bi-star-fill text-warning me-1"></i>'+Number(room.rating||0).toFixed(1)+'</div></div><div class="p-3 d-flex flex-column flex-grow-1"><div class="text-uppercase font-cinzel small mb-1 fw-bold">'+escapeHtml(room.type||"Sanctuary stay")+'</div><h5 class="fw-bold text-dark mb-1 fs-6">'+escapeHtml(room.name)+'</h5><div class="text-muted small mb-3"><i class="bi bi-geo-alt-fill text-danger me-1"></i>'+escapeHtml(room.location)+'</div><p class="text-muted small mb-3">'+escapeHtml(room.desc)+'</p><div class="mt-auto pt-2 border-top d-flex align-items-baseline justify-content-between"><div><span class="price-sacred-blue">₹'+Number(room.price||0).toLocaleString("en-IN")+'</span><span class="text-muted small"> / night</span></div><span class="badge border py-1 px-2 small font-cinzel">View details <i class="bi bi-arrow-right"></i></span></div></div></a></div>').join("");
    const controls=document.getElementById("featuredStayControls");
    const updateControlsVisibility=()=>{
      if(!controls)return;
      const mobile=window.matchMedia("(max-width: 767.98px)").matches;
      controls.classList.toggle("d-none",rooms.length <= (mobile ? 1 : 3));
    };
    updateControlsVisibility();
    if(!window.roomoFeaturedControlsResizeBound){
      window.addEventListener("resize",()=>{
        const currentControls=document.getElementById("featuredStayControls");
        const currentTrack=document.getElementById("stayTrack");
        if(!currentControls||!currentTrack)return;
        const count=currentTrack.querySelectorAll(".popular-stay-item").length;
        const mobile=window.matchMedia("(max-width: 767.98px)").matches;
        currentControls.classList.toggle("d-none",count <= (mobile ? 1 : 3));
      });
      window.roomoFeaturedControlsResizeBound=true;
    }
    if(!rooms.length)track.innerHTML='<p class="text-muted py-4">Featured sanctuaries will appear here soon.</p>';
  }
  function applyContentOverrides(overrides){if(!overrides||typeof overrides!=="object")return;Object.entries(overrides).forEach(([selector,settings])=>{if(!settings||typeof settings!=="object")return;try{document.querySelectorAll(selector).forEach(el=>{if(typeof settings.text==="string")el.textContent=settings.text;if(typeof settings.href==="string"&&"href" in el)el.setAttribute("href",settings.href);if(typeof settings.src==="string"&&"src" in el)el.setAttribute("src",settings.src);if(typeof settings.alt==="string"&&"alt" in el)el.setAttribute("alt",settings.alt);if(typeof settings.hidden==="boolean")el.hidden=settings.hidden;});}catch(error){console.warn("Invalid ROOMO homepage selector:",selector);}});}
  function renderPournamiCarousel(items){const track=document.getElementById("pournamiVerticalTrack");const indicator=document.getElementById("pournamiSlideIndicator");if(!track)return;const list=(Array.isArray(items)&&items.length?items:defaults.pournamiItems).slice(0,5);track.innerHTML=list.map(item=>'<article class="pournami-slide"><span class="pournami-slide-eyebrow">'+escapeHtml(item.eyebrow||"POURNAMI GIRIVALAM")+'</span><strong>'+escapeHtml(item.title||"Sacred Girivalam")+'</strong><span>'+escapeHtml(item.description||"Plan your peaceful pilgrimage.")+'</span></article>').join("");let current=0;const show=index=>{current=index;track.style.transform="translateY(-"+(index*64)+"px)";if(indicator)indicator.textContent=String(index+1).padStart(2,"0")+" / "+String(list.length).padStart(2,"0");};show(0);if(window.roomoPournamiCarousel)clearInterval(window.roomoPournamiCarousel);if(list.length>1)window.roomoPournamiCarousel=setInterval(()=>show((current+1)%list.length),3600);}
  function renderSpiritualGuide(guide){const section=document.getElementById("spiritualGuide");if(!section)return;const g=guide&&typeof guide==="object"?guide:{};section.hidden=g.visible===false;const eyebrow=document.getElementById("spiritualGuideEyebrow"),title=document.getElementById("spiritualGuideTitle"),description=document.getElementById("spiritualGuideDescription"),grid=document.getElementById("spiritualGuideCards");if(eyebrow)eyebrow.textContent=g.eyebrow||"Pilgrim Compendium";if(title)title.textContent=g.title||"Sacred Traditions of Tiruvannamalai";if(description)description.textContent=g.description||"Practical guidance for exploring sacred places around Arunachala.";if(!grid)return;const items=Array.isArray(g.items)?g.items.slice(0,3):[];grid.innerHTML=items.map(item=>'<div class="col-md-4"><article class="editorial-parchment-card d-flex flex-column"><div class="d-flex align-items-center justify-content-between mb-3"><span class="font-cinzel text-uppercase small text-muted">'+escapeHtml(item.eyebrow||"Pilgrim Guide")+'</span><div class="rounded-circle d-flex align-items-center justify-content-center"><i class="bi '+escapeHtml(item.icon||"bi-compass")+'"></i></div></div><h3 class="fw-bold text-dark mb-2 font-serif-sacred">'+escapeHtml(item.title||"Pilgrim Guide")+'</h3><p class="small mb-3">'+escapeHtml(item.description||"")+'</p><div class="mt-auto pt-3 border-top"><span class="badge rounded-pill border px-2 py-1 font-cinzel">'+escapeHtml(item.meta||"Learn more")+'</span></div></article></div>').join("");if(!items.length)section.hidden=true;}
  function apply(data){const c={...defaults,...data};document.title=c.siteTitle;const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=c.seoDescription;const socialTitle=document.querySelector("[data-og-homepage-title]");if(socialTitle)socialTitle.content=c.siteTitle;const twitterTitle=document.querySelector("[data-twitter-homepage-title]");if(twitterTitle)twitterTitle.content=c.siteTitle;const socialDescription=document.querySelector("[data-og-homepage-description]");if(socialDescription)socialDescription.content=c.seoDescription;const twitterDescription=document.querySelector("[data-twitter-homepage-description]");if(twitterDescription)twitterDescription.content=c.seoDescription;setText("homeHeroBadge",c.heroBadge);setText("homeHeroTitleLine",c.heroTitleLine);setText("homeHeroTitleAccent",c.heroTitleAccent);setText("homeHeroDescription",c.heroDescription);const heroImage=document.getElementById("homeHeroImage");if(heroImage&&typeof c.heroImageUrl==="string"&&(c.heroImageUrl.startsWith("https://")||c.heroImageUrl.startsWith("http://localhost:5001/uploads/")))heroImage.src=c.heroImageUrl;renderSpiritualGuide(c.spiritualGuide||defaults.spiritualGuide);setText("homeFestivalTitle",c.festivalTitle);setText("homeFestivalDescription",c.festivalDescription);setText("homeFooterDescription",c.footerDescription);renderPournamiCarousel(c.pournamiItems);renderFeaturedRooms(c);
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a=>a.href="https://wa.me/"+c.whatsappNumber);
    const target=new Date(c.festivalDate).getTime();if(Number.isFinite(target)){const update=()=>{let s=Math.max(0,Math.floor((target-Date.now())/1000));const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);s%=60;setText("cdDays",String(d));setText("cdHours",String(h).padStart(2,"0"));setText("cdMins",String(m).padStart(2,"0"));setText("cdSecs",String(s).padStart(2,"0"));};update();if(window.roomoHomepageCountdown)clearInterval(window.roomoHomepageCountdown);window.roomoHomepageCountdown=setInterval(update,1000);}
  }
  function hidePageLoader(){const loader=document.getElementById("roomoPageLoader");if(loader)loader.classList.add("is-hidden");}
  async function loadDestinationOptions(){
    const input=document.getElementById("destinationInput");
    const list=document.getElementById("destinationSuggestions");
    if(!input||!list)return;
    const fallbackPlaces=["Annamalaiyar Temple","Sri Ramanasramam","Girivalam Path","Arunachala Hill","Skandashramam","Virupaksha Cave","Seshadri Swamigal Ashram","Yogi Ramsuratkumar Ashram","Adi Annamalai Temple","Tiruvannamalai Central Bus Stand","Tiruvannamalai Railway Station"].map(name=>({name}));
    let places=fallbackPlaces;
    const closeList=()=>{list.hidden=true;input.setAttribute("aria-expanded","false");};
    const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
    const distance=(a,b)=>{
      const left=normalize(a),right=normalize(b),row=Array.from({length:right.length+1},(_,i)=>i);
      for(let i=1;i<=left.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=right.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(left[i-1]===right[j-1]?0:1));previous=old;}}
      return row[right.length];
    };
    const findSimilar=query=>places.map(place=>{const d=distance(query,place.name),a=normalize(query),b=normalize(place.name);return {place,d,similarity:1-d/Math.max(a.length,b.length,1),sameWords:a.split(" ").sort().join(" ")===b.split(" ").sort().join(" ")};})
      .filter(item=>item.sameWords||(Math.max(normalize(query).length,normalize(item.place.name).length)>=5&&(item.d<=2||item.similarity>=.78)))
      .sort((a,b)=>b.similarity-a.similarity).slice(0,5).map(item=>item.place);
    const status=document.getElementById("destinationSuggestionNotice");
    let statusTimer=null;
    const showStatus=(message,isError=false)=>{
      if(!status)return;
      if(statusTimer)clearTimeout(statusTimer);
      statusTimer=null;
      if(!message){
        status.classList.remove("is-visible","is-hiding","is-success","is-error");
        status.hidden=true;
        status.replaceChildren();
        return;
      }
      status.textContent="";
      const icon=document.createElement("i");
      icon.className=isError?"bi bi-exclamation-circle-fill":"bi bi-check-circle-fill";
      icon.setAttribute("aria-hidden","true");
      const text=document.createElement("span");
      text.textContent=message;
      status.append(icon,text);
      status.classList.remove("is-success","is-error","is-visible","is-hiding");
      status.classList.add(isError?"is-error":"is-success","is-visible");
      status.hidden=false;
      if(!isError){
        statusTimer=setTimeout(()=>{
          status.classList.remove("is-visible");
          status.classList.add("is-hiding");
          setTimeout(()=>{status.hidden=true;status.classList.remove("is-hiding");},260);
        },4500);
      }
    };
    const sendSuggestion=async name=>{
      const button=list.querySelector("[data-suggest-new]");
      if(button)button.disabled=true;
      showStatus("Sending suggestion for admin review…");
      try{
        const response=await fetch(API+"/homepage/destination-suggestions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});
        const data=await response.json().catch(()=>({}));
        if(response.status===409&&Array.isArray(data.matches)&&data.matches.length){
          showStatus(data.message+" Select the correct existing place below.",true);
          renderList(true);
          return;
        }
        if(!response.ok)throw new Error(data.message||"Could not submit destination suggestion.");
        showStatus(data.message||"Suggestion submitted for admin review.");
        closeList();
      }catch(error){showStatus(error.message||"Could not submit destination suggestion.",true);}
      finally{if(button)button.disabled=false;}
    };
    const renderList=(keepStatus=false)=>{
      const query=input.value.trim();
      const normalized=normalize(query);
      if(!query){
        const trendingNames=["Annamalaiyar Temple","Sri Ramanasramam","Girivalam Path","Arunachala Hill","Skandashramam"];
        const trending=trendingNames.map(name=>places.find(place=>normalize(place.name)===normalize(name))).filter(Boolean);
        places.forEach(place=>{if(trending.length<5&&!trending.some(item=>normalize(item.name)===normalize(place.name)))trending.push(place);});
        const matches=trending.slice(0,5);
        list.innerHTML='<div class="destination-suggestions-heading">Trending Destinations</div>'+matches.map((place,index)=>'<button type="button" class="destination-suggestion-option" role="option" aria-selected="false" data-destination-index="'+index+'" data-place-name="'+escapeHtml(place.name)+'">'+escapeHtml(place.name)+'</button>').join("");
      }
      else{
        const direct=places.filter(place=>normalize(place.name).includes(normalized));
        const similar=findSimilar(query);
        const matches=direct.length?direct:similar;
        const unique=Array.from(new Map(matches.map(place=>[place.id||normalize(place.name),place])).values());
        list.innerHTML=unique.map((place,index)=>'<button type="button" class="destination-suggestion-option" role="option" aria-selected="false" data-destination-index="'+index+'" data-place-name="'+escapeHtml(place.name)+'">'+escapeHtml(place.name)+(similar.includes(place)&&!normalize(place.name).includes(normalized)?' <span class="small">(possible match)</span>':'')+'</button>').join("");
        const exact=places.some(place=>normalize(place.name)===normalized);
        const canSuggest=query.length>=2&&!exact&&!similar.length;
        if(canSuggest)list.innerHTML+='<button type="button" class="destination-suggestion-option destination-suggest-new" data-suggest-new="true"><i class="bi bi-plus-circle me-2" aria-hidden="true"></i>Suggest “'+escapeHtml(query)+'” as a new destination</button>';
        if(query.length>=2&&similar.length&&!direct.length)showStatus("A similar destination may already exist. Please select it to avoid duplicates.",true);
        else if(!keepStatus)showStatus("");
      }
      list.hidden=!list.children.length;
      input.setAttribute("aria-expanded",String(!list.hidden));
      list.querySelectorAll("button[data-destination-index]").forEach(button=>button.addEventListener("click",()=>{const selected=places.find(place=>place.name===button.dataset.placeName);if(selected)input.value=selected.name;else input.value=button.textContent.trim();showStatus("");closeList();input.dispatchEvent(new Event("change",{bubbles:true}));}));
      const suggestButton=list.querySelector("[data-suggest-new]");
      if(suggestButton)suggestButton.addEventListener("click",()=>sendSuggestion(query));
    };
    try{
      const response=await fetch(API+"/homepage/destinations",{cache:"no-store"});
      if(response.ok){const data=await response.json();if(Array.isArray(data.places)&&data.places.length)places=data.places.filter(place=>place&&typeof place.name==="string"&&place.name.trim()).map(place=>({id:place.id,name:place.name.trim()}));}
    }catch(error){console.warn("ROOMO destination list unavailable; using suggested destinations.",error);}
    input.addEventListener("focus",renderList);
    input.addEventListener("click",renderList);
    input.addEventListener("input",()=>{showStatus("");renderList();});
    input.addEventListener("keydown",event=>{
      const options=Array.from(list.querySelectorAll("button[data-destination-index]"));
      const active=options.indexOf(document.activeElement);
      if(event.key==="Escape"){closeList();return;}
      if(event.key==="ArrowDown"&&options.length){event.preventDefault();options[Math.min(active+1,options.length-1)].focus();}
      if(event.key==="ArrowUp"&&options.length){event.preventDefault();if(active>0)options[active-1].focus();else input.focus();}
      if(event.key==="Enter"&&!list.hidden&&options.length&&document.activeElement===input){event.preventDefault();input.value=options[0].textContent.trim();closeList();input.dispatchEvent(new Event("change",{bubbles:true}));}
    });
    document.addEventListener("click",event=>{if(!event.target.closest(".destination-suggestions")&&event.target!==input)closeList();});
  }
  document.addEventListener("DOMContentLoaded",async()=>{const destinationsPromise=loadDestinationOptions();try{const r=await fetch(API+"/homepage",{cache:"no-store"});if(r.ok){const data=await r.json();apply(data.content||defaults);await destinationsPromise;hidePageLoader();return;}}catch(error){console.warn("ROOMO homepage API unavailable; property cards will remain empty.",error);}apply({...defaults,featuredProperties:[]});await destinationsPromise;hidePageLoader();});
  window.addEventListener("pageshow",event=>{if(event.persisted)hidePageLoader();});
})();
