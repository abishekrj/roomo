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

const legacyAdminRoutes = {
  "/frontend/admin/admin.html": "/staging/admin/login",
  "/frontend/admin/dashboard.html": "/staging/admin/dashboard",
  "/frontend/admin/enquiries.html": "/staging/admin/enquiries",
  "/frontend/admin/owner.html": "/staging/admin/owners",
  "/frontend/admin/rooms-listings.html": "/staging/admin/rooms/listings",
  "/frontend/admin/room-types.html": "/staging/admin/rooms/types",
  "/frontend/admin/room-filters.html": "/staging/admin/rooms/filters",
  "/frontend/admin/featured-rooms.html": "/staging/admin/rooms/featured",
  "/frontend/admin/listing-display.html": "/staging/admin/rooms/listing-display",
  "/frontend/admin/cms-pages.html": "/staging/admin/cms-pages",
  "/frontend/admin/destinations.html": "/staging/admin/destinations",
  "/frontend/admin/nearby-places.html": "/staging/admin/nearby-locations",
  "/frontend/admin/shops.html": "/staging/admin/shopping-directory",
  "/frontend/admin/testimonials.html": "/staging/admin/testimonials",
  "/frontend/admin/galleries.html": "/staging/admin/gallery/list",
  "/frontend/admin/reports.html": "/staging/admin/reports",
  "/frontend/admin/registered-users.html": "/staging/admin/users",
  "/frontend/admin/homepage.html": "/staging/admin/homepage/hero-banner",
  "/frontend/admin/pilgrim-guide.html": "/staging/admin/homepage/pilgrim-guide",
  "/frontend/owner/admin.html": "/staging/owner/login",
  "/frontend/owner/dashboard.html": "/staging/owner/dashboard",
  "/frontend/owner/my-properties.html": "/staging/owner/properties",
  "/frontend/owner/enquiries.html": "/staging/owner/enquiries",
  "/frontend/owner/reports.html": "/staging/owner/reports",
  "/frontend/owner/room-types.html": "/staging/owner/properties",
};

export default function App() {
  const rawPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const legacyPath = rawPath.replace(/^\/staging(?=\/frontend\/)/, "");
  const legacyDestination = legacyAdminRoutes[legacyPath];
  if (legacyDestination) {
    window.location.replace(legacyDestination);
    return null;
  }
  const path = rawPath;
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
