import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  const rows = [
    ["Shared header", "React component created", true],
    ["Shared footer", "React component created", true],
    ["Homepage", "Next step", false],
    ["Search and property pages", "Planned", false],
    ["Owner and super-admin pages", "Planned", false],
  ];
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-roomo-blue">ROOMO SACRED · REACT MIGRATION</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Staging environment</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">The React version is being built alongside the existing ROOMO website.</p>
        <div className="mt-7 flex items-start gap-3 rounded-roomo border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          <i className="bi bi-shield-check mt-0.5 text-xl" aria-hidden="true" />
          <p><strong className="font-semibold">Your live website is unchanged.</strong><br />We will migrate and verify one page at a time before switching any existing pages over.</p>
        </div>
        <h2 className="mb-2 mt-10 text-lg font-semibold">Migration progress</h2>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {rows.map(([label, status, done]) => <div key={label} className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span>{label}</span><span className={done ? "text-sm text-green-700" : "text-sm text-slate-500"}>{status}</span></div>)}
        </div>
      </main>
      <Footer />
    </div>
  );
}