import PropertyListingPage from "./pages/PropertyListingPage.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import PropertyDetails from "./pages/PropertyDetails.jsx";
import HomePage from "./pages/HomePage.jsx";
import OwnerPortal from "./owner/OwnerPortal.jsx";
import SuperAdminPortal from "./admin/SuperAdminPortal.jsx";
import { CmsGuidePage, MyBookingsPage, MyProfilePage, PostPropertyPage, VerifyEmailPage } from "./pages/LegacyPages.jsx";
import CommissionManagementPage from "./pages/CommissionManagementPage.jsx";
import DriverPortal from "./pages/DriverPortal.jsx";
import TransportBookingPage from "./pages/TransportBookingPage.jsx";

const legacyRoutes = {
  "/frontend/admin/admin.html": "/admin/login",
  "/frontend/admin/dashboard.html": "/admin/dashboard",
  "/frontend/admin/enquiries.html": "/admin/enquiries",
  "/frontend/admin/owner.html": "/admin/owners",
  "/frontend/admin/rooms-listings.html": "/admin/rooms/listings",
  "/frontend/admin/room-types.html": "/admin/rooms/types",
  "/frontend/admin/room-filters.html": "/admin/rooms/filters",
  "/frontend/admin/featured-rooms.html": "/admin/rooms/featured",
  "/frontend/admin/listing-display.html": "/admin/rooms/listing-display",
  "/frontend/admin/cms-pages.html": "/admin/cms-pages",
  "/frontend/admin/destinations.html": "/admin/destinations",
  "/frontend/admin/nearby-places.html": "/admin/nearby-locations",
  "/frontend/admin/testimonials.html": "/admin/testimonials",
  "/frontend/admin/galleries.html": "/admin/gallery/list",
  "/frontend/admin/reports.html": "/admin/reports",
  "/frontend/admin/registered-users.html": "/admin/users",
  "/frontend/admin/homepage.html": "/admin/homepage/hero-banner",
  "/frontend/admin/pilgrim-guide.html": "/admin/homepage/pilgrim-guide",
  "/frontend/owner/admin.html": "/owner/login",
  "/frontend/owner/dashboard.html": "/owner/dashboard",
  "/frontend/owner/my-properties.html": "/owner/properties",
  "/frontend/owner/enquiries.html": "/owner/enquiries",
  "/frontend/owner/reports.html": "/owner/reports",
  "/frontend/owner/room-types.html": "/owner/properties",
  "/frontend/index.html": "/",
  "/frontend/admin.html": "/admin/login",
  "/frontend/owner-dashboard.html": "/owner/login",
  "/frontend/roomo-login.html": "/login",
  "/frontend/roomo-signup.html": "/signup",
  "/frontend/roomo-search-results.html": "/properties",
  "/frontend/roomo-stay-details.html": "/property-details",
  "/frontend/roomo-owner-auth.html": "/owner/login",
  "/frontend/post-property.html": "/post-property",
  "/frontend/roomo-verify-email.html": "/verify-email",
  "/frontend/roomo-my-bookings.html": "/my-bookings",
  "/frontend/roomo-admin-commissions.html": "/admin/commissions",
  "/frontend/cms-page.html": "/guides",
  "/frontend/budget-rooms-in-tiruvannamalai.html": "/guides/budget-rooms-in-tiruvannamalai",
  "/frontend/family-stays-for-girivalam.html": "/guides/family-stays-for-girivalam",
  "/frontend/hotels-near-arunachaleswarar-temple.html": "/guides/hotels-near-arunachaleswarar-temple",
  "/frontend/monthly-stays-in-tiruvannamalai.html": "/guides/monthly-stays-in-tiruvannamalai",
  "/frontend/stays-near-sri-ramanasramam.html": "/guides/stays-near-sri-ramanasramam",
  "/frontend/components/header.html": "/",
  "/frontend/components/footer.html": "/",
  "/frontend/components/favicon.html": "/",
  "/frontend/components/testimonials.html": "/",
  "/frontend/public/components/gallery.html": "/",
  "/index.html": "/",
  "/roomo-login.html": "/login",
  "/roomo-signup.html": "/signup",
  "/roomo-search-results.html": "/properties",
  "/roomo-stay-details.html": "/property-details",
  "/roomo-owner-auth.html": "/owner/login",
  "/post-property.html": "/post-property",
  "/roomo-verify-email.html": "/verify-email",
  "/roomo-my-bookings.html": "/my-bookings",
  "/roomo-admin-commissions.html": "/admin/commissions",
  "/admin.html": "/admin/login",
  "/owner-dashboard.html": "/owner/login",
  "/budget-rooms-in-tiruvannamalai.html": "/guides/budget-rooms-in-tiruvannamalai",
  "/family-stays-for-girivalam.html": "/guides/family-stays-for-girivalam",
  "/hotels-near-arunachaleswarar-temple.html": "/guides/hotels-near-arunachaleswarar-temple",
  "/monthly-stays-in-tiruvannamalai.html": "/guides/monthly-stays-in-tiruvannamalai",
  "/stays-near-sri-ramanasramam.html": "/guides/stays-near-sri-ramanasramam",
  "/cms-page.html": "/guides"
};

export default function App() {
  const rawPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const legacyPath = rawPath.replace(/^\/staging(?=\/frontend\/)/, "");
  const legacyDestination = legacyRoutes[legacyPath] || legacyRoutes[rawPath];
  if (legacyDestination) {
    const destination = legacyDestination + (window.location.search || "");
    window.location.replace(destination);
    return null;
  }
  const path = rawPath;
  if (path === "/driver" || path === "/driver/" || path === "/driver/dashboard" || path === "/driver" || path === "/driver/dashboard") return <DriverPortal />;
  if (path === "/transport-booking" || path === "/transport-booking") return <TransportBookingPage />;
  if (path === "/admin/commissions" || path === "/admin/commissions") return <CommissionManagementPage />;
  if (path === "/post-property" || path === "/post-property") return <PostPropertyPage />;
  if (path === "/verify-email" || path === "/verify-email") return <VerifyEmailPage />;
  if (path === "/my-bookings" || path === "/my-bookings") return <MyBookingsPage />;
  if (path === "/my-profile" || path === "/my-profile") return <MyProfilePage />;
  if (path === "/guides" || path === "/guides") return <CmsGuidePage />;
  if (path.startsWith("/guides/") || path.startsWith("/guides/")) return <CmsGuidePage slug={path.split("/").filter(Boolean).pop()} />;
  if (path === "/admin" || path.startsWith("/admin/") || path === "/admin" || path.startsWith("/admin/")) return <SuperAdminPortal />;
  if (path === "/owner" || path.startsWith("/owner/") || path === "/owner" || path.startsWith("/owner/")) return <OwnerPortal />;
  if (path === "/login" || path === "/login") return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink"><Header /><main className="flex-1"><AuthPage mode="login" /></main><Footer /></div>;
  if (path === "/signup" || path === "/signup") return <div className="flex min-h-screen flex-col bg-white font-sans text-roomo-ink"><Header /><main className="flex-1"><AuthPage mode="signup" /></main><Footer /></div>;

  const isPropertyDetailsPage = path === "/roomo-stay-details.html" || path === "/roomo-stay-details.html" || path === "/property-details" || path === "/property-details";
  if (isPropertyDetailsPage) return <PropertyDetails />;

  const isListingPage = path === "/properties" ||
    path === "/roomo-search-results.html" ||
    path === "/properties" ||
    path === "/roomo-search-results.html";

  if (isListingPage) return <PropertyListingPage />;

  return <HomePage />;
}
