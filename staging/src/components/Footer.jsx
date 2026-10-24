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
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-9 border-b border-white/15 pb-9 md:grid-cols-2 lg:grid-cols-12">
          <div className="md:col-span-1 lg:col-span-5">
            <img className="mb-3 h-auto w-44 object-contain" src={roomoLogo} alt="ROOMO Sacred" width="176" height="58" />
            <p className="mb-4 mt-3 max-w-lg text-sm leading-7 text-slate-300">{content?.footerDescription || defaults.description}</p>
            <div className="flex gap-4 text-xl">
              {links.social.map((item, i) => <SafeLink item={item} key={item.label || i}><i className={"bi " + (/^[a-z0-9-]+$/i.test(item.icon || "") ? item.icon : "bi-link-45deg")} aria-hidden="true"></i><span className="sr-only">{item.label || "Social link"}</span></SafeLink>)}
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