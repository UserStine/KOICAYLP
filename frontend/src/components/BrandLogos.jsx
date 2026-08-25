import koicaMark from "../assets/koica-mark.png";
import hallymLogo from "../assets/hallym-logo.png";
import ciatMark from "../assets/ciat-mark.png";

export default function BrandLogos({ compact = false, className = "" }) {
  return (
    <div className={`partner-logos${compact ? " compact" : ""}${className ? ` ${className}` : ""}`}
      aria-label="KOICA, Hallym University and CIAT">
      <img className="partner-logo koica-partner-logo" src={koicaMark} alt="KOICA" />
      <span className="partner-separator" aria-hidden="true" />
      <img className="partner-logo hallym-partner-logo" src={hallymLogo} alt="Hallym University" />
      <span className="partner-separator" aria-hidden="true" />
      <img className="partner-logo ciat-partner-logo" src={ciatMark} alt="CIAT KOICA Fellowship Program" />
    </div>
  );
}
