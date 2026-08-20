import { useEffect, useState } from "react";

const ThemeIcon = ({ dark }) => dark ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A8.7 8.7 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8z"/></svg>
);
const EyeIcon = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.5"/></svg>;

export default function AccessibilityTools(){
  const [theme,setTheme]=useState(()=>localStorage.getItem("ylp-theme")||(window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light"));
  const [open,setOpen]=useState(false);
  const [textSize,setTextSize]=useState(()=>localStorage.getItem("ylp-text-size")||"normal");
  const [contrast,setContrast]=useState(()=>localStorage.getItem("ylp-contrast")==="true");
  const [grayscale,setGrayscale]=useState(()=>localStorage.getItem("ylp-grayscale")==="true");
  const [underline,setUnderline]=useState(()=>localStorage.getItem("ylp-underline")==="true");
  const [reduceMotion,setReduceMotion]=useState(()=>localStorage.getItem("ylp-reduce-motion")==="true");
  const [speaking,setSpeaking]=useState(false);

  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("ylp-theme",theme);},[theme]);
  useEffect(()=>{const r=document.documentElement;r.dataset.textSize=textSize;r.dataset.contrast=contrast?"high":"normal";r.dataset.grayscale=grayscale?"on":"off";r.dataset.underline=underline?"on":"off";r.dataset.reduceMotion=reduceMotion?"on":"off";localStorage.setItem("ylp-text-size",textSize);localStorage.setItem("ylp-contrast",String(contrast));localStorage.setItem("ylp-grayscale",String(grayscale));localStorage.setItem("ylp-underline",String(underline));localStorage.setItem("ylp-reduce-motion",String(reduceMotion));},[textSize,contrast,grayscale,underline,reduceMotion]);
  useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);

  const readPage=()=>{if(!("speechSynthesis" in window))return;if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}const target=document.querySelector("main, .portal-main, .login-shell, .app")||document.body;const text=target.innerText.replace(/\s+/g," ").trim().slice(0,12000);if(!text)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.95;u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);setSpeaking(true);window.speechSynthesis.speak(u);};
  const reset=()=>{setTextSize("normal");setContrast(false);setGrayscale(false);setUnderline(false);setReduceMotion(false);window.speechSynthesis?.cancel();setSpeaking(false);};

  return <div className="access-tools" aria-label="Display and accessibility tools">
    <button className="access-fab" type="button" onClick={()=>setTheme(theme==="dark"?"light":"dark")} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} title={theme==="dark"?"Light mode":"Dark mode"}><ThemeIcon dark={theme==="dark"}/></button>
    <button className="access-fab" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="accessibility-panel" aria-label="Open visual accessibility tools" title="Accessibility tools"><EyeIcon/></button>
    {open&&<section id="accessibility-panel" className="access-panel" role="dialog" aria-label="Visual accessibility tools">
      <div className="access-panel-head"><div><strong>Accessibility</strong><small>Adjust how the site looks and reads.</small></div><button type="button" className="access-close" onClick={()=>setOpen(false)} aria-label="Close accessibility tools">×</button></div>
      <div className="access-group"><span className="access-label">Text size</span><div className="access-segmented"><button type="button" className={textSize==="normal"?"active":""} onClick={()=>setTextSize("normal")}>A</button><button type="button" className={textSize==="large"?"active":""} onClick={()=>setTextSize("large")}>A+</button><button type="button" className={textSize==="xlarge"?"active":""} onClick={()=>setTextSize("xlarge")}>A++</button></div></div>
      <label className="access-toggle"><span><strong>High contrast</strong><small>Increase separation between text and backgrounds.</small></span><input type="checkbox" checked={contrast} onChange={e=>setContrast(e.target.checked)}/></label>
      <label className="access-toggle"><span><strong>Grayscale</strong><small>Remove colour distractions.</small></span><input type="checkbox" checked={grayscale} onChange={e=>setGrayscale(e.target.checked)}/></label>
      <label className="access-toggle"><span><strong>Underline links</strong><small>Make interactive links easier to identify.</small></span><input type="checkbox" checked={underline} onChange={e=>setUnderline(e.target.checked)}/></label>
      <label className="access-toggle"><span><strong>Reduce motion</strong><small>Stop non-essential animation.</small></span><input type="checkbox" checked={reduceMotion} onChange={e=>setReduceMotion(e.target.checked)}/></label>
      <button type="button" className="access-read" onClick={readPage}>{speaking?"Stop reading":"Read page aloud"}</button>
      <button type="button" className="access-reset" onClick={reset}>Reset accessibility settings</button>
    </section>}
  </div>;
}
