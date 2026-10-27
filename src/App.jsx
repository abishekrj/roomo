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
  "/frontend/index.html": "/staging",
  "/frontend/admin.html": "/staging/admin/login",
  "/frontend/owner-dashboard.html": "/staging/owner/login",
  "/frontend/roomo-login.html": "/staging/login",
  "/frontend/roomo-signup.html": "/staging/signup",
  "/frontend/roomo-search-results.html": "/staging/properties",
  "/frontend/roomo-stay-details.html": "/staging/property-details",
  "/frontend/roomo-owner-auth.html": "/staging/owner/login",
  "/frontend/post-property.html": "/staging/post-property",
  "/frontend/roomo-verify-email.html": "/staging/verify-email",
  "/frontend/roomo-my-bookings.html": "/staging/my-bookings",
  "/frontend/roomo-admin-commissions.html": "/staging/admin/commissions",
  "/frontend/cms-page.html": "/staging/guides",
  "/frontend/budget-rooms-in-tiruvannamalai.html": "/staging/guides/budget-rooms-in-tiruvannamalai",
  "/frontend/family-stays-for-girivalam.html": "/staging/guides/family-stays-for-girivalam",
  "/frontend/hotels-near-arunachaleswarar-temple.html": "/staging/guides/hotels-near-arunachaleswarar-temple",
  "/frontend/monthly-stays-in-tiruvannamalai.html": "/staging/guides/monthly-stays-in-tiruvannamalai",
  "/frontend/stays-near-sri-ramanasramam.html": "/staging/guides/stays-near-sri-ramanasramam",
  "/frontend/components/header.html": "/staging",
  "/frontend/components/footer.html": "/staging",
  "/frontend/components/favicon.html": "/staging",
  "/frontend/components/testimonials.html": "/staging",
  "/frontend/public/components/gallery.html": "/staging",
  "/index.html": "/staging",
  "/roomo-login.html": "/staging/login",
  "/roomo-signup.html": "/staging/signup",
  "/roomo-search-results.html": "/staging/properties",
  "/roomo-stay-details.html": "/staging/property-details",
  "/roomo-owner-auth.html": "/staging/owner/login",
  "/post-property.html": "/staging/post-property",
  "/roomo-verify-email.html": "/staging/verify-email",
  "/roomo-my-bookings.html": "/staging/my-bookings",
  "/roomo-admin-commissions.html": "/staging/admin/commissions",
  "/admin.html": "/staging/admin/login",
  "/owner-dashboard.html": "/staging/owner/login",
  "/budget-rooms-in-tiruvannamalai.html": "/staging/guides/budget-rooms-in-tiruvannamalai",
  "/family-stays-for-girivalam.html": "/staging/guides/family-stays-for-girivalam",
  "/hotels-near-arunachaleswarar-temple.html": "/staging/guides/hotels-near-arunachaleswarar-temple",
  "/monthly-stays-in-tiruvannamalai.html": "/staging/guides/monthly-stays-in-tiruvannamalai",
  "/stays-near-sri-ramanasramam.html": "/staging/guides/stays-near-sri-ramanasramam",
  "/cms-page.html": "/staging/guides"
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
  if (path === "/staging/driver" || path === "/staging/driver/" || path === "/staging/driver/dashboard" || path === "/driver" || path === "/driver/dashboard") return <DriverPortal />;
  if (path === "/staging/transport-booking" || path === "/transport-booking") return <TransportBookingPage />;
  if (path === "/staging/admin/commissions" || path === "/admin/commissions") return <CommissionManagementPage />;
  if (path === "/staging/post-property" || path === "/post-property") return <PostPropertyPage />;
  if (path === "/staging/verify-email" || path === "/verify-email") return <VerifyEmailPage />;
  if (path === "/staging/my-bookings" || path === "/my-bookings") return <MyBookingsPage />;
  if (path === "/staging/my-profile" || path === "/my-profile") return <MyProfilePage />;
  if (path === "/staging/guides" || path === "/guides") return <CmsGuidePage />;
  if (path.startsWith("/staging/guides/") || path.startsWith("/guides/")) return <CmsGuidePage slug={path.split("/").filter(Boolean).pop()} />;
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

  return <HomePage />;
}
