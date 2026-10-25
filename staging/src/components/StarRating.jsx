import { useId } from "react";

const STAR_PATH = "M12 2.5l2.93 5.94 6.56.95-4.75 4.63 1.12 6.53L12 17.47l-5.86 3.08 1.12-6.53L2.5 9.39l6.57-.95L12 2.5z";

function StarGlyph({ fill = 0, size = 16, id }) {
  const generatedId = useId().replace(/:/g, "");
  const clipId = id || generatedId;
  const ratio = Math.max(0, Math.min(1, Number(fill) || 0));
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className="block shrink-0" focusable="false">
    <defs><clipPath id={clipId}><rect x="0" y="0" width={24 * ratio} height="24" /></clipPath></defs>
    <path d={STAR_PATH} fill="#e2e8f0" />
    <path d={STAR_PATH} fill="#f59e0b" clipPath={`url(#${clipId})`} />
  </svg>;
}

export function StarRatingDisplay({ value, count, size = 13, className = "" }) {
  const rating = Number(value);
  if (value == null || value === "" || !Number.isFinite(rating) || rating <= 0) return null;
  const safeRating = Math.max(0, Math.min(5, rating));
  const uid = useId().replace(/:/g, "");
  return <span className={`inline-flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium text-slate-700 ${className}`} aria-label={`${safeRating.toFixed(1)} out of 5 stars${Number(count) > 0 ? `, ${count} reviews` : ""}`}>
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">{[0,1,2,3,4].map(index => <StarGlyph key={index} id={`${uid}-display-${index}`} fill={Math.max(0, Math.min(1, safeRating - index))} size={size} />)}</span>
    <span className="font-semibold tabular-nums">{safeRating.toFixed(1)}</span>
    {Number(count) > 0 && <span className="font-normal text-slate-500">({Number(count)} {Number(count) === 1 ? "review" : "reviews"})</span>}
  </span>;
}

export function StarRatingPicker({ value, onChange, disabled = false }) {
  const uid = useId().replace(/:/g, "");
  return <div className="flex items-center gap-1" role="group" aria-label="Choose a rating from 0.5 to 5 stars">
    {[0,1,2,3,4].map(index => {
      const fill = Math.max(0, Math.min(1, Number(value) - index));
      return <span key={index} className="relative inline-flex h-8 w-8 items-center justify-center">
        <StarGlyph id={`${uid}-picker-${index}`} fill={fill} size={25} />
        <button type="button" disabled={disabled} onClick={() => onChange(index + 0.5)} aria-label={`${index + 0.5} stars`} aria-pressed={Number(value) === index + 0.5} className="absolute inset-y-0 left-0 z-10 w-1/2 rounded-l-sm border-0 bg-transparent p-0 outline-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed" />
        <button type="button" disabled={disabled} onClick={() => onChange(index + 1)} aria-label={`${index + 1} stars`} aria-pressed={Number(value) === index + 1} className="absolute inset-y-0 right-0 z-10 w-1/2 rounded-r-sm border-0 bg-transparent p-0 outline-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed" />
      </span>;
    })}
  </div>;
}
