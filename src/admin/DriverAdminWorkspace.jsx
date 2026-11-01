import { useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport/admin";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";
const primaryButton = "inline-flex items-center justify-center rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-50";
const secondaryButton = "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const emptyDriver = { fullName: "", email: "", phoneNumber: "", password: "", licenseNumber: "", vehicleType: "CAR", vehicleMake: "", vehicleModel: "", vehicleNumber: "", passengerCapacity: "4", serviceAreas: "Tiruvannamalai", notes: "", isActive: true, isAvailable: true };
function csrfHeaders() { const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf=")); return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {}; }
async function request(path, options = {}) {
  const response = await fetch(API + path, { ...options, credentials: "include", headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: "Bearer " + (sessionStorage.getItem("roomo_admin_token") || ""), ...csrfHeaders(), ...(options.headers || {}) }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}
function formatDate(value) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function whatsappUrl(phone, booking) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const message = `ROOMO trip ${booking.bookingCode}\nPickup: ${booking.pickupLocation}\nDestination: ${booking.dropoffLocation}\nJourney: ${formatDate(booking.travelAt)}\nPlease open the Driver Portal to review and respond.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
