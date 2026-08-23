import peko1 from "../assets/peko-new.png";
import peko2 from "../assets/peko-loader-2.png";
import peko3 from "../assets/peko-loader-3.png";
import peko4 from "../assets/peko-loader-4.png";

const FRAMES = [peko1, peko2, peko3, peko4];

export default function PekoLoader({ label = "Loading…", compact = false }) {
  return (
    <div className={`peko-loader${compact ? " compact" : ""}`} role="status" aria-live="polite">
      <span className="peko-loader-stage" aria-hidden="true">
        {FRAMES.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`peko-loader-frame frame-${index + 1}`}
          />
        ))}
      </span>
      {!compact && <span className="peko-loader-label">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
