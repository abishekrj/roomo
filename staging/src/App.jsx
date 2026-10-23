import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <div className="roomo-staging">
      <Header />
      <main className="staging-main container py-5">
        <span className="staging-eyebrow">ROOMO SACRED · REACT MIGRATION</span>
        <h1>Staging environment</h1>
        <p className="lead">The React version is being built alongside the existing ROOMO website.</p>
        <div className="staging-note">
          <i className="bi bi-shield-check" aria-hidden="true"></i>
          <div><strong>Your live website is unchanged.</strong><br />We will migrate and verify one page at a time before switching any existing pages over.</div>
        </div>
        <h2>Migration progress</h2>
        <div className="migration-row"><span>Shared header</span><span className="migration-status">React component created</span></div>
        <div className="migration-row"><span>Shared footer</span><span className="migration-status">React component created</span></div>
        <div className="migration-row"><span>Homepage</span><span className="text-secondary">Next step</span></div>
        <div className="migration-row"><span>Search and property pages</span><span className="text-secondary">Planned</span></div>
        <div className="migration-row"><span>Owner and super-admin pages</span><span className="text-secondary">Planned</span></div>
      </main>
      <Footer />
    </div>
  );
}