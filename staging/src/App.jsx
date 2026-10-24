import Header from "./components/Header.jsx";
import HeroBanner from "./components/HeroBanner.jsx";
import SearchSection from "./components/SearchSection.jsx";
import Footer from "./components/Footer.jsx";
import FeaturedStays from "./components/FeaturedStays.jsx";
import UpcomingFestival from "./components/UpcomingFestival.jsx";
import PilgrimGuide from "./components/PilgrimGuide.jsx";
import NearbyLocations from "./components/NearbyLocations.jsx";
import Gallery from "./components/Gallery.jsx";
import ShoppingDirectory from "./components/ShoppingDirectory.jsx";
import Testimonials from "./components/Testimonials.jsx";
import PropertyListingPage from "./components/PropertyListingPage.jsx";
import AuthPage from "./components/AuthPage.jsx";
import PropertyDetails from "./components/PropertyDetails.jsx";
import OwnerPortal from "./components/OwnerPortal.jsx";
import SuperAdminPortal from "./components/SuperAdminPortal.jsx";

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin" || path.startsWith("/admin/") || path === "/staging/admin" || path.startsWith("/staging/admin/")) return <SuperAdminPortal />;
  if (path === "/owner" || path.startsWith("/owner/") || path === "/staging/owner" || path.startsWith("/staging/owner/")) return <OwnerPortal />;
  if (path === "/staging/login" || path === "/login") return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink"><Header /><main className="flex-1"><AuthPage mode="login" /></main><Footer /></div>;
  if (path === "/staging/signup" || path === "/signup") return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink"><Header /><main className="flex-1"><AuthPage mode="signup" /></main><Footer /></div>;

  const isPropertyDetailsPage = path === "/staging/roomo-stay-details.html" || path === "/roomo-stay-details.html" || path === "/staging/property-details" || path === "/property-details";
  if (isPropertyDetailsPage) return <PropertyDetails />;

  const isListingPage = path === "/staging/properties" ||
    path === "/staging/roomo-search-results.html" ||
    path === "/properties" ||
    path === "/roomo-search-results.html";

  if (isListingPage) return <PropertyListingPage />;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink">
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <SearchSection />
        <FeaturedStays />
        <UpcomingFestival />
        <PilgrimGuide />
        <NearbyLocations />
        <Gallery />
        <ShoppingDirectory />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
