import Header from "./components/Header.jsx";
import HeroBanner from "./components/HeroBanner.jsx";
import SearchSection from "./components/SearchSection.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink">
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <SearchSection />
        {/* Homepage sections will be migrated one at a time as reusable components. */}
      </main>
      <Footer />
    </div>
  );
}
