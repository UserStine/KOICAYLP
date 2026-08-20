import koicaLogo from "../assets/koica-logo.png";
import { useT } from "../i18n";

export default function Footer() {
  const { t } = useT();
  return (
    <footer>
      <div className="footer-brand">
        <img src={koicaLogo} alt="KOICA" />
        <span>{t.footer.brand}</span>
      </div>
      <div className="footer-links">
        {t.footer.inquiries} <a href="mailto:KOICAYLP@hallym.ac.kr">KOICAYLP@hallym.ac.kr</a> &middot;{" "}
        <a href="mailto:koicaghanaaciat@gmail.com">{t.footer.regional}</a>
      </div>
    </footer>
  );
}
