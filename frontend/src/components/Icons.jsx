/* Shared SVG icons, no emojis anywhere on the site */

const p = {
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
};

export const CalendarCheckIcon = () => (
  <svg {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="3" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 15l2.2 2.2L15.5 13" />
  </svg>
);

export const NetworkIcon = () => (
  <svg {...p}>
    <circle cx="12" cy="6" r="2.6" />
    <circle cx="5.5" cy="17.5" r="2.6" />
    <circle cx="18.5" cy="17.5" r="2.6" />
    <path d="M10.4 8.1L7 15.2M13.6 8.1l3.4 7.1M8.1 17.5h7.8" />
  </svg>
);

export const BookIcon = () => (
  <svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7.5h8M8 11h5" />
  </svg>
);

export const ChatSparkIcon = () => (
  <svg {...p}>
    <path d="M20 11.3a7.3 7.3 0 0 1-7.6 7.2 7.7 7.7 0 0 1-3.3-.7L4 19l1.3-4.6a7 7 0 0 1-.8-3.1A7.3 7.3 0 0 1 12 4a7.4 7.4 0 0 1 8 7.3z" />
    <path d="M15.8 9.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5zM9.4 9.8l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z" fill="currentColor" stroke="none" />
  </svg>
);

export const WaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" style={{ display: "inline", verticalAlign: "-2px" }}>
    <path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
  </svg>
);

export const Arrow = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const MenuIcon = ({ open }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
  </svg>
);

export const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.6 6.3 20l1.5-6.4-5-4.4 6.6-.6z" />
  </svg>
);

export const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const GlobeIcon = () => (
  <svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z" />
  </svg>
);

export const PlaneIcon = () => (
  <svg {...p}>
    <path d="M10.5 13.5L3 11l1.5-1.5L10 10l4.5-4.5a1.8 1.8 0 0 1 2.5 2.5L12.5 12.5l.5 5.5L11.5 19.5 9 13z" />
  </svg>
);

export const LaptopIcon = () => (
  <svg {...p}>
    <rect x="4" y="5" width="16" height="11" rx="2" />
    <path d="M2 19h20" />
  </svg>
);

export const MailIcon = () => (
  <svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7l8.5 6 8.5-6" />
  </svg>
);

export const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);

export const DownloadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16" />
  </svg>
);

export const SproutIcon = () => (
  <svg {...p}>
    <path d="M12 21v-8M12 13c0-3.5-2.8-6-6.5-6C5.5 10.5 8.3 13 12 13zM12 11c0-3.5 2.8-6 6.5-6C18.5 8.5 15.7 11 12 11z" />
  </svg>
);

export const HeartHandIcon = () => (
  <svg {...p}>
    <path d="M12 8.2c1.2-2.4 4.6-2.4 5.8 0 .9 1.8 0 3.5-1.6 5L12 17l-4.2-3.8c-1.6-1.5-2.5-3.2-1.6-5 1.2-2.4 4.6-2.4 5.8 0z" />
  </svg>
);
