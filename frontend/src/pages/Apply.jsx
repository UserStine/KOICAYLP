import { useEffect, useRef, useState } from "react";
import { FileIcon, DownloadIcon, MailIcon } from "../components/Icons";
import { useT } from "../i18n";
import { API } from "../auth/AuthContext";

const CLOSED_STATUS = {
  open: false,
  message: "Applications are currently closed.",
  closeAt: null,
  forms: { public: "", private: "" },
};

const EMPTY_SUBMISSION = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  organization: "",
  file: null,
};

function ActionButton({ href, disabled, children, secondary = false, onClick }) {
  const className = ["application-action", secondary ? "secondary" : "", disabled ? "disabled" : ""]
    .filter(Boolean)
    .join(" ");

  if (onClick) {
    return (
      <button type="button" className={className} disabled={disabled} onClick={onClick}>
        {children}
      </button>
    );
  }

  if (disabled || !href) {
    return <button type="button" className={className} disabled>{children}</button>;
  }

  const resolvedHref = href.startsWith("/api/") ? `${API}${href}` : href;
  return <a className={className} href={resolvedHref} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function Apply() {
  const { t } = useT();
  const a = t.apply;
  const [applicationStatus, setApplicationStatus] = useState(CLOSED_STATUS);
  const [selectedTrack, setSelectedTrack] = useState("public");
  const [submission, setSubmission] = useState(EMPTY_SUBMISSION);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const submissionRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadApplicationStatus() {
      try {
        const response = await fetch(`${API}/api/application-status`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (!response.ok) throw new Error("Application status unavailable");
        const data = await response.json();
        setApplicationStatus({
          ...CLOSED_STATUS,
          ...data,
          forms: { ...CLOSED_STATUS.forms, ...(data.forms || {}) },
        });
      } catch (error) {
        if (error.name !== "AbortError") setApplicationStatus(CLOSED_STATUS);
      }
    }
    loadApplicationStatus();
    return () => controller.abort();
  }, []);

  const closed = !applicationStatus.open;

  const steps = [
    { n: 1, title: a.step1Title, body: <><p>{a.step1Intro}</p><ul className="doc-list">{a.docs.map((document) => <li key={document}><FileIcon />{document}</li>)}</ul></> },
    { n: 2, title: a.step2Title, body: <><p>{a.step2Intro}</p><ul className="doc-list"><li><MailIcon />{a.step2Rule1}</li><li><FileIcon />{a.step2Rule2}</li></ul></> },
    { n: 3, title: a.step3Title, body: <p>{a.step3Body}</p> },
    { n: 4, title: a.step4Title, body: <><p>{a.step4Body}</p><div className="warn-box">{a.step4Warn}</div></> },
    { n: 5, title: a.step5Title, body: <p>{a.step5Body}</p> },
  ];

  const tracks = [
    { key: "public", title: a.formPublic, text: a.formPublicText, submitLabel: "Submit Public Sector Application" },
    { key: "private", title: a.formPrivate, text: a.formPrivateText, submitLabel: "Submit Private Sector Application" },
  ];

  function openSubmission(track) {
    setSelectedTrack(track);
    setSubmitError("");
    setSubmitSuccess(null);
    setTimeout(() => submissionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function updateField(name, value) {
    setSubmission((current) => ({ ...current, [name]: value }));
  }

  async function submitApplication(event) {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess(null);

    if (closed) return setSubmitError("Applications are currently closed.");
    if (!submission.file) return setSubmitError("Choose your completed application document.");

    const extension = submission.file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension)) return setSubmitError("Completed applications must be PDF, DOC, or DOCX files.");
    if (submission.file.size > 10 * 1024 * 1024) return setSubmitError("Completed applications must be 10 MB or smaller.");

    setSubmitBusy(true);
    try {
      const dataUrl = await fileToDataUrl(submission.file);
      const response = await fetch(`${API}/api/applications/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track: selectedTrack,
          fullName: submission.fullName,
          email: submission.email,
          phone: submission.phone,
          country: submission.country,
          organization: submission.organization,
          file: {
            name: submission.file.name,
            mime: submission.file.type || "application/octet-stream",
            dataUrl,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not submit your application.");
      setSubmitSuccess({ reference: payload.reference, message: payload.message || "Application submitted successfully." });
      setSubmission(EMPTY_SUBMISSION);
      const input = document.getElementById("completed-application-file");
      if (input) input.value = "";
    } catch (error) {
      setSubmitError(error.message || "We could not submit your application.");
    } finally {
      setSubmitBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{a.eyebrow}</div>
        <h1>{a.titleA}<span className="shimmer">{a.titleB}</span></h1>
        <p className="page-sub">{a.sub}</p>
        <div className={`application-status ${closed ? "closed" : "open"}`} role="status">
          <strong>{closed ? "Applications are currently closed." : "Applications are open"}</strong>
          <span>{closed ? "Downloads and submissions are currently disabled. Please follow your regional KOICA office for the next application window." : applicationStatus.message}</span>
        </div>
      </section>

      <section className="section">
        <div className="timeline">
          {steps.map((step) => <div key={step.n} className="tl-step"><div className="tl-marker"><span className="tl-num">{step.n}</span><span className="tl-line" /></div><div className="tl-card"><h3>{step.title}</h3>{step.body}</div></div>)}
        </div>
      </section>

      <section className="section alt">
        <h2 className="section-title">{a.formsTitle}</h2>
        <p className="section-sub">Download the correct application form, complete it, then upload the completed document below.</p>

        <div className="dl-grid">
          {tracks.map((track) => {
            const formUrl = applicationStatus.forms?.[track.key] || "";
            return (
              <article className={`dl-card ${closed ? "is-disabled" : ""}`} key={track.key}>
                <div className="dl-icon"><FileIcon /></div>
                <div className="dl-copy"><h3>{track.title}</h3><p>{track.text}</p></div>
                <div className="application-actions">
                  <ActionButton href={formUrl} disabled={closed || !formUrl}>
                    {!closed && <DownloadIcon />}{closed ? "Applications are currently closed." : a.download}
                  </ActionButton>
                  <ActionButton disabled={closed} secondary onClick={() => openSubmission(track.key)}>
                    {track.submitLabel}
                  </ActionButton>
                </div>
              </article>
            );
          })}
        </div>

        <div className={`public-submission-panel ${closed ? "is-disabled" : ""}`} ref={submissionRef}>
          <div className="public-submission-head">
            <div>
              <span className="submission-kicker">Online submission</span>
              <h2>Submit your completed application</h2>
              <p>Upload the completed form you downloaded above. Your file and details will be sent securely to the KOICA YLP admin team.</p>
            </div>
            <div className="submission-track-toggle" aria-label="Application track">
              <button type="button" className={selectedTrack === "public" ? "active" : ""} onClick={() => setSelectedTrack("public")}>Public Sector</button>
              <button type="button" className={selectedTrack === "private" ? "active" : ""} onClick={() => setSelectedTrack("private")}>Private Sector</button>
            </div>
          </div>

          {submitSuccess ? (
            <div className="application-submit-success" role="status">
              <strong>{submitSuccess.message}</strong>
              <span>Reference: <b>{submitSuccess.reference}</b></span>
              <p>Keep this reference for your records.</p>
              <button type="button" className="btn" onClick={() => setSubmitSuccess(null)}>Submit another application</button>
            </div>
          ) : (
            <form className="public-submission-form" onSubmit={submitApplication}>
              <div className="submission-form-grid">
                <label className="field"><span>Full name</span><input required maxLength="160" value={submission.fullName} onChange={(e) => updateField("fullName", e.target.value)} /></label>
                <label className="field"><span>Email address</span><input required type="email" maxLength="254" value={submission.email} onChange={(e) => updateField("email", e.target.value)} /></label>
                <label className="field"><span>Phone number</span><input required maxLength="40" value={submission.phone} onChange={(e) => updateField("phone", e.target.value)} /></label>
                <label className="field"><span>Country</span><input required maxLength="100" value={submission.country} onChange={(e) => updateField("country", e.target.value)} /></label>
                <label className="field submission-wide"><span>Organization / institution</span><input required maxLength="180" value={submission.organization} onChange={(e) => updateField("organization", e.target.value)} /></label>
                <label className="field submission-wide"><span>Completed application form</span><input id="completed-application-file" required type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => updateField("file", e.target.files?.[0] || null)} /><small>PDF, DOC or DOCX · maximum 10 MB</small></label>
              </div>
              {submitError && <div className="admin-error" role="alert">{submitError}</div>}
              <button className="application-action submission-submit-button" type="submit" disabled={closed || submitBusy}>
                {submitBusy ? "Submitting…" : `Submit ${selectedTrack === "private" ? "Private" : "Public"} Sector Application`}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{a.contactTitle}</h2>
        <div className="contact-grid">
          <div className="contact-card"><span className="contact-tag">{a.contact1Tag}</span><h3>{a.contact1Title}</h3><p>{a.contact1Text} <a href="mailto:koicaghanaaciat@gmail.com">koicaghanaaciat@gmail.com</a></p></div>
          <div className="contact-card"><span className="contact-tag">{a.contact2Tag}</span><h3>{a.contact2Title}</h3><p>{a.contact2Text} <a href="mailto:KOICAYLP@hallym.ac.kr">KOICAYLP@hallym.ac.kr</a></p></div>
        </div>
      </section>
    </main>
  );
}
