import { useEffect, useState } from "react";
import { FileIcon, DownloadIcon, MailIcon } from "../components/Icons";
import { useT } from "../i18n";
import { API } from "../auth/AuthContext";

const CLOSED_STATUS = {
  open: false,
  message: "Applications are currently closed.",
  closeAt: null,
  forms: {
    public: "",
    private: "",
  },
  submissions: {
    public: "",
    private: "",
  },
};

function ActionButton({
  href,
  disabled,
  children,
  secondary = false,
}) {
  const className = [
    "application-action",
    secondary ? "secondary" : "",
    disabled ? "disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled || !href) {
    return (
      <button
        type="button"
        className={className}
        disabled
        aria-disabled="true"
      >
        {children}
      </button>
    );
  }

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default function Apply() {
  const { t } = useT();
  const a = t.apply;

  const [applicationStatus, setApplicationStatus] =
    useState(CLOSED_STATUS);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplicationStatus() {
      try {
        const response = await fetch(
          `${API}/api/application-status`,
          {
            signal: controller.signal,
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Application status unavailable");
        }

        const data = await response.json();

        setApplicationStatus({
          ...CLOSED_STATUS,
          ...data,
          forms: {
            ...CLOSED_STATUS.forms,
            ...(data.forms || {}),
          },
          submissions: {
            ...CLOSED_STATUS.submissions,
            ...(data.submissions || {}),
          },
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setApplicationStatus(CLOSED_STATUS);
        }
      }
    }

    loadApplicationStatus();

    return () => {
      controller.abort();
    };
  }, []);

  const closed = !applicationStatus.open;

  const steps = [
    {
      n: 1,
      title: a.step1Title,
      body: (
        <>
          <p>{a.step1Intro}</p>

          <ul className="doc-list">
            {a.docs.map((document) => (
              <li key={document}>
                <FileIcon />
                {document}
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      n: 2,
      title: a.step2Title,
      body: (
        <>
          <p>{a.step2Intro}</p>

          <ul className="doc-list">
            <li>
              <MailIcon />
              {a.step2Rule1}
            </li>

            <li>
              <FileIcon />
              {a.step2Rule2}
            </li>
          </ul>
        </>
      ),
    },
    {
      n: 3,
      title: a.step3Title,
      body: <p>{a.step3Body}</p>,
    },
    {
      n: 4,
      title: a.step4Title,
      body: (
        <>
          <p>{a.step4Body}</p>
          <div className="warn-box">
            {a.step4Warn}
          </div>
        </>
      ),
    },
    {
      n: 5,
      title: a.step5Title,
      body: <p>{a.step5Body}</p>,
    },
  ];

  const tracks = [
    {
      key: "public",
      title: a.formPublic,
      text: a.formPublicText,
      submitLabel: "Submit Public Sector Application",
    },
    {
      key: "private",
      title: a.formPrivate,
      text: a.formPrivateText,
      submitLabel: "Submit Private Sector Application",
    },
  ];

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">
          {a.eyebrow}
        </div>

        <h1>
          {a.titleA}
          <span className="shimmer">
            {a.titleB}
          </span>
        </h1>

        <p className="page-sub">
          {a.sub}
        </p>

        <div
          className={`application-status ${
            closed ? "closed" : "open"
          }`}
          role="status"
        >
          <strong>
            {closed
              ? "Applications are currently closed."
              : "Applications are open"}
          </strong>

          <span>
            {closed
              ? "Downloads and submissions are currently disabled. Please follow your regional KOICA office for the next application window."
              : applicationStatus.message}
          </span>
        </div>
      </section>

      <section className="section">
        <div className="timeline">
          {steps.map((step) => (
            <div
              key={step.n}
              className="tl-step"
            >
              <div className="tl-marker">
                <span className="tl-num">
                  {step.n}
                </span>

                <span className="tl-line" />
              </div>

              <div className="tl-card">
                <h3>
                  {step.title}
                </h3>

                {step.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <h2 className="section-title">
          {a.formsTitle}
        </h2>

        <p className="section-sub">
          {a.formsSub}
        </p>

        <div className="dl-grid">
          {tracks.map((track) => {
            const formUrl =
              applicationStatus.forms?.[track.key] || "";

            const submissionUrl =
              applicationStatus.submissions?.[
                track.key
              ] || "";

            return (
              <article
                className={`dl-card ${
                  closed ? "is-disabled" : ""
                }`}
                key={track.key}
              >
                <div className="dl-icon">
                  <FileIcon />
                </div>

                <div className="dl-copy">
                  <h3>
                    {track.title}
                  </h3>

                  <p>
                    {track.text}
                  </p>
                </div>

                <div className="application-actions">
                  <ActionButton
                    href={formUrl}
                    disabled={
                      closed || !formUrl
                    }
                  >
                    {!closed && <DownloadIcon />}
                    {closed ? "Applications are currently closed." : a.download}
                  </ActionButton>

                  <ActionButton
                    href={submissionUrl}
                    disabled={
                      closed || !submissionUrl
                    }
                    secondary
                  >
                    {closed ? "Applications are currently closed." : track.submitLabel}
                  </ActionButton>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          {a.contactTitle}
        </h2>

        <div className="contact-grid">
          <div className="contact-card">
            <span className="contact-tag">
              {a.contact1Tag}
            </span>

            <h3>
              {a.contact1Title}
            </h3>

            <p>
              {a.contact1Text}{" "}
              <a href="mailto:koicaghanaaciat@gmail.com">
                koicaghanaaciat@gmail.com
              </a>
            </p>
          </div>

          <div className="contact-card">
            <span className="contact-tag">
              {a.contact2Tag}
            </span>

            <h3>
              {a.contact2Title}
            </h3>

            <p>
              {a.contact2Text}{" "}
              <a href="mailto:KOICAYLP@hallym.ac.kr">
                KOICAYLP@hallym.ac.kr
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}