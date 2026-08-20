/* ==========================================================================
   KOICA YLP, shared styles for all pages
   Brand: KOICA blue #004290 · Peko sky #39BCF2 · white background
   Motion: typewriter, rotating conic borders, orbit stage, aurora blobs,
   shimmer headings, split-screen tracks, staggered reveals
   ========================================================================== */

export const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Urbanist:wght@500;600;700&display=swap');

:root{
  --koica:#004290;
  --koica-deep:#002B5E;
  --sky:#39BCF2;
  --sky-soft:#BDE7FB;
  --ink:#0A1730;
  --grey:#54627B;
  --line:#E1E9F5;
  --white:#ffffff;
  --ease-out:cubic-bezier(0.22, 1, 0.36, 1);
  --stage-scale:1;
  --page-pad:64px;
}
@property --border-angle{
  syntax:'<angle>';
  initial-value:0deg;
  inherits:false;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{
  font-family:'Inter',sans-serif;
  background:#ffffff;
  color:var(--ink);
  overflow-x:hidden;
}
img{display:block;max-width:100%;}
a{text-decoration:none;color:inherit;}
button{font-family:'Inter',sans-serif;}

.app{
  min-height:100vh;
  background:
    radial-gradient(800px 600px at 80% 42%, rgba(57,188,242,0.10), transparent 62%),
    radial-gradient(520px 420px at 10% 90%, rgba(0,66,144,0.07), transparent 60%),
    #ffffff;
  display:flex;
  flex-direction:column;
  position:relative;
}

/* ============ Header ============ */
header{
  display:flex;justify-content:space-between;align-items:center;
  padding:24px var(--page-pad);max-width:1920px;width:100%;margin:0 auto;
  animation:fadeDown .8s var(--ease-out) both;
  position:relative;z-index:40;
}
.header-left{display:flex;align-items:center;gap:44px;min-width:0;}
.logo{display:flex;align-items:center;gap:12px;flex:0 0 auto;}
.logo-img{height:30px;width:auto;object-fit:contain;}
.logo-divider{width:1px;height:22px;background:var(--line);}
.logo-ylp{
  font-family:'Urbanist',sans-serif;font-weight:700;font-size:19px;
  letter-spacing:1px;color:var(--sky);
}
.desktop-nav{display:flex;gap:26px;}
.nav-link{position:relative;color:var(--ink);font-size:15px;font-weight:400;padding:4px 0;white-space:nowrap;}
.nav-link::after{
  content:'';position:absolute;left:0;bottom:0;width:100%;height:1.5px;
  background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .3s ease;
}
.nav-link:hover::after{transform:scaleX(1);}
.nav-link.active{color:var(--koica);font-weight:600;}
.nav-link.active::after{transform:scaleX(1);background:var(--sky);height:2px;}
.header-right{display:flex;align-items:center;gap:26px;}
.login-link{position:relative;color:var(--koica);font-size:15px;font-weight:500;padding:4px 0;white-space:nowrap;}
.login-link::after{
  content:'';position:absolute;left:0;bottom:0;width:100%;height:1.5px;
  background:var(--koica);transform:scaleX(0);transform-origin:left;transition:transform .3s ease;
}
.login-link:hover::after{transform:scaleX(1);}

.menu-toggle{
  display:none;
  border:none;background:none;color:var(--koica);cursor:pointer;
  width:42px;height:42px;border-radius:12px;
  align-items:center;justify-content:center;
}
.menu-toggle:hover{background:#EDF4FC;}

.mobile-menu{
  position:fixed;inset:0;top:74px;z-index:35;
  background:#ffffff;
  display:flex;flex-direction:column;gap:6px;
  padding:18px var(--page-pad) 32px;
  animation:fadeDown .3s var(--ease-out) both;
  border-top:1px solid var(--line);
  overflow-y:auto;
}
.mobile-menu a{
  font-family:'Urbanist',sans-serif;font-size:20px;font-weight:600;color:var(--ink);
  padding:14px 4px;border-bottom:1px solid var(--line);
}
.mobile-menu a:active{color:var(--koica);}
.mobile-menu .mobile-apply{
  margin-top:18px;border:none;text-align:center;
  background:var(--koica);color:#fff;border-radius:50px;padding:15px;
  font-size:17px;
}

/* ============ Buttons ============ */
.btn-border-wrap{position:relative;border-radius:50px;display:inline-block;}
.btn-border-wrap::before{
  content:'';position:absolute;inset:-3px;border-radius:50px;padding:3px;
  background:conic-gradient(from var(--border-angle), #39BCF2, #002B5E, #39BCF2, #002B5E, #39BCF2);
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite:exclude;
  animation:rotateBorder 3s linear infinite;
  pointer-events:none;
}
@keyframes rotateBorder{to{--border-angle:360deg;}}

.btn{
  position:relative;display:inline-flex;align-items:center;gap:10px;
  border:none;cursor:pointer;border-radius:50px;overflow:hidden;
  background:var(--koica);color:#fff;
  font-size:15px;font-weight:500;padding:12px 26px;isolation:isolate;
  white-space:nowrap;
}
.btn > *{position:relative;z-index:1;}
.btn::after{
  content:'';position:absolute;inset:0;background:var(--sky);z-index:0;
  transform:translateX(-100%);transition:transform .4s var(--ease-out);
}
.btn:hover::after{transform:translateX(0);}
.btn:hover{color:var(--koica-deep);}
.btn.btn-lg{padding:14px 28px;font-size:16px;background:var(--koica-deep);}
.btn.slide-right::after{transform:translateX(100%);}
.btn.slide-right:hover::after{transform:translateX(0);}
.btn.ghost{background:#fff;color:var(--koica);box-shadow:inset 0 0 0 1.5px var(--koica);}
.btn.ghost::after{background:rgba(57,188,242,.2);}
.btn.ghost:hover{color:var(--koica-deep);}

/* ============ Home hero ============ */
.hero{
  flex:1;display:flex;align-items:center;justify-content:space-between;
  padding:0 var(--page-pad);max-width:1920px;width:100%;margin:0 auto;gap:20px;
}
.hero-left{flex:0 1 600px;padding-top:40px;animation:fadeUp 1s var(--ease-out) both;min-width:0;}
.eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:13px;font-weight:600;letter-spacing:2.5px;color:var(--koica);
  text-transform:uppercase;margin-bottom:18px;
}
.eyebrow::before{content:'';width:26px;height:2px;background:var(--sky);}
.hero h1{
  font-family:'Urbanist',sans-serif;
  font-size:clamp(30px, 4.6vw, 64px);
  font-weight:600;
  line-height:1.02;
  letter-spacing:clamp(-1.5px, -0.1vw, -0.8px);
  min-height:3.1em;
  overflow-wrap:break-word;
}
.hero h1 .dark{color:var(--ink);}
.hero h1 .light{color:var(--koica);}
.type-cursor{
  display:inline-block;width:4px;height:.85em;background:var(--sky);
  margin-left:4px;vertical-align:baseline;
  animation:blink .7s steps(1) infinite;
}
@keyframes blink{50%{opacity:0;}}

.hero-cta{
  margin-top:40px;display:flex;align-items:center;gap:22px;flex-wrap:wrap;
  opacity:0;animation:fadeUp .8s var(--ease-out) 3.2s forwards;
}
.cursor-tag{
  display:flex;align-items:flex-start;gap:2px;
  margin-left:290px;margin-top:40px;
  opacity:0;animation:popIn .6s var(--ease-out) 3.6s forwards;
}
.cursor-tag svg{filter:drop-shadow(0 4px 10px rgba(0,43,94,.25));}
.cursor-name{
  background:var(--sky);color:var(--koica-deep);font-size:16px;font-weight:600;
  padding:8px 16px;border-radius:20px;margin-top:14px;margin-left:-4px;
  box-shadow:0 8px 22px rgba(57,188,242,.45);
}

/* ============ Orbits ============ */
.hero-right{
  flex:0 0 auto;
  width:calc(720px * var(--stage-scale));
  height:calc(720px * var(--stage-scale));
  position:relative;
  animation:scaleIn 1.2s var(--ease-out) .3s both;
}
.orbit-stage{
  position:absolute;top:50%;left:50%;
  width:720px;height:720px;
  transform:translate(-50%,-50%) scale(var(--stage-scale));
}
.orbit{position:absolute;top:50%;left:50%;border-radius:50%;}
.orbit::before{
  content:'';position:absolute;inset:0;border-radius:50%;padding:1px;
  background:linear-gradient(180deg, rgba(0,66,144,0) 0%, rgba(0,66,144,.65) 43%, rgba(0,66,144,0) 100%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite:exclude;
  pointer-events:none;
}
.orbit-1{width:353px;height:353px;margin:-176.5px 0 0 -176.5px;animation:spinL 30s linear infinite;}
.orbit-2{width:501px;height:501px;margin:-250.5px 0 0 -250.5px;animation:spinR 40s linear infinite;}
.orbit-4{width:797px;height:797px;margin:-398.5px 0 0 -398.5px;animation:spinL 60s linear infinite;}
@keyframes spinL{to{transform:rotate(-360deg);}}
@keyframes spinR{to{transform:rotate(360deg);}}

.orbit-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;}
.orbit-1 .counter-wrap{animation:spinR 30s linear infinite;}
.count-num{font-family:'Urbanist',sans-serif;font-size:64px;font-weight:500;color:var(--koica);line-height:1;}
.count-label{font-family:'Urbanist',sans-serif;font-size:16px;font-weight:600;color:var(--ink);letter-spacing:1px;margin-top:6px;}
.count-sub{font-size:12px;color:var(--grey);margin-top:4px;letter-spacing:.4px;}

.orbit-item{position:absolute;top:50%;left:50%;}
.cspin-l30{animation:spinR 30s linear infinite;}
.cspin-r40{animation:spinL 40s linear infinite;}
.cspin-l60{animation:spinR 60s linear infinite;}

.flag{
  width:58px;height:58px;object-fit:cover;border-radius:50%;
  border:2.5px solid #ffffff;background:#fff;
  opacity:0;
  animation:flyIn .7s var(--ease-out) forwards;
}
.flag.sq{border-radius:20px;}
.flag.sq24{border-radius:24px;}
.flag.md{width:78px;height:78px;}
.flag.lg{width:88px;height:88px;}
.glow-blue{box-shadow:0 0 0 1px var(--line), 0 10px 32px 3px rgba(0,66,144,.4);}
.glow-sky{box-shadow:0 0 0 1px var(--line), 0 10px 32px 3px rgba(57,188,242,.5);}
.glow-gold{box-shadow:0 0 0 1px var(--line), 0 10px 32px 3px rgba(252,209,22,.55);}
.glow-green{box-shadow:0 0 0 1px var(--line), 0 10px 32px 3px rgba(0,135,81,.45);}
.glow-red{box-shadow:0 0 0 1px var(--line), 0 10px 32px 3px rgba(206,17,38,.4);}
.glow-orange{box-shadow:0 0 0 1px var(--line), 0 10px 32px 3px rgba(247,127,0,.45);}
@keyframes flyIn{
  from{opacity:0;transform:scale(.3) rotate(-180deg);filter:blur(8px);}
  to{opacity:1;transform:scale(1) rotate(0deg);filter:blur(0);}
}

/* ============ Ticker ============ */
.ticker-section{
  padding:26px 0 34px;
  opacity:0;animation:fadeUp 1s var(--ease-out) .6s forwards;
}
.ticker{
  overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image:linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.ticker-track{
  display:flex;align-items:center;gap:64px;width:max-content;
  animation:ticker 20s linear infinite;
}
@keyframes ticker{to{transform:translateX(-25%);}}
.ticker-item{
  display:flex;align-items:center;gap:12px;flex:0 0 auto;
  color:var(--koica);font-family:'Urbanist',sans-serif;
  font-weight:700;font-size:17px;letter-spacing:1px;white-space:nowrap;
  opacity:.85;
}
.ticker-item img{width:34px;height:24px;object-fit:cover;border-radius:5px;box-shadow:0 2px 8px rgba(0,43,94,.18);}
.ticker-item img.ticker-logo{width:auto;height:26px;object-fit:contain;border-radius:0;box-shadow:none;}
.ticker-item.wordmark{font-size:16px;letter-spacing:2.5px;color:#8A99B5;}
.ticker-item.wordmark b{color:var(--sky);}

/* ============ Hub (home) ============ */
.hub{
  background:linear-gradient(180deg, #ffffff 0%, #F2F8FE 20%, #F2F8FE 100%);
  padding:96px var(--page-pad) 110px;
  border-top:1px solid var(--line);
}
.hub-inner{max-width:1200px;margin:0 auto;}
.hub-head{
  display:flex;align-items:center;justify-content:space-between;gap:32px;
  margin-bottom:52px;opacity:0;transform:translateY(40px);
}
.hub-head.reveal{animation:fadeUp .9s var(--ease-out) forwards;}
.hub-head-text{max-width:640px;}
.hub h2{
  font-family:'Urbanist',sans-serif;
  font-size:clamp(28px, 3.4vw, 42px);
  font-weight:600;letter-spacing:-1px;
  line-height:1.1;color:var(--ink);
}
.hub h2 span{color:var(--koica);}
.hub-sub{margin-top:14px;color:var(--grey);font-size:16px;line-height:1.65;}
.hub-peko{
  flex:0 0 auto;width:150px;height:150px;border-radius:32px;
  background:#ffffff;border:1px solid var(--line);
  box-shadow:0 12px 34px rgba(0,66,144,.1);
  display:grid;place-items:center;overflow:hidden;
  transform:rotate(3deg);
}
.hub-peko img{width:120px;height:120px;object-fit:contain;}
.hub-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:22px;}
.hub-card{
  position:relative;border-radius:22px;padding:30px 26px 26px;
  background:#ffffff;border:1px solid var(--line);
  box-shadow:0 8px 30px rgba(0,43,94,0.06);
  transition:transform .35s var(--ease-out), border-color .35s ease, box-shadow .35s ease;
  opacity:0;transform:translateY(40px);
  display:flex;flex-direction:column;gap:14px;min-height:230px;
}
.hub-card.reveal{animation:fadeUp .8s var(--ease-out) forwards;}
.hub-card:hover{transform:translateY(-6px);border-color:var(--sky);box-shadow:0 18px 44px rgba(57,188,242,0.22);}
.hub-icon{
  width:52px;height:52px;border-radius:15px;display:grid;place-items:center;
  color:var(--koica);
  background:linear-gradient(140deg, rgba(57,188,242,.16), rgba(0,66,144,.08));
  border:1px solid var(--line);
}
.hub-card h3{font-family:'Urbanist',sans-serif;font-size:20px;font-weight:700;color:var(--ink);}
.hub-card p{font-size:14px;line-height:1.6;color:var(--grey);flex:1;}
.hub-link{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--koica);}
.hub-link svg{transition:transform .3s var(--ease-out);}
.hub-card:hover .hub-link svg{transform:translateX(5px);}
.hub-tag{
  position:absolute;top:22px;right:22px;font-size:10.5px;font-weight:600;letter-spacing:1.2px;
  color:#8A99B5;border:1px solid var(--line);
  padding:4px 10px;border-radius:20px;text-transform:uppercase;background:#fff;
}

/* ============ Footer ============ */
footer{
  background:#ffffff;border-top:1px solid var(--line);
  padding:34px var(--page-pad);display:flex;justify-content:space-between;align-items:center;
  color:var(--grey);font-size:13.5px;flex-wrap:wrap;gap:14px;
}
.footer-brand{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.footer-brand img{height:22px;width:auto;object-fit:contain;}
footer a{color:var(--koica);}
footer a:hover{text-decoration:underline;}

/* ============ Chatbot ============ */
.chat-fab{
  position:fixed;right:26px;bottom:26px;z-index:60;
  width:64px;height:64px;border-radius:50%;border:none;cursor:pointer;
  background:#ffffff;
  display:grid;place-items:center;overflow:hidden;
  box-shadow:0 12px 34px rgba(0,43,94,.28), 0 0 0 2.5px var(--sky);
  transition:transform .3s var(--ease-out);
}
.chat-fab:hover{transform:scale(1.08);}
.chat-fab img{width:46px;height:46px;object-fit:contain;margin-top:6px;}
.chat-fab .dot{
  position:absolute;top:5px;right:7px;width:11px;height:11px;border-radius:50%;
  background:var(--sky);animation:pulse 1.8s ease infinite;z-index:1;
}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:.5;}}
.chat-panel{
  position:fixed;right:26px;bottom:104px;z-index:70;
  width:min(370px, calc(100vw - 40px));height:480px;border-radius:24px;overflow:hidden;
  background:#fff;color:var(--ink);
  box-shadow:0 30px 80px rgba(0,43,94,.3);
  display:flex;flex-direction:column;
  transform-origin:bottom right;
  animation:popIn .35s var(--ease-out);
}
.chat-head{
  background:linear-gradient(120deg, var(--koica), var(--koica-deep));color:#fff;
  padding:14px 18px;display:flex;align-items:center;gap:12px;
}
.chat-head-text{flex:1;min-width:0;}
.chat-close{
  border:none;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;
  width:32px;height:32px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;
}
.chat-close:hover{background:rgba(255,255,255,.26);}
.chat-avatar{
  width:42px;height:42px;border-radius:50%;background:#fff;overflow:hidden;
  display:grid;place-items:center;flex:0 0 auto;
  box-shadow:0 0 0 2px var(--sky);
}
.chat-avatar img{width:34px;height:34px;object-fit:contain;margin-top:4px;}
.chat-head strong{font-size:15px;display:block;}
.chat-head small{font-size:12px;opacity:.8;}
.chat-body{flex:1;padding:16px;overflow-y:auto;background:#F2F8FE;display:flex;flex-direction:column;gap:10px;}
.chat-msg{
  max-width:85%;background:#fff;border:1px solid var(--line);border-radius:14px 14px 14px 4px;
  padding:10px 14px;font-size:13.5px;line-height:1.55;color:#1E2A42;
  box-shadow:0 2px 8px rgba(0,66,144,.06);
}
.chat-msg.user{
  align-self:flex-end;background:var(--koica);color:#fff;
  border-radius:14px 14px 4px 14px;border-color:var(--koica);
}
.chat-chips{display:flex;flex-wrap:wrap;gap:8px;}
.chat-chip{
  border:1px solid var(--koica);color:var(--koica);background:#fff;
  font-size:12.5px;font-weight:500;padding:7px 12px;border-radius:20px;cursor:pointer;
  transition:background .25s ease, color .25s ease;
}
.chat-chip:hover{background:var(--koica);color:#fff;}
.chat-input{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line);background:#fff;}
.chat-input input{
  flex:1;min-width:0;border:1px solid #CFE0F2;border-radius:22px;padding:10px 16px;font-size:16px;
  font-family:'Inter',sans-serif;outline:none;
}
.chat-input input:focus{border-color:var(--sky);}
.chat-input button{
  width:42px;height:42px;border-radius:50%;border:none;background:var(--koica);color:#fff;cursor:pointer;
  display:grid;place-items:center;flex:0 0 auto;
}
.chat-input button:hover{background:var(--koica-deep);}
.chat-note{font-size:10.5px;color:#8A99B5;text-align:center;padding:0 12px 10px;background:#fff;}

/* ==========================================================================
   INNER PAGES (Program, Tracks, Eligibility, Apply, FAQ)
   ========================================================================== */

.page{
  width:100%;max-width:1240px;margin:0 auto;
  padding:6px var(--page-pad) 84px;
}
/* Staggered entrance for page sections (MotionSites-style page load sequence) */
.page > *{opacity:0;animation:fadeUp .8s var(--ease-out) forwards;}
.page > *:nth-child(1){animation-delay:.05s;}
.page > *:nth-child(2){animation-delay:.15s;}
.page > *:nth-child(3){animation-delay:.25s;}
.page > *:nth-child(4){animation-delay:.35s;}
.page > *:nth-child(5){animation-delay:.45s;}
.page > *:nth-child(n+6){animation-delay:.55s;}

/* Page hero with drifting aurora blobs */
.page-hero{
  position:relative;isolation:isolate;
  padding:52px 0 26px;max-width:820px;
}
.page-hero h1{
  font-family:'Urbanist',sans-serif;
  font-size:clamp(34px, 5vw, 58px);
  font-weight:600;letter-spacing:-1.2px;line-height:1.06;color:var(--ink);
}
.page-hero h1 span{
  background:linear-gradient(90deg, var(--koica), var(--sky), var(--koica));
  background-size:200% auto;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:shimmer 4.5s linear infinite;
}
@keyframes shimmer{to{background-position:200% center;}}
.page-sub{margin-top:16px;color:var(--grey);font-size:17px;line-height:1.7;}

.section{padding:38px 0;}
.section.alt{
  background:linear-gradient(180deg, #F4F9FF, #ECF5FD);
  border:1px solid var(--line);border-radius:28px;
  padding:44px clamp(20px, 4vw, 48px);
  margin:22px 0;
}
.section-title{
  font-family:'Urbanist',sans-serif;
  font-size:clamp(26px, 3.2vw, 38px);
  font-weight:600;letter-spacing:-.8px;color:var(--ink);
}
.section-title span{color:var(--koica);}
.section-sub{margin-top:10px;color:var(--grey);max-width:660px;font-size:15.5px;line-height:1.65;}

/* Stats band */
.stats-band{
  display:grid;grid-template-columns:repeat(4,1fr);gap:14px;
  background:linear-gradient(120deg, var(--koica), var(--koica-deep));
  border-radius:26px;padding:34px 26px;color:#fff;
  position:relative;overflow:hidden;
}
.stats-band::after{
  content:'';position:absolute;inset:0;
  background:radial-gradient(420px 220px at 85% 15%, rgba(57,188,242,.4), transparent 65%);
  animation:drift 12s ease-in-out infinite alternate;
}
.stat{position:relative;z-index:1;text-align:center;}
.stat strong{font-family:'Urbanist',sans-serif;font-size:clamp(30px,4vw,48px);font-weight:600;display:block;line-height:1;}
.stat span{font-size:13px;opacity:.85;letter-spacing:.6px;display:block;margin-top:8px;}

/* Roadmap (Program) */
.roadmap{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:30px;}
.phase-card{
  position:relative;overflow:hidden;
  background:#fff;border:1px solid var(--line);border-radius:22px;padding:28px 26px 24px;
  box-shadow:0 8px 30px rgba(0,43,94,.05);
  transition:transform .35s var(--ease-out), box-shadow .35s ease;
  display:flex;flex-direction:column;
}
.phase-card::before{
  content:'';position:absolute;inset:0 0 auto 0;height:4px;
  background:linear-gradient(90deg, var(--koica), var(--sky));
}
.phase-card:hover{transform:translateY(-6px);box-shadow:0 18px 44px rgba(0,66,144,.14);}
.phase-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.phase-num{
  font-family:'Urbanist',sans-serif;font-size:46px;font-weight:700;line-height:1;
  color:transparent;-webkit-text-stroke:1.5px var(--sky);
}
.phase-icon{
  width:46px;height:46px;border-radius:14px;display:grid;place-items:center;
  color:var(--koica);background:rgba(57,188,242,.14);
}
.phase-card h3{font-family:'Urbanist',sans-serif;font-size:20px;font-weight:700;color:var(--ink);}
.phase-card p{font-size:14px;color:var(--grey);line-height:1.65;margin:10px 0 18px;flex:1;}
.phase-tag{
  align-self:flex-start;font-size:11.5px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;
  color:var(--koica);background:rgba(0,66,144,.07);border:1px solid var(--line);
  padding:5px 12px;border-radius:20px;
}

/* After the program (Program) */
.after-head{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;}
.after-peko{
  width:130px;height:130px;object-fit:contain;flex:0 0 auto;
  background:#fff;border:1px solid var(--line);border-radius:28px;padding:10px;
  transform:rotate(3deg);
  box-shadow:0 12px 30px rgba(0,66,144,.1);
}
.after-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:28px;}
.after-card{
  background:#fff;border:1px solid var(--line);border-radius:20px;padding:24px 20px;
  transition:transform .3s var(--ease-out), box-shadow .3s ease;
}
.after-card:hover{transform:translateY(-5px);box-shadow:0 14px 34px rgba(0,43,94,.1);}
.after-icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;margin-bottom:14px;}
.tint-green .after-icon{color:#0E9F5D;background:rgba(14,159,93,.12);}
.tint-blue .after-icon{color:var(--koica);background:rgba(0,66,144,.1);}
.tint-purple .after-icon{color:#7A4FD8;background:rgba(122,79,216,.12);}
.tint-orange .after-icon{color:#D9700A;background:rgba(247,127,0,.13);}
.after-card h3{font-family:'Urbanist',sans-serif;font-size:16.5px;font-weight:700;color:var(--ink);}
.after-card p{font-size:13.5px;color:var(--grey);line-height:1.6;margin-top:8px;}

/* CTA row */
.cta-row{padding-bottom:0;}
.cta-card{
  display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;
  background:linear-gradient(120deg, #ffffff, #F2F8FE);
  border:1px solid var(--line);border-radius:24px;padding:30px 32px;
  box-shadow:0 10px 34px rgba(0,43,94,.07);
}
.cta-card h3{font-family:'Urbanist',sans-serif;font-size:22px;font-weight:700;color:var(--ink);}
.cta-card p{font-size:14.5px;color:var(--grey);margin-top:6px;}
.cta-actions{display:flex;gap:14px;flex-wrap:wrap;}

/* ============ TRACKS, split screen (the tracks must be SEEN) ============ */
.track-split{display:flex;gap:20px;min-height:500px;}
.ts-panel{
  flex:1;position:relative;overflow:hidden;isolation:isolate;
  border-radius:28px;padding:40px 34px 34px;
  display:flex;flex-direction:column;gap:16px;color:#fff;
  transition:flex .55s var(--ease-out), transform .35s var(--ease-out), box-shadow .35s ease;
}
.ts-panel:hover{flex:1.3;box-shadow:0 24px 60px rgba(0,43,94,.28);}
.ts-public{background:linear-gradient(155deg, #0B54AC, #004290 40%, #002B5E 100%);}
.ts-private{background:linear-gradient(155deg, #2FA9DF, #0E7DBE 45%, #084F86 100%);}
.ts-panel::before{
  content:'';position:absolute;right:-90px;top:-90px;z-index:-1;
  width:280px;height:280px;border-radius:50%;
  border:60px solid rgba(255,255,255,.08);
  animation:drift 16s ease-in-out infinite alternate;
}
.ts-ghost{
  position:absolute;bottom:-14px;right:14px;z-index:-1;
  font-family:'Urbanist',sans-serif;font-weight:700;
  font-size:clamp(60px, 9vw, 108px);letter-spacing:3px;
  color:rgba(255,255,255,.07);user-select:none;pointer-events:none;
  white-space:nowrap;
}
.ts-kicker{
  align-self:flex-start;font-size:11.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;
  background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);
  padding:6px 14px;border-radius:20px;
}
.ts-panel h2{
  font-family:'Urbanist',sans-serif;
  font-size:clamp(26px, 2.8vw, 38px);font-weight:600;letter-spacing:-.8px;line-height:1.1;
}
.ts-panel > p{font-size:14.5px;line-height:1.65;opacity:.92;max-width:420px;}
.ts-panel ul{list-style:none;margin-top:4px;}
.ts-panel li{
  display:flex;gap:12px;align-items:flex-start;
  font-size:14.5px;line-height:1.5;padding:7px 0;
}
.ts-panel li svg{
  flex:0 0 auto;margin-top:2px;
  color:#fff;background:rgba(255,255,255,.16);border-radius:50%;padding:3px;
  width:22px;height:22px;
}
.ts-cta{
  margin-top:auto;align-self:flex-start;
  display:inline-flex;align-items:center;gap:8px;
  background:#fff;color:var(--koica);font-weight:600;font-size:14.5px;
  border-radius:50px;padding:12px 22px;
  transition:transform .3s var(--ease-out), box-shadow .3s ease;
}
.ts-panel:hover .ts-cta{transform:translateX(4px);box-shadow:0 10px 26px rgba(0,0,0,.2);}

/* Comparison table (Tracks) */
.compare-table{
  margin-top:26px;border:1px solid var(--line);border-radius:20px;
  overflow:hidden;background:#fff;
}
.ct-row{display:grid;grid-template-columns:180px 1fr 1fr;}
.ct-row > div{
  padding:16px 20px;font-size:14px;color:#22314E;line-height:1.6;
  border-top:1px solid var(--line);
}
.ct-row.ct-head > div{
  border-top:none;background:var(--koica);color:#fff;
  font-family:'Urbanist',sans-serif;font-weight:600;letter-spacing:.4px;font-size:14.5px;
}
.ct-row > .ct-label{font-weight:600;color:var(--koica);background:#F6FAFF;}
.ct-row > div[data-col]::before{content:none;}
.table-note{margin-top:12px;font-size:12.5px;color:var(--grey);}

/* Tracks teaser on Home */
.tracks-teaser{
  padding:80px var(--page-pad) 20px;background:#fff;
}
.tt-inner{max-width:1200px;margin:0 auto;}
.tt-head{margin-bottom:30px;max-width:640px;}
.tracks-teaser .track-split{min-height:420px;}

/* ============ Eligibility ============ */
.elig-stack{display:flex;flex-direction:column;gap:20px;}
.elig-card{
  position:relative;overflow:hidden;
  background:#fff;border:1px solid var(--line);border-radius:22px;padding:28px 28px 24px;
  box-shadow:0 8px 30px rgba(0,43,94,.05);
}
.elig-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;}
.elig-card.req::before{background:#0E9F5D;}
.elig-card.pri::before{background:#F5B637;}
.elig-card.pref::before{background:var(--sky);}
.elig-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px;}
.elig-head p{font-size:14px;color:var(--grey);}
.elig-chip{
  font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
  padding:6px 14px;border-radius:20px;
  color:#0E7A47;background:rgba(14,159,93,.12);
}
.elig-chip.gold{color:#9A6A00;background:rgba(245,182,55,.18);}
.elig-chip.sky{color:#0B76A8;background:rgba(57,188,242,.15);}
.elig-card ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:10px 26px;}
.elig-card li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;line-height:1.55;color:#22314E;}
.li-icon{
  flex:0 0 auto;width:28px;height:28px;border-radius:50%;
  display:grid;place-items:center;
}
.li-icon.green{color:#0E9F5D;background:rgba(14,159,93,.12);}
.li-icon.gold{color:#B07C00;background:rgba(245,182,55,.2);}
.li-icon.sky{color:#0B76A8;background:rgba(57,188,242,.16);}

.note-banner{
  background:#FFF7E4;border:1px solid #F2DFAE;color:#7A5A12;
  border-radius:16px;padding:16px 20px;font-size:14px;line-height:1.65;
}

/* ============ Apply: timeline ============ */
.timeline{display:flex;flex-direction:column;}
.tl-step{display:grid;grid-template-columns:56px 1fr;gap:18px;}
.tl-marker{display:flex;flex-direction:column;align-items:center;}
.tl-num{
  width:44px;height:44px;border-radius:50%;flex:0 0 auto;
  background:linear-gradient(140deg, var(--koica), var(--sky));
  color:#fff;display:grid;place-items:center;
  font-family:'Urbanist',sans-serif;font-weight:700;font-size:17px;
  box-shadow:0 8px 20px rgba(0,66,144,.28);
}
.tl-line{flex:1;width:2px;background:linear-gradient(180deg, var(--sky), rgba(57,188,242,.12));margin:6px 0;}
.tl-step:last-child .tl-line{display:none;}
.tl-card{
  background:#fff;border:1px solid var(--line);border-radius:20px;
  padding:22px 26px;margin-bottom:22px;
  box-shadow:0 8px 26px rgba(0,43,94,.05);
  transition:transform .3s var(--ease-out), border-color .3s ease;
}
.tl-card:hover{transform:translateX(4px);border-color:var(--sky);}
.tl-card h3{font-family:'Urbanist',sans-serif;font-size:19px;font-weight:700;color:var(--ink);margin-bottom:8px;}
.tl-card p{font-size:14.5px;color:var(--grey);line-height:1.7;}
.doc-list{list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:8px;}
.doc-list li{
  display:flex;gap:10px;align-items:flex-start;
  font-size:14px;color:#22314E;line-height:1.55;
  background:#F6FAFF;border:1px solid var(--line);border-radius:12px;padding:11px 14px;
}
.doc-list li svg{flex:0 0 auto;color:var(--koica);margin-top:1px;}
.warn-box{
  margin-top:14px;background:#FDECEC;border:1px solid #F3C2C2;color:#8A2222;
  border-radius:14px;padding:14px 18px;font-size:13.5px;line-height:1.65;font-weight:500;
}

/* Downloads */
.dl-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px;}
.dl-card{
  display:flex;align-items:center;gap:18px;flex-wrap:wrap;
  background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px 24px;
  transition:transform .3s var(--ease-out), border-color .3s ease, box-shadow .3s ease;
}
.dl-card:hover{transform:translateY(-4px);border-color:var(--sky);box-shadow:0 14px 36px rgba(57,188,242,.18);}
.dl-icon{
  width:52px;height:52px;border-radius:16px;flex:0 0 auto;
  background:rgba(0,66,144,.08);color:var(--koica);
  display:grid;place-items:center;
}
.dl-card > div:nth-child(2){flex:1;min-width:180px;}
.dl-card h3{font-family:'Urbanist',sans-serif;font-size:17px;font-weight:700;color:var(--ink);}
.dl-card p{font-size:13px;color:var(--grey);margin-top:4px;line-height:1.5;}
.dl-btn{
  display:inline-flex;align-items:center;gap:8px;flex:0 0 auto;
  background:var(--koica);color:#fff;border-radius:50px;padding:10px 18px;
  font-size:13.5px;font-weight:600;white-space:nowrap;
}

/* Contacts */
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;}
.contact-card{
  background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px;
  box-shadow:0 8px 26px rgba(0,43,94,.05);
}
.contact-tag{
  font-size:11.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
  color:#0B76A8;background:rgba(57,188,242,.14);
  padding:5px 12px;border-radius:20px;
}
.contact-card h3{font-family:'Urbanist',sans-serif;font-size:18px;font-weight:700;color:var(--ink);margin:14px 0 8px;}
.contact-card p{font-size:14px;color:var(--grey);line-height:1.7;}
.contact-card a{color:var(--koica);font-weight:600;}
.contact-card a:hover{text-decoration:underline;}

/* FAQ accordion */
.accordion{display:flex;flex-direction:column;gap:12px;max-width:840px;}
.acc-item{
  background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;
  transition:border-color .3s ease, box-shadow .3s ease;
}
.acc-item.open{border-color:var(--sky);box-shadow:0 12px 32px rgba(57,188,242,.15);}
.acc-q{
  width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:18px 22px;background:none;border:none;cursor:pointer;text-align:left;
  font-family:'Urbanist',sans-serif;font-size:16.5px;font-weight:600;color:var(--ink);
}
.acc-chev{flex:0 0 auto;color:var(--koica);transition:transform .3s var(--ease-out);}
.acc-item.open .acc-chev{transform:rotate(180deg);}
.acc-a{padding:0 22px 20px;animation:fadeUp .35s var(--ease-out) both;}
.acc-a p{font-size:14.5px;color:var(--grey);line-height:1.75;}

/* Generic scroll reveal */
[data-reveal]{opacity:0;transform:translateY(36px);}
[data-reveal].reveal{animation:fadeUp .85s var(--ease-out) forwards;}

/* ============ Entrance keyframes ============ */
@keyframes fadeDown{from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(40px);}to{opacity:1;transform:translateY(0);}}
@keyframes scaleIn{from{opacity:0;transform:scale(.85);}to{opacity:1;transform:scale(1);}}
@keyframes popIn{from{opacity:0;transform:scale(.6);}to{opacity:1;transform:scale(1);}}


/* ============ Shimmer heading (animated gradient text) ============ */
.shimmer{
  background:linear-gradient(100deg, var(--koica) 12%, var(--sky) 34%, #7FD8FF 48%, var(--sky) 62%, var(--koica) 86%);
  background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
  animation:shimmerMove 5.5s linear infinite;
}
@keyframes shimmerMove{to{background-position:-220% 0;}}

/* ============ Tracks, split panel ============ */
.split-section{padding-top:8px;}
.split{
  display:flex;gap:18px;align-items:stretch;
  min-height:520px;
}
.split-panel{
  position:relative;flex:1 1 0;min-width:0;
  display:flex;flex-direction:column;align-items:flex-start;gap:10px;
  text-align:left;cursor:pointer;font-family:'Inter',sans-serif;
  border:1px solid var(--line);border-radius:28px;
  padding:34px 32px;overflow:hidden;
  background:#fff;color:var(--ink);
  box-shadow:0 8px 30px rgba(0,43,94,.06);
  transition:flex-grow .6s var(--ease-out), background .5s ease,
             color .4s ease, box-shadow .5s ease, border-color .4s ease;
}
.split-panel::before{
  content:'';position:absolute;inset:0;z-index:0;opacity:0;
  transition:opacity .5s ease;
}
.split-panel.public::before{background:linear-gradient(150deg, var(--koica) 0%, var(--koica-deep) 100%);}
.split-panel.private::before{background:linear-gradient(150deg, #1B8FD1 0%, var(--koica) 100%);}
.split-panel > *{position:relative;z-index:1;}
.split-panel.is-active{
  flex-grow:1.9;
  color:#fff;border-color:transparent;
  box-shadow:0 26px 60px rgba(0,43,94,.28);
}
.split-panel.is-active::before{opacity:1;}

.split-badge{
  font-size:11.5px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;
  color:var(--sky);border:1px solid var(--line);
  padding:5px 12px;border-radius:20px;background:#fff;
  transition:all .4s ease;
}
.split-panel.is-active .split-badge{
  background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.3);color:#fff;
}
.split-icon{
  width:56px;height:56px;border-radius:17px;display:grid;place-items:center;
  color:var(--koica);background:linear-gradient(140deg, rgba(57,188,242,.16), rgba(0,66,144,.08));
  border:1px solid var(--line);margin-top:6px;transition:all .4s ease;
}
.split-panel.is-active .split-icon{
  color:#fff;background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.28);
}
.split-name{
  font-family:'Urbanist',sans-serif;font-weight:700;
  font-size:clamp(28px, 3.2vw, 44px);line-height:1.05;letter-spacing:-1px;
  margin-top:4px;
}
.split-tagline{font-size:15px;color:var(--grey);transition:color .4s ease;}
.split-panel.is-active .split-tagline{color:rgba(255,255,255,.85);}

.split-detail{
  max-height:0;opacity:0;overflow:hidden;
  transition:max-height .6s var(--ease-out), opacity .45s ease, margin .5s ease;
}
.split-panel.is-active .split-detail{max-height:420px;opacity:1;margin-top:10px;}
.split-blurb{font-size:15.5px;line-height:1.65;color:rgba(255,255,255,.9);max-width:56ch;}
.split-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:18px;}
.split-list li{
  display:flex;align-items:flex-start;gap:10px;
  font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.94);
}
.split-list li svg{flex:0 0 auto;margin-top:2px;color:var(--sky-soft);}
.split-places{
  display:inline-block;margin-top:20px;
  font-size:12.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;
  color:#fff;background:rgba(255,255,255,.16);
  border:1px solid rgba(255,255,255,.26);padding:7px 14px;border-radius:20px;
}
.split-hint{
  margin-top:auto;padding-top:18px;
  font-size:12px;letter-spacing:.6px;color:#94A3BC;
  transition:opacity .3s ease;
}
.split-panel.is-active .split-hint{opacity:0;}

/* dots in the comparison header */
.ct-dot{
  display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px;
  vertical-align:middle;
}
.ct-dot.pub{background:var(--koica);}
.ct-dot.priv{background:var(--sky);}


/* ============ Language switcher ============ */
.lang-wrap{position:relative;}
.lang-btn{
  display:flex;align-items:center;gap:7px;cursor:pointer;
  font-family:'Inter',sans-serif;font-size:14px;font-weight:600;
  color:var(--koica);background:#fff;
  border:1px solid var(--line);border-radius:50px;padding:8px 13px;
  transition:border-color .25s ease, background .25s ease;
}
.lang-btn:hover{border-color:var(--sky);background:#F4FAFF;}
.lang-chev{transition:transform .25s var(--ease-out);}
.lang-chev.up{transform:rotate(180deg);}
.lang-menu{
  position:absolute;right:0;top:calc(100% + 8px);z-index:50;
  list-style:none;min-width:158px;padding:6px;
  background:#fff;border:1px solid var(--line);border-radius:16px;
  box-shadow:0 18px 44px rgba(0,43,94,.16);
  animation:fadeDown .22s var(--ease-out) both;
}
.lang-opt{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;
  background:none;border:none;cursor:pointer;text-align:left;
  font-family:'Inter',sans-serif;font-size:14px;color:var(--ink);
  padding:9px 12px;border-radius:11px;
  transition:background .2s ease,color .2s ease;
}
.lang-opt:hover{background:#F2F8FE;}
.lang-opt.is-on{color:var(--koica);font-weight:600;background:#EAF4FF;}

/* inline pills (used inside the mobile menu) */
.lang-inline{display:flex;gap:8px;}
.lang-pill{
  cursor:pointer;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;
  color:var(--koica);background:#fff;border:1px solid var(--line);
  border-radius:50px;padding:9px 15px;transition:all .25s ease;
}
.lang-pill.is-on{background:var(--koica);color:#fff;border-color:var(--koica);}
.mobile-lang{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:16px 4px;border-bottom:1px solid var(--line);flex-wrap:wrap;
}
.mobile-lang-label{
  font-family:'Urbanist',sans-serif;font-size:20px;font-weight:600;color:var(--ink);
}

/* Korean has no inter-word spaces to break on, keep long strings tidy */
html[lang="ko"] h1,
html[lang="ko"] h2,
html[lang="ko"] .split-name{word-break:keep-all;letter-spacing:-.5px;}
html[lang="ko"] .eyebrow,
html[lang="ko"] .ticker-item{letter-spacing:.6px;}
/* French runs long, let big headings wrap rather than overflow */
html[lang="fr"] h1{overflow-wrap:break-word;hyphens:auto;}


/* ==========================================================================
   LOGIN
   ========================================================================== */
.login-wrap{
  min-height:100vh;display:grid;place-items:center;padding:32px 20px;
  background:
    radial-gradient(700px 520px at 78% 18%, rgba(57,188,242,.16), transparent 62%),
    radial-gradient(560px 420px at 12% 88%, rgba(0,66,144,.10), transparent 60%),
    #F7FBFF;
}
.login-card{
  width:100%;max-width:440px;background:#fff;
  border:1px solid var(--line);border-radius:28px;
  padding:38px 34px 30px;text-align:center;position:relative;
  box-shadow:0 26px 70px rgba(0,43,94,.14);
  animation:fadeUp .7s var(--ease-out) both;
}
.login-brand{display:flex;align-items:center;justify-content:center;gap:11px;margin-bottom:6px;}
.login-logo{height:26px;width:auto;object-fit:contain;}
.login-peko{
  width:84px;height:84px;margin:14px auto 6px;border-radius:50%;
  background:#EAF7FE;display:grid;place-items:center;overflow:hidden;
  box-shadow:0 0 0 3px #fff, 0 0 0 5px var(--sky);
}
.login-peko img{width:66px;height:66px;object-fit:contain;margin-top:7px;}
.login-card h1{
  font-family:'Urbanist',sans-serif;font-size:27px;font-weight:700;
  color:var(--ink);letter-spacing:-.6px;margin-top:8px;
}
.login-sub{color:var(--grey);font-size:14.5px;line-height:1.6;margin-top:9px;}
.login-form{display:flex;flex-direction:column;gap:15px;margin-top:26px;text-align:left;}
.field{display:flex;flex-direction:column;gap:7px;}
.field span{font-size:13px;font-weight:600;color:var(--ink);letter-spacing:.2px;}
.field input{
  border:1px solid #CFE0F2;border-radius:14px;padding:13px 15px;
  font-family:'Inter',sans-serif;font-size:16px;color:var(--ink);
  outline:none;transition:border-color .25s ease, box-shadow .25s ease;background:#fff;
}
.field input:focus{border-color:var(--sky);box-shadow:0 0 0 4px rgba(57,188,242,.16);}
.pin-input{letter-spacing:3px;font-weight:600;text-transform:uppercase;}
.login-btn{width:100%;justify-content:center;padding:14px;font-size:16px;margin-top:4px;}
.login-btn:disabled{opacity:.65;cursor:not-allowed;}
.login-error{
  background:#FFF1F1;border:1px solid #F6C9C9;color:#B3261E;
  border-radius:12px;padding:11px 14px;font-size:13.5px;line-height:1.5;
}
.login-help{margin-top:20px;font-size:12.5px;color:var(--grey);line-height:1.6;}
.login-back{
  display:inline-block;margin-top:16px;font-size:13.5px;color:var(--koica);font-weight:500;
}
.login-back:hover{text-decoration:underline;}

/* ==========================================================================
   PORTAL (LMS)
   ========================================================================== */
.portal{display:flex;min-height:100vh;background:#F4F8FD;}
.portal-side{
  width:264px;flex:0 0 264px;background:#fff;border-right:1px solid var(--line);
  padding:24px 18px;display:flex;flex-direction:column;gap:22px;
  position:sticky;top:0;height:100vh;
}
.portal-brand{display:flex;align-items:center;gap:10px;padding:0 8px;}
.portal-brand img{height:24px;width:auto;object-fit:contain;}
.portal-user{
  display:flex;align-items:center;gap:12px;padding:13px;
  background:linear-gradient(140deg, #EAF4FF, #F4FAFF);
  border:1px solid var(--line);border-radius:18px;
}
.portal-avatar{
  width:42px;height:42px;flex:0 0 auto;border-radius:50%;
  background:linear-gradient(140deg, var(--koica), var(--sky));color:#fff;
  display:grid;place-items:center;font-family:'Urbanist',sans-serif;
  font-weight:700;font-size:15px;letter-spacing:.5px;
}
.portal-user-text{min-width:0;}
.portal-user-text strong{
  display:block;font-size:14px;color:var(--ink);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.portal-user-text small{font-size:11.5px;color:var(--grey);}
.portal-nav{display:flex;flex-direction:column;gap:4px;flex:1;}
.portal-link{
  display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:13px;
  font-size:14.5px;font-weight:500;color:#43536E;
  transition:background .22s ease,color .22s ease;
}
.portal-link:hover{background:#F2F8FE;color:var(--koica);}
.portal-link.active{background:var(--koica);color:#fff;font-weight:600;}
.portal-logout{
  display:flex;align-items:center;gap:10px;justify-content:center;
  border:1px solid var(--line);background:#fff;cursor:pointer;
  font-family:'Inter',sans-serif;font-size:14px;font-weight:500;color:#5A6B85;
  padding:11px;border-radius:13px;transition:all .22s ease;
}
.portal-logout:hover{border-color:#F6C9C9;color:#B3261E;background:#FFF7F7;}

.portal-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.portal-topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 28px;background:#fff;border-bottom:1px solid var(--line);
}
.portal-burger{
  display:none;border:none;background:none;color:var(--koica);cursor:pointer;
  width:40px;height:40px;border-radius:11px;align-items:center;justify-content:center;
}
.portal-peko{width:34px;height:34px;object-fit:contain;margin-left:auto;}
.portal-scrim{
  position:fixed;inset:0;background:rgba(6,23,55,.4);z-index:44;
  animation:fadeDown .2s ease both;
}

.portal-page{padding:30px 32px 70px;max-width:1080px;width:100%;animation:fadeUp .55s var(--ease-out) both;}
.portal-head{margin-bottom:24px;}
.portal-eyebrow{
  font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  color:var(--sky);margin-bottom:7px;
}
.portal-head h1{
  font-family:'Urbanist',sans-serif;font-size:clamp(24px,3.4vw,34px);
  font-weight:700;color:var(--ink);letter-spacing:-.8px;line-height:1.15;
}
.portal-sub{color:var(--grey);font-size:15px;line-height:1.65;margin-top:9px;max-width:60ch;}
.portal-section{margin-top:34px;}
.portal-section h2{
  font-family:'Urbanist',sans-serif;font-size:19px;font-weight:700;
  color:var(--ink);margin-bottom:14px;
}

.portal-loading{display:grid;place-items:center;padding:80px 20px;min-height:240px;}
.spinner{
  width:34px;height:34px;border-radius:50%;
  border:3px solid #DCE8F7;border-top-color:var(--koica);
  animation:spinLoad .8s linear infinite;
}
@keyframes spinLoad{to{transform:rotate(360deg);}}
.portal-error{
  background:#FFF1F1;border:1px solid #F6C9C9;color:#B3261E;
  border-radius:14px;padding:14px 16px;font-size:14px;margin:24px 32px;
}

.portal-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:16px;}
.pcard{
  background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;
  box-shadow:0 6px 22px rgba(0,43,94,.05);
}
.progress-card{display:flex;align-items:center;gap:18px;grid-column:span 1;}
.progress-card h3{font-family:'Urbanist',sans-serif;font-size:16px;font-weight:700;color:var(--ink);}
.progress-card p{font-size:13px;color:var(--grey);margin-top:5px;line-height:1.5;}
.ring{flex:0 0 auto;}
.ring-text{
  font-family:'Urbanist',sans-serif;font-size:21px;font-weight:700;fill:var(--koica);
}
.stat-card{display:flex;flex-direction:column;gap:5px;}
.pstat{
  font-family:'Urbanist',sans-serif;font-size:34px;font-weight:700;color:var(--koica);line-height:1;
}
.pstat small{font-size:17px;color:#9AACC4;font-weight:600;}
.stat-card h3{font-size:13.5px;font-weight:600;color:var(--grey);}
.pcard-link{
  margin-top:auto;padding-top:12px;display:inline-flex;align-items:center;gap:6px;
  font-size:13px;font-weight:600;color:var(--koica);
}
.pcard-link:hover{gap:9px;}

.phase-chip{
  display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:1.2px;
  text-transform:uppercase;color:var(--koica);background:#EAF4FF;
  border:1px solid #D3E5FA;padding:4px 10px;border-radius:20px;margin-bottom:10px;
}
.next-card{
  display:flex;align-items:center;justify-content:space-between;gap:22px;
  background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px 24px;
  box-shadow:0 6px 22px rgba(0,43,94,.05);
  transition:transform .3s var(--ease-out),border-color .3s ease,box-shadow .3s ease;
}
.next-card:hover{transform:translateY(-3px);border-color:var(--sky);box-shadow:0 14px 34px rgba(57,188,242,.18);}
.next-card h3{font-family:'Urbanist',sans-serif;font-size:18px;font-weight:700;color:var(--ink);}
.next-card p{font-size:13.5px;color:var(--grey);margin-top:6px;line-height:1.55;max-width:52ch;}
.next-meta{flex:0 0 130px;text-align:right;}
.next-meta small{font-size:12px;color:var(--grey);display:block;margin-top:7px;}

.bar{height:7px;border-radius:20px;background:#E3EDF8;overflow:hidden;}
.bar span{
  display:block;height:100%;border-radius:20px;
  background:linear-gradient(90deg, var(--koica), var(--sky));
  transition:width .5s var(--ease-out);
}

.ann-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;}
.ann-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;}
.ann-tag{
  display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:1.2px;
  text-transform:uppercase;color:#7A5A00;background:#FFF4D6;
  border:1px solid #F5E3AE;padding:4px 10px;border-radius:20px;margin-bottom:10px;
}
.ann-card h3{font-family:'Urbanist',sans-serif;font-size:16px;font-weight:700;color:var(--ink);}
.ann-card p{font-size:13.5px;color:var(--grey);margin-top:7px;line-height:1.6;}

.mod-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(268px,1fr));gap:18px;}
.mod-card{
  background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;
  display:flex;flex-direction:column;box-shadow:0 6px 22px rgba(0,43,94,.05);
  transition:transform .3s var(--ease-out),border-color .3s ease,box-shadow .3s ease;
}
.mod-card:hover{transform:translateY(-4px);border-color:var(--sky);box-shadow:0 14px 34px rgba(57,188,242,.18);}
.mod-card h3{font-family:'Urbanist',sans-serif;font-size:17.5px;font-weight:700;color:var(--ink);}
.mod-card p{font-size:13.5px;color:var(--grey);margin-top:8px;line-height:1.6;flex:1;}
.mod-foot{margin-top:18px;}
.mod-foot small{font-size:12px;color:var(--grey);display:block;margin-top:7px;}
.mod-progress{margin:20px 0 24px;max-width:420px;}
.mod-progress small{font-size:13px;color:var(--grey);display:block;margin-top:8px;}

.back-link{
  display:inline-block;font-size:13.5px;color:var(--koica);font-weight:500;margin-bottom:16px;
}
.back-link:hover{text-decoration:underline;}
.lesson-list{list-style:none;display:flex;flex-direction:column;gap:10px;}
.lesson{
  display:flex;align-items:center;gap:14px;background:#fff;
  border:1px solid var(--line);border-radius:16px;padding:15px 18px;
  transition:border-color .25s ease,background .25s ease;
}
.lesson.done{background:#F4FBF6;border-color:#CDEBD6;}
.lesson-check{
  width:26px;height:26px;flex:0 0 auto;border-radius:9px;cursor:pointer;
  border:2px solid #C9D8EC;background:#fff;color:#fff;
  display:grid;place-items:center;transition:all .25s ease;
}
.lesson-check:hover{border-color:var(--sky);}
.lesson.done .lesson-check{background:#2FA05A;border-color:#2FA05A;}
.lesson-type{color:var(--koica);display:grid;place-items:center;flex:0 0 auto;}
.lesson-title{flex:1;font-size:14.5px;color:var(--ink);line-height:1.5;}
.lesson.done .lesson-title{color:#5F7A6A;}
.lesson-min{font-size:12.5px;color:var(--grey);flex:0 0 auto;}

.session-list{list-style:none;display:flex;flex-direction:column;gap:12px;}
.session{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px 20px;}
.session.present{background:#F4FBF6;border-color:#CDEBD6;}
.session-main{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.session h3{font-family:'Urbanist',sans-serif;font-size:16px;font-weight:700;color:var(--ink);}
.session small{font-size:12.5px;color:var(--grey);display:block;margin-top:4px;}
.pill{
  font-size:12px;font-weight:600;padding:7px 14px;border-radius:20px;white-space:nowrap;
}
.pill.present{background:#DFF3E6;color:#1E7A42;border:1px solid #BFE6CC;}
.pill.closed{background:#F1F5FA;color:#8A99B5;border:1px solid var(--line);}
.btn.small{padding:9px 18px;font-size:13.5px;}
.checkin-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;}
.checkin-row input{
  flex:1;min-width:160px;border:1px solid #CFE0F2;border-radius:12px;padding:10px 14px;
  font-family:'Inter',sans-serif;font-size:15px;letter-spacing:1.5px;outline:none;text-transform:uppercase;
}
.checkin-row input:focus{border-color:var(--sky);}
.checkin-err{margin-top:9px;font-size:13px;color:#B3261E;}

.res-card-button{width:100%;text-align:left;font:inherit;color:inherit;border:inherit;cursor:pointer;}
.res-card-button:disabled{cursor:wait;opacity:.75;}
.res-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}
.res-card{
  display:flex;align-items:center;gap:15px;background:#fff;
  border:1px solid var(--line);border-radius:18px;padding:20px;
  transition:transform .3s var(--ease-out),border-color .3s ease;
}
.res-card:hover{transform:translateY(-3px);border-color:var(--sky);}
.res-icon{
  width:46px;height:46px;flex:0 0 auto;border-radius:14px;display:grid;place-items:center;
  color:var(--koica);background:linear-gradient(140deg, rgba(57,188,242,.16), rgba(0,66,144,.08));
  border:1px solid var(--line);
}
.res-text{flex:1;min-width:0;}
.res-text h3{font-family:'Urbanist',sans-serif;font-size:15.5px;font-weight:700;color:var(--ink);}
.res-text p{font-size:13px;color:var(--grey);margin-top:5px;line-height:1.5;}
.res-dl{
  display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;
  color:var(--koica);background:#EAF4FF;border:1px solid #D3E5FA;
  padding:6px 11px;border-radius:20px;flex:0 0 auto;
}

@media (max-width:900px){
  .portal-side{
    position:fixed;left:0;top:0;z-index:45;transform:translateX(-100%);
    transition:transform .35s var(--ease-out);box-shadow:0 0 60px rgba(0,43,94,.2);
  }
  .portal-side.open{transform:translateX(0);}
  .portal-burger{display:flex;}
  .portal-page{padding:24px 20px 64px;}
  .portal-topbar{padding:12px 18px;}
  .progress-card{flex-direction:column;text-align:center;}
}
@media (max-width:560px){
  .login-card{padding:30px 22px 26px;border-radius:24px;}
  .next-card{flex-direction:column;align-items:flex-start;}
  .next-meta{flex:none;width:100%;text-align:left;}
  .lesson{flex-wrap:wrap;gap:10px;}
  .lesson-title{flex:1 1 100%;order:3;}
}


/* ==========================================================================
   ADMIN
   ========================================================================== */
.admin-badge{
  align-self:flex-start;font-size:10.5px;font-weight:700;letter-spacing:1.6px;
  text-transform:uppercase;color:#7A5A00;background:#FFF4D6;
  border:1px solid #F5E3AE;padding:5px 11px;border-radius:20px;margin:-8px 0 0 8px;
}
.admin-avatar{background:linear-gradient(140deg,#B8860B,#F5B01E);}
.admin-link{border:1px dashed var(--line);margin-top:6px;}
.admin-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;}

.admin-form{
  background:#fff;border:1px solid var(--sky);border-radius:20px;
  padding:24px;margin-bottom:24px;
  box-shadow:0 14px 40px rgba(57,188,242,.14);
  animation:fadeUp .4s var(--ease-out) both;
}
.admin-form h2{
  font-family:'Urbanist',sans-serif;font-size:18px;font-weight:700;
  color:var(--ink);margin-bottom:18px;
}
.form-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;}
.form-row .field{flex:1;min-width:170px;}
.field.grow{flex:2;}
.admin-form .field{margin-bottom:14px;}
.admin-form input,.admin-form select,.admin-form textarea{
  border:1px solid #CFE0F2;border-radius:12px;padding:11px 14px;
  font-family:'Inter',sans-serif;font-size:15px;color:var(--ink);
  outline:none;background:#fff;width:100%;
  transition:border-color .22s ease,box-shadow .22s ease;
}
.admin-form textarea{resize:vertical;line-height:1.55;}
.admin-form input:focus,.admin-form select:focus,.admin-form textarea:focus{
  border-color:var(--sky);box-shadow:0 0 0 3px rgba(57,188,242,.15);
}
.field-hint{font-size:12.5px;color:var(--grey);margin:-8px 0 14px;}
.form-actions{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
.btn.ghost{background:#fff;color:var(--koica);border:1px solid var(--line);}
.btn.ghost::after{background:#EAF4FF;}
.btn.ghost:hover{color:var(--koica-deep);}
.btn.danger{background:#fff;color:#B3261E;border:1px solid #F6C9C9;}
.btn.danger::after{background:#FFE8E8;}
.btn.danger:hover{color:#8C1D18;}

.lessons-editor{
  border:1px solid var(--line);border-radius:16px;padding:16px;background:#F8FBFF;margin-bottom:16px;
}
.le-head{
  display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;
  font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--grey);
}
.link-btn{
  border:none;background:none;cursor:pointer;color:var(--koica);
  font-family:'Inter',sans-serif;font-size:13px;font-weight:600;letter-spacing:0;text-transform:none;
}
.link-btn:hover{text-decoration:underline;}
.le-row{display:flex;align-items:center;gap:9px;margin-bottom:9px;}
.le-num{
  width:24px;height:24px;flex:0 0 auto;border-radius:8px;background:#E3EDF8;
  display:grid;place-items:center;font-size:12px;font-weight:700;color:var(--koica);
}
.le-row .le-title{flex:1;min-width:0;}
.le-row select{flex:0 0 118px;}
.le-row .le-min{flex:0 0 74px;}
.le-del{
  flex:0 0 auto;width:30px;height:30px;border-radius:9px;cursor:pointer;
  border:1px solid var(--line);background:#fff;color:#B3261E;font-size:18px;line-height:1;
}
.le-del:hover{background:#FFF3F3;border-color:#F6C9C9;}

.admin-list{display:flex;flex-direction:column;gap:12px;}
.admin-row{
  display:flex;align-items:flex-start;justify-content:space-between;gap:18px;
  background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;
  transition:border-color .25s ease;
}
.admin-row:hover{border-color:var(--sky);}
.ar-main{min-width:0;flex:1;}
.ar-tags{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;}
.ar-main h3{font-family:'Urbanist',sans-serif;font-size:17px;font-weight:700;color:var(--ink);}
.ar-main p{font-size:13.5px;color:var(--grey);margin-top:6px;line-height:1.55;}
.ar-main small{font-size:12px;color:#8A99B5;display:block;margin-top:8px;}
.ar-url{word-break:break-all;color:var(--koica) !important;}
.ar-actions{display:flex;gap:8px;flex:0 0 auto;flex-wrap:wrap;}
.track-chip{
  font-size:10.5px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;
  padding:4px 10px;border-radius:20px;border:1px solid;
}
.track-chip.both{color:#5A6B85;background:#F1F5FA;border-color:var(--line);}
.track-chip.public{color:var(--koica);background:#EAF4FF;border-color:#D3E5FA;}
.track-chip.private{color:#0B6E8F;background:#E4F7FE;border-color:#BEE9F8;}

.admin-search{
  width:100%;max-width:380px;margin-bottom:18px;
  border:1px solid #CFE0F2;border-radius:50px;padding:11px 18px;
  font-family:'Inter',sans-serif;font-size:15px;outline:none;
}
.admin-search:focus{border-color:var(--sky);}
.ppl-table{
  background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;
}
.ppl-row{
  display:grid;grid-template-columns:1.6fr .9fr 1fr .9fr 1.3fr;gap:14px;
  padding:14px 18px;border-top:1px solid var(--line);align-items:center;font-size:14px;
}
.ppl-row:first-child{border-top:none;}
.ppl-head{
  background:var(--koica);color:#fff;font-family:'Urbanist',sans-serif;
  font-weight:600;font-size:13.5px;letter-spacing:.4px;
}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--koica);}
.mini-badge{
  margin-left:8px;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
  color:#7A5A00;background:#FFF4D6;border:1px solid #F5E3AE;padding:2px 7px;border-radius:20px;
}
.ppl-prog{display:flex;align-items:center;gap:10px;}
.ppl-prog .bar{flex:1;min-width:60px;}
.ppl-prog small{font-size:12px;color:var(--grey);flex:0 0 auto;}
.ppl-empty{padding:26px 18px;text-align:center;color:var(--grey);font-size:14px;}

@media (max-width:820px){
  .ppl-row{grid-template-columns:1fr;gap:6px;padding:16px 18px;}
  .ppl-head{display:none;}
  .ppl-row > span::before{
    content:attr(data-c) ": ";font-weight:700;color:#8A99B5;font-size:12px;
  }
  .admin-row{flex-direction:column;}
  .ar-actions{width:100%;}
  .le-row{flex-wrap:wrap;}
  .le-row .le-title{flex:1 1 100%;order:1;}
}

/* ============ Responsive ============ */
/* Nothing may push the page sideways */
html,body{max-width:100%;}
.page{overflow-x:clip;}
.contact-card p,.contact-card a,.footer-links{overflow-wrap:anywhere;}

@media (max-width:1440px){
  :root{--stage-scale:.9;}
}
@media (max-width:1280px){
  :root{--stage-scale:.78;--page-pad:48px;}
  .hero{gap:0;}
  .header-left{gap:28px;}
  .desktop-nav{gap:20px;}
}
/* Six nav links + logo + Log In + Apply stop fitting well before 768px,
   so the hamburger takes over here instead. */
@media (max-width:1120px){
  .desktop-nav{display:none;}
  .lang-wrap{display:none;}
  .header-right .login-link{display:none;}
  .menu-toggle{display:flex;}
}
@media (max-width:1024px){
  :root{--stage-scale:.72;--page-pad:32px;}
  .hero{flex-direction:column;padding-top:16px;text-align:center;gap:8px;}
  .hero-left{flex:none;padding-top:6px;max-width:640px;}
  .hero h1{min-height:0;}
  .hero-cta{justify-content:center;}
  .cursor-tag{display:none;}
  .hero-right{margin:8px auto 0;}
  .after-grid{grid-template-columns:repeat(2,1fr);}
  .contact-grid{grid-template-columns:1fr;}
}
@media (max-width:900px){
  /* Tracks: stack the panels, both fully open (no hover on touch) */
  .split{flex-direction:column;min-height:0;gap:16px;}
  .split-panel{flex:none;padding:28px 24px;cursor:default;
    color:#fff;border-color:transparent;box-shadow:0 18px 44px rgba(0,43,94,.22);}
  .split-panel.is-active{flex:none;box-shadow:0 18px 44px rgba(0,43,94,.22);}
  .split-panel::before{opacity:1;}
  .split-hint{display:none;}
  .split-detail{max-height:none;opacity:1;margin-top:10px;}
  .split-panel .split-badge{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.3);color:#fff;}
  .split-panel .split-icon{color:#fff;background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.28);}
  .split-panel .split-tagline{color:rgba(255,255,255,.85);}

  .roadmap{grid-template-columns:1fr;}
  .stats-band{grid-template-columns:repeat(2,1fr);gap:26px 14px;padding:30px 22px;}
  .section{padding:30px 0;}
  .section.alt{padding:34px clamp(18px,4vw,32px);margin:18px 0;}
  .cta-card{flex-direction:column;align-items:flex-start;padding:26px 24px;}
}
@media (max-width:768px){
  :root{--stage-scale:.55;}
  .hub-head{flex-direction:column;align-items:flex-start;text-align:left;}
  .hub-peko{width:120px;height:120px;border-radius:26px;}
  .hub-peko img{width:96px;height:96px;}
  footer{flex-direction:column;align-items:flex-start;}
  .dl-grid{grid-template-columns:1fr;}
  .elig-card ul{grid-template-columns:1fr;}
  /* comparison table -> stacked cards */
  .ct-row{grid-template-columns:1fr;}
  .ct-row.ct-head{display:none;}
  .ct-row > .ct-label{background:var(--koica);color:#fff;font-family:'Urbanist',sans-serif;font-weight:700;}
  .ct-row > div[data-col]::before{
    content:attr(data-col);
    display:block;font-size:11px;font-weight:700;letter-spacing:1px;
    text-transform:uppercase;color:var(--sky);margin-bottom:5px;
  }
  .after-head{flex-direction:column;align-items:flex-start;}
  .after-peko{align-self:center;}
  .page-hero{padding:38px 0 20px;}
}
@media (max-width:640px){
  .after-grid{grid-template-columns:1fr;}
  .elig-head{gap:10px;}
  .tl-card{padding:20px 18px;}
  .dl-card{padding:20px;}
  .dl-btn{width:100%;justify-content:center;}
  .acc-q{padding:16px 18px;font-size:15.5px;}
  .acc-a{padding:0 18px 18px;}
}
@media (max-width:560px){
  :root{--stage-scale:.44;--page-pad:20px;}
  .header-right{gap:12px;}
  .header-right .btn-border-wrap{display:none;}
  .logo-img{height:24px;}
  .logo-ylp{font-size:16px;}
  .hero-cta .btn.btn-lg{width:100%;justify-content:center;}
  .hero-cta .btn-border-wrap{width:100%;}
  .ticker-track{gap:40px;}
  .ticker-item{font-size:14px;gap:8px;}
  .ticker-item img{width:28px;height:20px;}
  .hub{padding-top:64px;padding-bottom:72px;}
  /* Apply timeline: tighter rail */
  .tl-step{grid-template-columns:40px 1fr;gap:12px;}
  .tl-num{width:36px;height:36px;font-size:14.5px;}
  /* CTA buttons go full width so they never overflow */
  .cta-actions{width:100%;flex-direction:column;align-items:stretch;}
  .cta-actions .btn{width:100%;justify-content:center;}
  .stats-band{padding:26px 18px;}
  .split-panel{padding:24px 20px;border-radius:24px;}
  .section.alt{border-radius:22px;}
  .chat-panel{
    right:0;left:0;bottom:0;width:100vw;height:min(78dvh, 560px);
    border-radius:24px 24px 0 0;
  }
  .chat-fab{right:18px;bottom:18px;width:58px;height:58px;}
  .chat-fab img{width:42px;height:42px;}
}
@media (max-width:400px){
  :root{--stage-scale:.38;}
  .stats-band{grid-template-columns:1fr;gap:20px;}
  .split-list li{font-size:14px;}
  .ct-row > div{padding:14px 16px;}
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;}
  .flag,.hero-cta,.ticker-section,.hub-head,.hub-card,.page > *{opacity:1 !important;transform:none !important;}
}

/* ============ Theme + visual accessibility ============ */
html{color-scheme:light;}html[data-theme="dark"]{color-scheme:dark;--ink:#F4F8FF;--grey:#B2BED1;--line:#29405F;--white:#101B2B;--koica:#69B8FF;--koica-deep:#B9DEFF;--sky:#54C7F7;--sky-soft:#173E58;}
html[data-theme="dark"] body{background:#08111E;color:var(--ink);}
html[data-theme="dark"] .app{background:radial-gradient(800px 600px at 80% 42%,rgba(57,188,242,.09),transparent 62%),radial-gradient(520px 420px at 10% 90%,rgba(0,102,204,.12),transparent 60%),#08111E;}
html[data-theme="dark"] header,html[data-theme="dark"] .mobile-menu,html[data-theme="dark"] footer,html[data-theme="dark"] .portal-side,html[data-theme="dark"] .portal-topbar,html[data-theme="dark"] .pcard,html[data-theme="dark"] .next-card,html[data-theme="dark"] .ann-card,html[data-theme="dark"] .mod-card,html[data-theme="dark"] .lesson,html[data-theme="dark"] .session,html[data-theme="dark"] .res-card,html[data-theme="dark"] .admin-form,html[data-theme="dark"] .admin-row,html[data-theme="dark"] .ppl-table,html[data-theme="dark"] .login-card,html[data-theme="dark"] .contact-card,html[data-theme="dark"] .dl-card,html[data-theme="dark"] .elig-card,html[data-theme="dark"] .faq-item,html[data-theme="dark"] .tl-card,html[data-theme="dark"] .hub-card,html[data-theme="dark"] .cta-card{background:#101B2B;color:var(--ink);border-color:var(--line);}
html[data-theme="dark"] .portal{background:#08111E;}html[data-theme="dark"] .portal-user{background:linear-gradient(140deg,#102946,#102237);}html[data-theme="dark"] .portal-link{color:#C6D2E4;}html[data-theme="dark"] .portal-link:hover{background:#142A43;color:#8FD0FF;}html[data-theme="dark"] .portal-link.active{background:#1165AE;color:#fff;}
html[data-theme="dark"] .portal-logout,html[data-theme="dark"] .lesson-check,html[data-theme="dark"] .le-del,html[data-theme="dark"] .btn.ghost,html[data-theme="dark"] .btn.danger{background:#111F31;color:#D6E3F4;border-color:var(--line);}html[data-theme="dark"] .lesson.done{background:#102A22;border-color:#285B47;}html[data-theme="dark"] .lesson.done .lesson-title{color:#B9D9C6;}html[data-theme="dark"] .lessons-editor{background:#0C1725;border-color:var(--line);}html[data-theme="dark"] .le-num{background:#17304B;color:#9CD5FF;}
html[data-theme="dark"] .field input,html[data-theme="dark"] .field select,html[data-theme="dark"] .field textarea,html[data-theme="dark"] .admin-form input,html[data-theme="dark"] .admin-form select,html[data-theme="dark"] .admin-form textarea,html[data-theme="dark"] .admin-search,html[data-theme="dark"] .checkin-row input{background:#0A1523;color:var(--ink);border-color:#38506E;}html[data-theme="dark"] .phase-chip,html[data-theme="dark"] .res-dl{background:#122D47;border-color:#244E71;color:#91D0FF;}html[data-theme="dark"] .bar{background:#22354C;}html[data-theme="dark"] .ann-tag{background:#382E11;border-color:#65511B;color:#FFD878;}html[data-theme="dark"] .ppl-head{background:#123B67;color:#fff;}html[data-theme="dark"] .logo-divider{background:var(--line);}html[data-theme="dark"] .ring-text{fill:#8ECFFF;}html[data-theme="dark"] .nav-link{color:#D9E4F2;}html[data-theme="dark"] .nav-link.active,html[data-theme="dark"] .login-link{color:#90CFFF;}html[data-theme="dark"] .mobile-menu a{color:#EAF2FC;border-color:var(--line);}
.access-tools{position:fixed;left:18px;bottom:18px;z-index:120;display:flex;gap:9px;align-items:flex-end}.access-fab{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line);background:#fff;color:var(--koica);cursor:pointer;box-shadow:0 8px 28px rgba(0,43,94,.16);transition:transform .2s ease,border-color .2s ease}.access-fab:hover{transform:translateY(-2px);border-color:var(--sky)}html[data-theme="dark"] .access-fab{background:#122033;color:#9BD5FF;border-color:#36506F;box-shadow:0 8px 28px rgba(0,0,0,.34)}.access-panel{position:absolute;left:0;bottom:56px;width:min(340px,calc(100vw - 36px));background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:0 22px 60px rgba(0,43,94,.22);color:var(--ink)}html[data-theme="dark"] .access-panel{background:#101B2B;border-color:#38506D;box-shadow:0 22px 60px rgba(0,0,0,.42)}.access-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--line)}.access-panel-head strong{font-family:'Urbanist',sans-serif;font-size:17px;display:block}.access-panel-head small,.access-toggle small{display:block;color:var(--grey);font-size:11.5px;line-height:1.45;margin-top:3px;font-weight:400}.access-close{width:30px;height:30px;border:none;border-radius:9px;background:transparent;color:var(--grey);font-size:23px;line-height:1;cursor:pointer}.access-close:hover{background:rgba(57,188,242,.12);color:var(--koica)}.access-group{padding:13px 0 11px}.access-label{font-size:12px;font-weight:700;color:var(--grey);display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.8px}.access-segmented{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.access-segmented button,.access-read,.access-reset{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:10px;padding:9px 10px;cursor:pointer;font-weight:600}html[data-theme="dark"] .access-segmented button,html[data-theme="dark"] .access-read,html[data-theme="dark"] .access-reset{background:#0B1625;border-color:#38506D;color:var(--ink)}.access-segmented button.active{background:var(--koica);color:#fff;border-color:var(--koica)}.access-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line);cursor:pointer}.access-toggle strong{font-size:13.5px}.access-toggle input{width:19px;height:19px;accent-color:var(--koica);flex:0 0 auto}.access-read{width:100%;margin-top:10px;background:var(--koica);color:#fff;border-color:var(--koica)}.access-reset{width:100%;margin-top:8px;font-size:12.5px;color:var(--grey)}.lesson-title strong{display:block;font-weight:600}.lesson-meta{display:block;color:var(--grey);font-size:11.5px;line-height:1.45;margin-top:3px;font-weight:400}.le-row .le-time{flex:0 0 120px}.le-row .le-facilitator{flex:0 0 190px}
html[data-text-size="large"] body{zoom:1.08}html[data-text-size="xlarge"] body{zoom:1.16}html[data-grayscale="on"] body{filter:grayscale(1)}html[data-underline="on"] a{text-decoration:underline!important;text-underline-offset:3px}html[data-reduce-motion="on"] *,html[data-reduce-motion="on"] *::before,html[data-reduce-motion="on"] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
html[data-contrast="high"]{--ink:#000;--grey:#161616;--line:#000;--koica:#003A80;--sky:#006EA8}html[data-theme="dark"][data-contrast="high"]{--ink:#fff;--grey:#fff;--line:#fff;--koica:#7FC8FF;--sky:#A9E5FF}html[data-contrast="high"] body{background:#fff;color:#000}html[data-theme="dark"][data-contrast="high"] body{background:#000;color:#fff}
@media (max-width:560px){.access-tools{left:12px;bottom:12px}.access-fab{width:42px;height:42px}.access-panel{bottom:52px}html[data-text-size="large"] body{zoom:1.04}html[data-text-size="xlarge"] body{zoom:1.08}.le-row .le-time,.le-row .le-facilitator{flex:1 1 140px}}


/* Module PowerPoint attachments */
.module-presentations-editor{border:1px solid var(--line);border-radius:16px;padding:16px;background:#F8FBFF;margin-bottom:16px}.module-presentation-upload{margin-bottom:8px!important}.presentation-file-list{display:flex;flex-direction:column;gap:8px;margin-top:10px}.presentation-file-list.pending{margin-bottom:12px}.presentation-list-label{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--grey);margin-bottom:2px}.presentation-file-row{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:#fff;border-radius:12px;padding:9px 10px;font-size:13px;color:var(--ink)}.presentation-file-row>span:nth-child(2){flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.presentation-file-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#D95C35;color:#fff;font-weight:800;font-size:14px;flex:0 0 auto}.module-presentations{margin:2px 0 24px}.module-presentations-head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:10px}.module-presentations-head h2{font-family:'Urbanist',sans-serif;font-size:18px;color:var(--ink)}.module-presentation-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.module-presentation-card{display:flex;align-items:center;gap:12px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:14px;padding:13px 14px;cursor:pointer;color:var(--ink);transition:border-color .2s ease,transform .2s ease}.module-presentation-card:hover{border-color:var(--sky);transform:translateY(-1px)}.module-presentation-card:disabled{opacity:.65;cursor:wait}.module-presentation-name{flex:1;min-width:0}.module-presentation-name strong{display:block;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.module-presentation-name small{display:block;color:var(--grey);font-size:11.5px;margin-top:3px}.module-presentation-action{font-size:12px;color:var(--koica);font-weight:700;white-space:nowrap}html[data-theme="dark"] .module-presentations-editor{background:#0C1725;border-color:var(--line)}html[data-theme="dark"] .presentation-file-row,html[data-theme="dark"] .module-presentation-card{background:#101B2B;border-color:var(--line)}
`;
