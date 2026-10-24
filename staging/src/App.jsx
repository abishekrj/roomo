import Header from "./components/Header.jsx";
import HeroBanner from "./components/HeroBanner.jsx";
import SearchSection from "./components/SearchSection.jsx";
import Footer from "./components/Footer.jsx";
import FeaturedStays from "./components/FeaturedStays.jsx";
import UpcomingFestival from "./components/UpcomingFestival.jsx";
import PilgrimGuide from "./components/PilgrimGuide.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink">
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <SearchSection />
        <FeaturedStays />
        <UpcomingFestival />
        <PilgrimGuide />
        {/* Additional homepage sections will be migrated as reusable components. */}
      </main>
      <Footer />
    </div>
  );
}
