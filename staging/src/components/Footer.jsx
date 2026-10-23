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
    { label: "Hotels Near Arunachaleswarar Temple", url: "../roomo-frontend/hotels-near-arunachaleswarar-temple.html" },
    { label: "Stays Near Sri Ramanasramam", url: "../roomo-frontend/stays-near-sri-ramanasramam.html" },
    { label: "Budget Rooms in Tiruvannamalai", url: "../roomo-frontend/budget-rooms-in-tiruvannamalai.html" },
    { label: "Family Stays for Girivalam", url: "../roomo-frontend/family-stays-for-girivalam.html" },
    { label: "Monthly Stays in Tiruvannamalai", url: "../roomo-frontend/monthly-stays-in-tiruvannamalai.html" }
  ],
  pilgrimCare: [
    { label: "Karthigai Deepam 2026 Passes", url: "../roomo-frontend/index.html#karthigaiPromo" },
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
  return <a className="roomo-footer-link" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children ?? item.label}</a>;
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
    <footer className="roomo-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-5 col-md-6">
            <img className="roomo-footer-logo" src={roomoLogo} alt="ROOMO Sacred" width="176" height="58" />
            <p className="roomo-footer-description">{content?.footerDescription || defaults.description}</p>
            <div className="roomo-footer-social">
              {links.social.map((item, i) => <SafeLink item={item} key={item.label || i}><i className={"bi " + (/^[a-z0-9-]+$/i.test(item.icon || "") ? item.icon : "bi-link-45deg")} aria-hidden="true"></i><span className="visually-hidden">{item.label || "Social link"}</span></SafeLink>)}
            </div>
          </div>
          <div className="col-lg-3 col-md-3 col-6">
            <h2 className="roomo-footer-heading">Sanctuaries</h2>
            <ul>{links.sanctuaries.map((item, i) => <li key={item.label || i}><SafeLink item={item} /></li>)}</ul>
          </div>
          <div className="col-lg-4 col-md-3 col-6">
            <h2 className="roomo-footer-heading">Pilgrim Care</h2>
            <ul>{links.pilgrimCare.map((item, i) => <li key={item.label || i}><SafeLink item={item} /></li>)}</ul>
            {visitor.visible && <div className="roomo-visitor-count"><i className="bi bi-people-fill" aria-hidden="true"></i> Visitors: {visitor.count.toLocaleString("en-IN")}</div>}
          </div>
        </div>
        <div className="roomo-footer-bottom">
          <p>© {new Date().getFullYear()} ROOMO Sacred. All rights reserved.</p>
          <nav aria-label="Legal links">{links.legal.map((item, i) => <SafeLink item={item} key={item.label || i} />)}</nav>
        </div>
      </div>
    </footer>
  );
}