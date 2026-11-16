import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

let mapsPromise;
function loadGooglePlaces() {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-innzo-google-maps]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps could not be loaded.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.dataset.innzoGoogleMaps = "true";
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(GOOGLE_MAPS_KEY) + "&libraries=places&v=weekly";
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.maps?.places ? resolve(window.google) : reject(new Error("Google Places library is unavailable. Check that Places API is enabled for this key."));
    script.onerror = () => reject(new Error("Google Maps failed to load. Check the API key, billing and website restrictions."));
    document.head.appendChild(script);
  }).catch(error => { mapsPromise = null; throw error; });
  return mapsPromise;
}

export default function GooglePlacesField({ value, onChange, onPlaceSelect }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) {
      setStatus("Add VITE_GOOGLE_MAPS_API_KEY to the frontend .env file to enable live suggestions.");
      return;
    }
    let autocomplete, listener, cancelled = false;
    loadGooglePlaces().then(google => {
      if (cancelled || !inputRef.current) return;
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["address_components", "formatted_address", "geometry", "name", "url", "place_id"],
        types: ["establishment", "geocode"]
      });
      autocomplete.setComponentRestrictions({ country: ["in"] });
      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place?.geometry?.location) {
          setStatus("Choose a suggested address that includes a map location.");
          return;
        }
        const parts = {};
        (place.address_components || []).forEach(part => {
          part.types.forEach(type => { parts[type] = part.long_name; });
        });
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onPlaceSelect?.({
          address: place.formatted_address || place.name || inputRef.current.value,
          city: parts.locality || parts.postal_town || parts.administrative_area_level_2 || "",
          state: parts.administrative_area_level_1 || "",
          country: parts.country || "India",
          postalCode: parts.postal_code || "",
          mapLocation: place.url || "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng,
          latitude: lat,
          longitude: lng,
          placeId: place.place_id || ""
        });
        setStatus("Location selected successfully.");
      });
      setStatus("Start typing an address and choose a Google suggestion.");
    }).catch(error => { if (!cancelled) setStatus(error.message); });
    return () => { cancelled = true; if (listener) listener.remove(); };
  }, [onPlaceSelect]);
  return <div>
    <label className="block text-sm font-medium text-slate-700" htmlFor="innzo-google-place">Google Maps location</label>
    <input ref={inputRef} id="innzo-google-place" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" value={value || ""} onChange={event => onChange?.(event.target.value)} placeholder="Search hotel, street, area or landmark" autoComplete="off" />
    {status && <p className="mt-1.5 text-xs text-slate-500" role="status">{status}</p>}
  </div>;
}
