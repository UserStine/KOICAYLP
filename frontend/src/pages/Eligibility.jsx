import { Link } from "react-router-dom";
import { CheckIcon, StarIcon, PlusIcon, ChatSparkIcon, Arrow } from "../components/Icons";
import { useT } from "../i18n";

export default function Eligibility({ openChat }) {
  const { t } = useT();
  const e = t.eligibility;

  const tiers = [
    { cls: "req",  chip: e.reqChip,  chipCls: "",     note: e.reqNote,  items: e.required,  icon: <CheckIcon />, iconCls: "green" },
    { cls: "pri",  chip: e.priChip,  chipCls: "gold", note: e.priNote,  items: e.priority,  icon: <StarIcon />,  iconCls: "gold" },
    { cls: "pref", chip: e.prefChip, chipCls: "sky",  note: e.prefNote, items: e.preferred, icon: <PlusIcon />,  iconCls: "sky" },
  ];

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{e.eyebrow}</div>
        <h1>{e.titleA}<span className="shimmer">{e.titleB}</span>{e.titleC}</h1>
        <p className="page-sub">{e.sub}</p>
      </section>

      <section className="section elig-stack">
        {tiers.map((tier) => (
          <div key={tier.cls} className={`elig-card ${tier.cls}`}>
            <div className="elig-head">
              <span className={`elig-chip ${tier.chipCls}`}>{tier.chip}</span>
              <p>{tier.note}</p>
            </div>
            <ul>
              {tier.items.map((item) => (
                <li key={item}>
                  <span className={`li-icon ${tier.iconCls}`}>{tier.icon}</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="note-banner">{e.banner}</div>
      </section>

      <section className="section cta-row">
        <div className="cta-card">
          <div>
            <h3>{e.ctaTitle}</h3>
            <p>{e.ctaText}</p>
          </div>
          <div className="cta-actions">
            <button className="btn" onClick={openChat}>
              <ChatSparkIcon /> <span>{e.ctaAsk}</span>
            </button>
            <Link className="btn ghost" to="/apply"><span>{e.ctaAlt}</span> <Arrow /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
