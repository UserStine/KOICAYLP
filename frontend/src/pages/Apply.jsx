import { Link } from "react-router-dom";
import { FileIcon } from "../components/Icons";
import { useT } from "../i18n";

export default function Apply() {
  const { t } = useT();
  const a = t.apply;
  const tracks = [
    { key: "public", title: a.formPublic, text: a.formPublicText, href: "/apply/public" },
    { key: "private", title: a.formPrivate, text: a.formPrivateText, href: "/apply/private" },
  ];

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{a.eyebrow}</div>
        <h1>{a.titleA}<span className="shimmer">{a.titleB}</span></h1>
        <p className="page-sub">{a.formsInstruction}</p>
      </section>
      <section className="section alt">
        <h2 className="section-title">{a.formsTitle}</h2>
        <p className="section-sub">{a.formsInstruction}</p>
        <div className="dl-grid application-track-chooser">
          {tracks.map((track) => (
            <article className="dl-card application-track-card" key={track.key}>
              <div className="dl-icon"><FileIcon /></div>
              <div className="dl-copy"><h3>{track.title}</h3><p>{track.text}</p></div>
              <Link className="application-action" to={track.href}>
                {track.key === "private" ? a.privateSector : a.publicSector}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
