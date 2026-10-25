import Header from "../components/Header.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import SearchSection from "../components/SearchSection.jsx";
import Footer from "../components/Footer.jsx";
import FeaturedStays from "../components/FeaturedStays.jsx";
import UpcomingFestival from "../components/UpcomingFestival.jsx";
import PilgrimGuide from "../components/PilgrimGuide.jsx";
import NearbyLocations from "../components/NearbyLocations.jsx";
import Gallery from "../components/Gallery.jsx";
import ShoppingDirectory from "../components/ShoppingDirectory.jsx";
import Testimonials from "../components/Testimonials.jsx";
import TransportPromoBanner from "../components/TransportPromoBanner.jsx";

export default function HomePage() {
  return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink">
    <Header />
    <main className="flex-1">
      <HeroBanner /><SearchSection /><FeaturedStays /><UpcomingFestival /><PilgrimGuide /><NearbyLocations /><TransportPromoBanner /><Gallery /><ShoppingDirectory /><Testimonials />
    </main>
    <Footer />
  </div>;
}
