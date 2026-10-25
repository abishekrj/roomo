import { useEffect, useState } from "react";
import roomoLogo from "../../../roomo-frontend/assets/roomo-logo.png";

const API = "http://localhost:5001/api/homepage";
const defaults = {
  description: "Stay Blessed, Stay Serene. ROOMO Sacred is your devoted hospitality companion in holy Tiruvannamalai.",
  social: [
    { label: "Facebook", url: "#", icon: "bi-facebook" },
    { label: "Instagram", url: "#", icon: "bi-instagram" },
    { label: "WhatsApp", url: "https://wa.me/919444000000", icon: "bi-whatsapp" },
    { label: "YouTube", url: "#", icon: "bi-youtube" }
  ],
  sanctuaries: [
    { label: "Hotels Near Arunachaleswarar Temple", url: "/staging/guides/hotels-near-arunachaleswarar-temple" },
    { label: "Stays Near Sri Ramanasramam", url: "/staging/guides/stays-near-sri-ramanasramam" },
    { label: "Budget Rooms in Tiruvannamalai", url: "/staging/guides/budget-rooms-in-tiruvannamalai" },
    { label: "Family Stays for Girivalam", url: "/staging/guides/family-stays-for-girivalam" },
    { label: "Monthly Stays in Tiruvannamalai", url: "/staging/guides/monthly-stays-in-tiruvannamalai" }
  ],
  pilgrimCare: [
    { label: "Karthigai Deepam 2026 Passes", url: "/staging#upcomingFestival" },
    { label: "Pournami Girivalam Calendar", url: "../roomo-frontend/index.html#spiritualGuide" },
    { label: "Annamalaiyar Darshan Timings", url: "../roomo-frontend/index.html#spiritualGuide" },
    { label: "Ashram Taxi & Station Pickups", url: "#" }
  ],
  legal: [
    { label: "Pilgrim Code of Conduct", url: "#" },
    { label: "Privacy Terms", url: "#" },
    { label: "Host an Ashram or Haveli", url: "../roomo-frontend/roomo-signup.html" }
  ]
};

function socialHoverClass(item) {
  const value = String(item?.icon || item?.label || "").toLowerCase().replace(/^bi-/, "");
  if (value.includes("facebook")) return "hover:bg-[#1877F2]";
  if (value.includes("instagram")) return "hover:bg-[#E4405F]";
  if (value.includes("whatsapp")) return "hover:bg-[#25D366]";
  if (value.includes("youtube")) return "hover:bg-[#FF0000]";
  if (value === "x" || value.includes("twitter")) return "hover:bg-black";
  if (value.includes("linkedin")) return "hover:bg-[#0A66C2]";
  return "hover:bg-[#2563a6]";
}

function SocialIcon({ name }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const key = String(name || "").toLowerCase().replace(/^bi-/, "").replace(/[^a-z0-9]/g, "");
  if (key.includes("facebook")) return <svg {...common} fill="currentColor" stroke="none"><path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13H10v8z"/></svg>;
  if (key.includes("instagram")) return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.7" r=".8" fill="currentColor" stroke="none"/></svg>;
  if (key.includes("whatsapp")) return <svg {...common}><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-4.8a8.2 8.2 0 1 1 16-3.5Z"/><path d="M8.5 8.2c.3-.6.6-.6 1-.6h.4c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4 0 .6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .4-.2 1-.6 1.3-.5.5-1.3.8-2 .6-1.1-.2-2.5-.9-3.7-2-1.3-1.2-2.2-2.7-2.4-3.8-.1-.7.1-1.4.5-1.9Z"/></svg>;
  if (key.includes("youtube")) return <svg {...common} fill="currentColor" stroke="none"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.5 15.5v-7l6 3.5z"/></svg>;
  if (key === "x" || key.includes("twitter")) return <svg {...common} fill="currentColor" stroke="none"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.9 5.8 22H2.6l7.3-8.4L1.8 2h6.5l4.5 6.6zm-1.1 18h1.7L7.3 3.9H5.5z"/></svg>;
  if (key.includes("linkedin")) return <svg {...common} fill="currentColor" stroke="none"><path d="M5.2 8.5H2V22h3.2zM3.6 2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8M22 13.8c0-4.1-2.2-6-5.1-6a4.4 4.4 0 0 0-4 2.2V8.5H9.7V22h3.2v-7.1c0-1.9.4-3.7 2.7-3.7s2.4 2.1 2.4 3.8V22H22z"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
}

function SafeLink({ item, children }) {
  const href = /^javascript:/i.test(String(item.url || "")) ? "#" : item.url || "#";
  const external = /^https?:\/\//i.test(href) && !href.startsWith(window.location.origin);
  return <a className="text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children ?? item.label}</a>;
}

export default function Footer() {
  const [content, setContent] = useState(null);
  const [visitor, setVisitor] = useState({ visible: false, count: 0 });

  useEffect(() => {
    let cancelled = false;
    fetch(API, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => {
      if (!cancelled && data?.content) setContent(data.content);
    }).catch(() => {});
    const counted = sessionStorage.getItem("roomoVisitorCounted") === "1";
    fetch(API + (counted ? "/visitor-count" : "/visitor-count/visit"), {
      method: counted ? "GET" : "POST", cache: "no-store"
    }).then(r => r.ok ? r.json() : null).then(stats => {
      if (cancelled || !stats) return;
      if (!counted) sessionStorage.setItem("roomoVisitorCounted", "1");
      setVisitor({ visible: stats.visible !== false, count: Number(stats.count || 0) });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const saved = content?.footerLinks || {};
  const links = {
    social: saved.social || defaults.social,
    sanctuaries: defaults.sanctuaries,
    pilgrimCare: saved.pilgrimCare || defaults.pilgrimCare,
    legal: saved.legal || defaults.legal
  };

  return (
    <footer className="mt-auto bg-[#17232d] pb-6 pt-11 text-white sm:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-9 border-b border-white/15 pb-9 md:grid-cols-2 lg:grid-cols-12">
          <div className="md:col-span-1 lg:col-span-5">
            <img className="mb-3 h-auto w-44 object-contain" src={roomoLogo} alt="ROOMO Sacred" width="176" height="58" />
            <p className="mb-4 mt-3 max-w-lg text-sm leading-7 text-slate-300">{content?.footerDescription || defaults.description}</p>
            <div className="flex gap-4 text-xl">
              {links.social.filter(item => item && item.label).map((item, i) => <SafeLink item={item} key={item.label || i}><span className={"inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-slate-200 transition-colors duration-200 hover:border-transparent hover:text-white " + socialHoverClass(item)}><SocialIcon name={item.icon || item.label} /></span><span className="sr-only">{item.label || "Social link"}</span></SafeLink>)}
            </div>
          </div>
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-roomo-gold">Sanctuaries</h2>
            <ul className="space-y-3">{links.sanctuaries.map((item, i) => <li key={item.label || i}><SafeLink item={item} /></li>)}</ul>
          </div>
          <div className="lg:col-span-4">
            <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-roomo-gold">Pilgrim Care</h2>
            <ul>{links.pilgrimCare.map((item, i) => <li key={item.label || i}><SafeLink item={item} /></li>)}</ul>
            {visitor.visible && <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-500 px-4 py-2 text-sm"><i className="bi bi-people-fill" aria-hidden="true"></i> Visitors: {visitor.count.toLocaleString("en-IN")}</div>}
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-gray-700 mt-8 pt-5 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ROOMO Sacred. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal links">{links.legal.map((item, i) => <SafeLink item={item} key={item.label || i} />)}</nav>
        </div>
      </div>
    </footer>
  );
}