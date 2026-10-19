(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage";
  const COMPONENT = "components/testimonials.html";
  const defaults = {
    eyebrow: "Heartfelt Devotee Words",
    title: "Words from Fellow Pilgrims",
    description: "Authentic experiences shared by devotees who sought blessed shelter through ROOMO.",
    ratingSummary: "4.9 / 5 (1,840+ Pilgrims)",
    items: [
      {id:"senthil",quote:"Our Pournami Girivalam stay was profoundly peaceful. The room was immaculate, 3 minutes from Sri Ramanasramam, and our host welcomed us with sacred vibhuti and temple prasadam.",name:"Senthil Ramanathan",location:"Chennai, Tamil Nadu",rating:5,hidden:false},
      {id:"ananya",quote:"During Karthigai Deepam festival when everywhere else was charging inflated prices, ROOMO honored our confirmed heritage booking without surprise costs. Utterly safe for solo women travelers.",name:"Ananya Sharma",location:"Bengaluru, Karnataka",rating:5,hidden:false},
      {id:"michael",quote:"The open terrace had an unobstructed view of Holy Mount Arunachala for morning dhyanam. The support care team coordinated our temple darshan passes smoothly.",name:"Michael Harrison",location:"San Francisco, USA",rating:5,hidden:false},
      {id:"venkatesh",quote:"The sattvic breakfast and quiet courtyard ambiance made our family pilgrimage so memorable. Booking was effortless and check-in at midnight was greeted warmly.",name:"Venkatesh Krishnan",location:"Hyderabad, Telangana",rating:5,hidden:false}
    ]
  };
  const el = id => document.getElementById(id);
  function text(tag, className, value) { const node=document.createElement(tag); if(className) node.className=className; node.textContent=value||""; return node; }
  function render(config) {
    const c={...defaults,...(config||{})};
    if(el("testimonialEyebrowText")) el("testimonialEyebrowText").textContent=c.eyebrow||defaults.eyebrow;
    if(el("testimonialTitle")) el("testimonialTitle").textContent=c.title||defaults.title;
    if(el("testimonialDescription")) el("testimonialDescription").textContent=c.description||defaults.description;
    if(el("testimonialRatingSummary")) el("testimonialRatingSummary").textContent=c.ratingSummary||defaults.ratingSummary;
    const track=el("testimonialTrack"); if(!track)return;
    track.replaceChildren();
    (Array.isArray(c.items)?c.items:defaults.items).filter(item=>!item.hidden).forEach(item=>{
      const slide=text("div","testimonial-slide-item");
      const card=text("div","p-4 rounded-4 border bg-white h-100 d-flex flex-column shadow-sm");
      const stars=text("div","mb-2 text-warning","★".repeat(Math.max(0,Math.min(5,Number(item.rating)||5))));
      const quote=text("p","small flex-grow-1", "“"+(item.quote||"")+"”");
      const author=text("div","d-flex align-items-center gap-3 pt-3 border-top mt-2");
      const initials=(item.name||"D").trim().split(" ").filter(Boolean).slice(0,2).map(part=>part.charAt(0)).join("").toUpperCase();
      const avatar=text("div","rounded-circle d-flex align-items-center justify-content-center text-white fw-bold font-cinzel",initials);
      Object.assign(avatar.style,{width:"44px",height:"44px",flex:"0 0 44px",background:"#1e3a8a"});
      const info=text("div","");
      info.append(text("h6","fw-bold text-dark mb-0 small",item.name||"Devotee"));
      info.append(text("span","text-muted small",item.location||"ROOMO Guest"));
      author.append(avatar,info); card.append(stars,quote,author); slide.append(card); track.append(slide);
    });
    track.querySelectorAll(".testimonial-slide-item").forEach(item=>{item.style.flex="0 0 min(340px, 85vw)";});
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-testimonial-scroll]"); if(!button)return;
    const track=el("testimonialTrack"); if(track)track.scrollBy({left:Number(button.dataset.testimonialScroll)*360,behavior:"smooth"});
  });
  async function initTestimonials(){
    const placeholder=el("roomoTestimonials"); if(!placeholder)return;
    try { const response=await fetch(COMPONENT,{cache:"no-cache"}); if(!response.ok)throw new Error("Component load failed"); placeholder.outerHTML=await response.text(); }
    catch(error){console.error("ROOMO testimonials component could not load.",error);return;}
    render(defaults);
    try {const response=await fetch(API,{cache:"no-store"});if(response.ok){const data=await response.json();render(data.content?.testimonials||defaults);}}
    catch(error){console.warn("ROOMO testimonials API unavailable; using default content.",error);}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTestimonials, { once: true });
  } else {
    initTestimonials();
  }
})();