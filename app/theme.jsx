// Extracted from app/page.jsx so /login and /signup share the same "forge"
// design tokens and card styles instead of duplicating them.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700;800;900&family=Spline+Sans+Mono:wght@400;500;600;700&display=swap');

:root{
  --black:#0c0807; --f900:#140d0b; --f800:#1d1411; --f700:#281a15;
  --line:#3a261d; --ember:#c9251c; --ember2:#f0ab33; --flame:#e02d24;
  --gold:#f0ab33; --ash:#b0a193; --bone:#f3ece1; --steel:#6f8a99;
  --display:'Anton',sans-serif; --body:'Archivo',sans-serif; --mono:'Spline Sans Mono',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
.ign{background:var(--black);color:var(--bone);font-family:var(--body);
  min-height:100vh;overflow-x:hidden;position:relative;-webkit-font-smoothing:antialiased}
.ign::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px;position:relative;z-index:3}

/* nav */
.nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);
  background:rgba(12,9,8,.82);border-bottom:1px solid var(--line)}
.nav-in{display:flex;align-items:center;justify-content:space-between;height:78px}
.logo{display:flex;align-items:center;gap:11px;cursor:pointer;background:none;border:none;padding:0}
.logo-word{font-family:var(--display);font-size:23px;letter-spacing:.06em;color:var(--bone);line-height:1;text-transform:uppercase}
.logo-word b{color:var(--gold);font-weight:400}
.nav-links{display:flex;align-items:center;gap:6px}
.nlink{background:none;border:none;color:var(--ash);font-family:var(--mono);font-size:12px;
  letter-spacing:.08em;font-weight:500;padding:12px 14px;cursor:pointer;border-radius:7px;transition:.18s;min-height:44px}
.nlink:hover{color:var(--bone);background:var(--f800)}
.nlink.on{color:var(--ember2)}
.btn{font-family:var(--mono);font-weight:700;letter-spacing:.06em;font-size:12.5px;cursor:pointer;min-height:44px;
  border:none;border-radius:9px;padding:12px 20px;transition:.2s;text-transform:uppercase}
.btn-primary{background:linear-gradient(150deg,var(--flame),var(--ember));color:#fff;
  box-shadow:0 8px 26px rgba(224,45,36,.32)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 34px rgba(224,45,36,.5)}
.btn-ghost{background:transparent;color:var(--bone);border:1px solid var(--line)}
.btn-ghost:hover{border-color:var(--ember);color:var(--ember2)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}

/* hero */
.hero{position:relative;padding:64px 0 78px;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0;overflow:hidden}
.hero-bg-img{position:absolute;top:50%;left:50%;width:100%;height:120%;min-width:100%;min-height:120%;
  object-fit:cover;object-position:center 40%;transform:translate(-50%,-50%) translateY(var(--parallax-y,0px));
  will-change:transform;transition:none}
.hero-bg-overlay{position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(12,8,7,.75) 0%,rgba(12,8,7,.85) 40%,rgba(12,8,7,.92) 100%);
  z-index:1}
@media(prefers-reduced-motion:reduce){.hero-bg-img{transform:translate(-50%,-50%)}}
.hero-in{display:flex;flex-direction:column;align-items:center;text-align:center}
.hero-logo{height:150px;width:auto;margin-bottom:26px;filter:drop-shadow(0 6px 30px rgba(224,45,36,.35))}
.hero-glow{position:absolute;top:-180px;left:50%;transform:translateX(-50%);width:760px;height:540px;
  background:radial-gradient(ellipse,rgba(224,45,36,.32),transparent 62%);filter:blur(36px);pointer-events:none;z-index:2}
.hero-glow2{position:absolute;bottom:-120px;left:50%;transform:translateX(-50%);width:540px;height:420px;
  background:radial-gradient(circle,rgba(150,22,16,.3),transparent 64%);filter:blur(40px);pointer-events:none;z-index:2}
.eyebrow{display:inline-flex;align-items:center;gap:9px;font-family:var(--mono);font-size:11.5px;
  letter-spacing:.28em;color:var(--ember2);font-weight:600;text-transform:uppercase;margin-bottom:26px;
  border:1px solid var(--gold);padding:9px 18px;border-radius:30px;background:rgba(240,171,51,.06)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 10px var(--gold);
  animation:flick 2.2s infinite}
@keyframes flick{0%,100%{opacity:1}45%{opacity:.4}}
h1.hero-h{font-family:var(--display);font-size:clamp(46px,8vw,104px);line-height:.94;
  letter-spacing:.01em;text-transform:uppercase;color:var(--bone)}
.hero-h .lit{color:var(--flame)}
.hero-h .at{color:var(--gold)}
.hero-sub{color:var(--ash);font-size:18px;max-width:50ch;margin:28px auto 34px;line-height:1.55}
.hero-cta{display:flex;gap:13px;flex-wrap:wrap;justify-content:center}
.reveal{opacity:0;transform:translateY(26px);animation:rise .8s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes rise{to{opacity:1;transform:none}}
.d1{animation-delay:.05s}.d2{animation-delay:.16s}.d3{animation-delay:.28s}.d4{animation-delay:.4s}.d5{animation-delay:.52s}

/* stat strip */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);
  border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:60px;width:100%}
.stat{background:var(--f900);padding:26px 20px;text-align:center}
.stat .n{font-family:var(--display);font-size:38px;color:var(--ember2);line-height:1}
.stat .l{font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;color:var(--ash);
  text-transform:uppercase;margin-top:9px}

/* sections */
.section{padding:84px 0;position:relative}
.kicker{font-family:var(--mono);font-size:11.5px;letter-spacing:.26em;color:var(--ember2);
  text-transform:uppercase;font-weight:600;margin-bottom:14px}
h2.sh{font-family:var(--display);font-size:clamp(32px,5vw,58px);line-height:.98;text-transform:uppercase;letter-spacing:.01em}
.sh-sub{color:var(--ash);font-size:16px;margin-top:14px;max-width:54ch;line-height:1.5}

.props{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:42px}
.prop{display:flex;gap:15px;align-items:flex-start;background:var(--f900);border:1px solid var(--line);
  border-radius:13px;padding:22px 24px;transition:.2s}
.prop:hover{border-color:var(--ember);transform:translateY(-3px)}
.prop .ic{flex:none;width:40px;height:40px;border-radius:10px;display:grid;place-items:center;
  background:linear-gradient(150deg,rgba(224,45,36,.18),rgba(150,22,16,.08));color:var(--ember2)}
.prop p{color:var(--ash);font-size:15px;line-height:1.5;font-weight:500}

.three{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:46px}
.big{background:var(--f900);border:1px solid var(--line);border-radius:16px;padding:34px 28px;text-align:center}
.big .n{font-family:var(--display);font-size:62px;color:transparent;line-height:1;
  background:linear-gradient(120deg,var(--gold),var(--ember));-webkit-background-clip:text;background-clip:text}
.big .t{font-family:var(--display);font-size:18px;letter-spacing:.02em;text-transform:uppercase;margin:8px 0 10px}
.big p{color:var(--ash);font-size:14px;line-height:1.5}

.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:46px}
.step{position:relative;background:var(--f900);border:1px solid var(--line);border-radius:16px;padding:30px 26px}
.step .num{font-family:var(--display);font-size:54px;color:var(--f700);line-height:.8;position:absolute;top:18px;right:22px}
.step h4{font-family:var(--display);font-size:21px;letter-spacing:.02em;text-transform:uppercase;margin-bottom:12px;color:var(--ember2)}
.step p{color:var(--ash);font-size:14.5px;line-height:1.55;position:relative}

/* coaching feature */
.coaching-feature{display:grid;grid-template-columns:1fr 1.2fr;gap:40px;align-items:center;margin-bottom:50px}
.coaching-img{border-radius:20px;overflow:hidden;aspect-ratio:3/4;position:relative}
.coaching-img img{width:100%;height:100%;object-fit:cover;object-position:center top}
.coaching-text h3{font-family:var(--display);font-size:clamp(28px,4vw,42px);text-transform:uppercase;line-height:.96;margin-bottom:18px}
.coaching-text p{color:var(--ash);font-size:16px;line-height:1.6;margin-bottom:18px}
.coaching-text .highlight{color:var(--ember2);font-weight:600}
@media(max-width:860px){.coaching-feature{grid-template-columns:1fr;gap:28px}.coaching-img{aspect-ratio:4/3;max-height:320px}}
@media(max-width:500px){.coaching-img{max-height:260px}}

/* pricing */
.price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:46px}
.pcard{background:var(--f900);border:1px solid var(--line);border-radius:16px;padding:30px 26px;position:relative;transition:.2s}
.pcard:hover{transform:translateY(-4px)}
.pcard.feat{border-color:var(--ember);background:linear-gradient(180deg,rgba(224,45,36,.08),var(--f900))}
.pbadge{position:absolute;top:-11px;left:26px;font-family:var(--mono);font-size:10px;letter-spacing:.16em;
  background:linear-gradient(150deg,var(--flame),var(--ember));color:#fff;padding:5px 12px;border-radius:20px;font-weight:700;text-transform:uppercase}
.pcard .pname{font-family:var(--display);font-size:24px;text-transform:uppercase;letter-spacing:.02em}
.pcard .pamt{font-family:var(--display);font-size:46px;color:var(--ember2);margin:6px 0 2px}
.pcard .pamt span{font-family:var(--mono);font-size:13px;color:var(--ash);font-weight:500}
.pcard .pdesc{color:var(--ash);font-size:13.5px;margin-bottom:18px}
.pcard ul{list-style:none;margin-bottom:22px}
.pcard li{display:flex;gap:9px;align-items:center;font-size:14px;color:var(--bone);padding:6px 0;font-weight:500}
.pcard li svg{flex:none;color:var(--ember)}

/* CTA band */
.band{background:linear-gradient(120deg,var(--flame),var(--ember));border-radius:22px;
  padding:62px 40px;text-align:center;position:relative;overflow:hidden;margin:0 auto}
.band h2{font-family:var(--display);font-size:clamp(34px,5vw,60px);color:#fff;text-transform:uppercase;line-height:.98}
.band p{color:rgba(255,255,255,.9);margin:14px 0 28px;font-size:17px;font-weight:500}
.band .btn-ghost{background:#fff;color:var(--flame);border:none}
.band .btn-ghost:hover{transform:translateY(-2px)}

/* footer */
.foot{border-top:1px solid var(--line);padding:54px 0 40px;margin-top:30px}
.foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:40px}
.foot h5{font-family:var(--mono);font-size:11px;letter-spacing:.2em;color:var(--ember2);text-transform:uppercase;margin-bottom:16px}
.foot a,.foot p{color:var(--ash);font-size:14px;display:block;margin-bottom:9px;text-decoration:none;line-height:1.5}
.foot a:hover{color:var(--bone)}
.foot-bottom{margin-top:40px;padding-top:22px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:11px;color:var(--ash);letter-spacing:.05em;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}

/* ---------- booking ---------- */
.page{padding:48px 0 90px;min-height:80vh}
.page-head{text-align:center;margin-bottom:38px}
.page-head h1{font-family:var(--display);font-size:clamp(36px,6vw,62px);text-transform:uppercase;line-height:1}
.page-head p{color:var(--ash);margin-top:12px;font-size:16px}
.steps-bar{display:flex;align-items:center;justify-content:center;gap:0;margin:0 auto 40px;max-width:560px}
.sbubble{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-family:var(--mono);
  font-weight:700;font-size:13px;background:var(--f800);border:1px solid var(--line);color:var(--ash);flex:none}
.sbubble.on{background:linear-gradient(150deg,var(--flame),var(--ember));color:#fff;border-color:transparent}
.sbubble.done{background:var(--f700);color:var(--ember2);border-color:var(--ember)}
.sline{height:2px;flex:1;background:var(--line);min-width:24px}
.sline.on{background:var(--ember)}
.card{background:var(--f900);border:1px solid var(--line);border-radius:18px;padding:34px;max-width:760px;margin:0 auto}
.opt-grid{display:grid;gap:13px}
.opt{display:flex;align-items:center;gap:18px;text-align:left;width:100%;background:var(--f800);
  border:1.5px solid var(--line);border-radius:13px;padding:20px 22px;cursor:pointer;transition:.18s;color:var(--bone)}
.opt:hover{border-color:var(--ember2)}
.opt.sel{border-color:var(--ember);background:linear-gradient(120deg,rgba(224,45,36,.1),var(--f800))}
.opt .oicon{width:46px;height:46px;border-radius:12px;flex:none;display:grid;place-items:center;
  background:linear-gradient(150deg,rgba(224,45,36,.2),rgba(150,22,16,.06));color:var(--ember2)}
.opt .otext{display:flex;flex-direction:column;gap:0;flex:1;min-width:0}
.opt .otitle{display:block;font-family:var(--display);font-size:20px;letter-spacing:.02em;text-transform:uppercase;line-height:1.2}
.opt .otag{display:inline-block;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:var(--ash);text-transform:uppercase;
  margin-top:8px;padding:4px 8px;background:rgba(176,161,147,.1);border-radius:4px}
.opt .odesc{display:block;font-size:13.5px;color:var(--ash);margin-top:10px;line-height:1.5}
.opt .oprice{margin-left:auto;font-family:var(--display);font-size:26px;color:var(--ember2);text-align:right;flex:none}
.opt .oprice small{display:block;font-family:var(--mono);font-size:10px;color:var(--ash);font-weight:500}

.date-row{display:flex;gap:9px;overflow-x:auto;padding-bottom:10px;margin-bottom:26px}
.datechip{flex:none;width:74px;background:var(--f800);border:1.5px solid var(--line);border-radius:12px;
  padding:13px 0;text-align:center;cursor:pointer;transition:.16s}
.datechip:hover{border-color:var(--ember2)}
.datechip.sel{border-color:var(--ember);background:linear-gradient(150deg,rgba(224,45,36,.16),var(--f800))}
.datechip .dow{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--ash);text-transform:uppercase}
.datechip .dnum{font-family:var(--display);font-size:26px;line-height:1;margin:4px 0}
.datechip .dmo{font-family:var(--mono);font-size:9.5px;color:var(--ash);text-transform:uppercase}
.datechip.sel .dnum{color:var(--ember2)}
.slot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:11px}
.slot{background:var(--f800);border:1.5px solid var(--line);border-radius:12px;padding:15px 14px;cursor:pointer;
  text-align:left;transition:.16s;color:var(--bone)}
.slot:hover:not(:disabled){border-color:var(--ember2)}
.slot.sel{border-color:var(--ember);background:linear-gradient(150deg,rgba(224,45,36,.16),var(--f800))}
.slot:disabled{opacity:.32;cursor:not-allowed}
.slot .stime{font-family:var(--display);font-size:19px;letter-spacing:.01em}
.slot .stype{font-family:var(--mono);font-size:10px;color:var(--ash);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.slot .sspots{font-family:var(--mono);font-size:11px;margin-top:7px;font-weight:600}
.spots-ok{color:var(--steel)}.spots-low{color:var(--gold)}.spots-none{color:var(--flame)}
.empty-day{text-align:center;color:var(--ash);font-family:var(--mono);font-size:13px;padding:30px}

.field{margin-bottom:18px}
.field label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--ash);
  text-transform:uppercase;margin-bottom:7px}
.field input{width:100%;background:var(--f800);border:1.5px solid var(--line);border-radius:11px;
  padding:13px 15px;color:var(--bone);font-family:var(--body);font-size:16px;outline:none;transition:.16s;min-height:48px}
.field input:focus{border-color:var(--ember)}
.field input::placeholder{color:#6b5d52}

.summary{background:var(--f800);border:1px solid var(--line);border-radius:13px;padding:22px 24px;margin-bottom:24px}
.srow{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);font-size:15px}
.srow:last-child{border:none}
.srow .k{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--ash);text-transform:uppercase}
.srow .v{font-weight:600}
.srow.total .v{font-family:var(--display);font-size:24px;color:var(--ember2)}

.nav-btns{display:flex;justify-content:space-between;gap:12px;margin-top:28px;max-width:760px;margin-left:auto;margin-right:auto}

.confirm{text-align:center;max-width:560px;margin:0 auto}
.confirm .seal{width:90px;height:90px;border-radius:50%;margin:0 auto 24px;display:grid;place-items:center;
  background:linear-gradient(150deg,var(--flame),var(--ember));box-shadow:0 0 40px rgba(224,45,36,.5);
  animation:pop .5s cubic-bezier(.2,1.4,.4,1)}
@keyframes pop{from{transform:scale(.5);opacity:0}}
.confirm h1{font-family:var(--display);font-size:48px;text-transform:uppercase;margin-bottom:10px}
.confirm .ref{font-family:var(--mono);font-size:13px;letter-spacing:.16em;color:var(--ember2);margin:16px 0 4px}

/* ---------- admin ---------- */
.adm{padding:34px 0 80px;min-height:90vh}
.adm-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px;flex-wrap:wrap;gap:14px}
.adm-top h1{font-family:var(--display);font-size:38px;text-transform:uppercase;line-height:1}
.adm-top h1 small{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.2em;color:var(--ember2);margin-top:5px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:26px}
.kpi{background:var(--f900);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.kpi .kn{font-family:var(--display);font-size:40px;color:var(--ember2);line-height:1}
.kpi .kl{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;color:var(--ash);text-transform:uppercase;margin-top:8px}
.kpi .kbar{height:5px;border-radius:4px;background:var(--f700);margin-top:12px;overflow:hidden}
.kpi .kbar i{display:block;height:100%;background:linear-gradient(90deg,var(--ember),var(--gold))}
.filters{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:18px;align-items:center}
.fbtn{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;background:var(--f800);
  border:1px solid var(--line);color:var(--ash);padding:8px 14px;border-radius:8px;cursor:pointer;transition:.15s;font-weight:600}
.fbtn:hover{color:var(--bone)}
.fbtn.on{background:var(--f700);color:var(--ember2);border-color:var(--ember)}
.adm-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:18px;align-items:start}
.panel{background:var(--f900);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.panel-h{padding:16px 22px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}
.panel-h h3{font-family:var(--display);font-size:18px;text-transform:uppercase;letter-spacing:.02em}
.panel-h .cnt{font-family:var(--mono);font-size:11px;color:var(--ash)}
.book-row{display:flex;align-items:center;gap:14px;padding:15px 22px;border-bottom:1px solid var(--line);transition:.14s}
.book-row:last-child{border:none}
.book-row:hover{background:var(--f800)}
.avatar{width:40px;height:40px;border-radius:11px;flex:none;display:grid;place-items:center;font-family:var(--display);
  font-size:17px;color:#fff;background:linear-gradient(150deg,var(--flame),var(--ember))}
.bmeta{flex:1;min-width:0}
.bmeta .bn{font-weight:700;font-size:15px}
.bmeta .bd{font-family:var(--mono);font-size:11.5px;color:var(--ash);margin-top:3px}
.badge{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;
  padding:4px 9px;border-radius:20px;flex:none}
.bg-confirmed{background:rgba(111,138,153,.18);color:var(--steel)}
.bg-checked-in{background:rgba(255,176,46,.16);color:var(--gold)}
.bg-pending{background:rgba(179,164,150,.14);color:var(--ash)}
.bg-cancelled{background:rgba(150,22,16,.14);color:var(--flame)}
.row-acts{display:flex;gap:5px;flex:none}
.iact{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--f800);color:var(--ash);
  cursor:pointer;display:grid;place-items:center;transition:.15s}
.iact:hover{color:var(--bone);border-color:var(--ember2)}
.iact.ok:hover{color:var(--steel)}.iact.go:hover{color:var(--gold)}.iact.no:hover{color:var(--flame)}
.sched-row{display:flex;align-items:center;gap:13px;padding:13px 22px;border-bottom:1px solid var(--line)}
.sched-row:last-child{border:none}
.sched-time{font-family:var(--display);font-size:18px;width:74px;flex:none}
.sched-info{flex:1}
.sched-info .st{font-family:var(--mono);font-size:11px;color:var(--ash);text-transform:uppercase;letter-spacing:.06em}
.capbar{height:7px;border-radius:4px;background:var(--f700);margin-top:6px;overflow:hidden}
.capbar i{display:block;height:100%;border-radius:4px}
.sched-cnt{font-family:var(--mono);font-size:13px;font-weight:700;width:46px;text-align:right;flex:none}
.empty{padding:46px;text-align:center;color:var(--ash);font-family:var(--mono);font-size:13px}

.gate{max-width:380px;margin:80px auto;text-align:center}
.gate .glock{width:64px;height:64px;border-radius:16px;margin:0 auto 20px;display:grid;place-items:center;
  background:var(--f800);border:1px solid var(--line);color:var(--ember2)}
.gate h2{font-family:var(--display);font-size:30px;text-transform:uppercase;margin-bottom:8px}
.gate p{color:var(--ash);font-size:14px;margin-bottom:24px}
.hint{font-family:var(--mono);font-size:11px;color:var(--ash);margin-top:14px}

/* ---------- lead magnet ---------- */
.lead{display:grid;grid-template-columns:1.1fr .9fr;gap:38px;align-items:center;
  background:linear-gradient(150deg,var(--f900),var(--f800));border:1px solid var(--line);
  border-radius:22px;padding:48px 46px;position:relative;overflow:hidden}
.lead-glow{position:absolute;top:-110px;right:-70px;width:360px;height:360px;
  background:radial-gradient(circle,rgba(224,45,36,.2),transparent 65%);filter:blur(32px);pointer-events:none}
.lead h2{font-family:var(--display);font-size:clamp(30px,4vw,48px);text-transform:uppercase;line-height:.96}
.lead .lp{color:var(--ash);font-size:15.5px;line-height:1.55;margin:14px 0 22px;max-width:42ch}
.lead ul{list-style:none;display:grid;gap:10px}
.lead li{display:flex;gap:11px;align-items:center;font-size:14.5px;font-weight:500}
.lead li svg{flex:none;color:var(--ember)}
.lead-form{background:var(--black);border:1px solid var(--line);border-radius:16px;padding:30px;position:relative;z-index:2}
.lead-form .ttl{font-family:var(--display);font-size:21px;text-transform:uppercase;letter-spacing:.02em;margin-bottom:6px}
.lead-form .sub{color:var(--ash);font-size:13px;margin-bottom:18px;line-height:1.4}
.lead-form input{width:100%;background:var(--f800);border:1.5px solid var(--line);border-radius:11px;
  padding:14px 15px;color:var(--bone);font-family:var(--body);font-size:15px;outline:none;margin-bottom:12px;transition:.16s}
.lead-form input:focus{border-color:var(--ember)}
.lead-form input::placeholder{color:#6b5d52}
.lead-done{text-align:center;padding:10px 4px}
.lead-done .lc{width:60px;height:60px;border-radius:50%;margin:0 auto 16px;display:grid;place-items:center;
  background:linear-gradient(150deg,var(--flame),var(--ember));box-shadow:0 0 30px rgba(224,45,36,.45);animation:pop .5s cubic-bezier(.2,1.4,.4,1)}
.lead-done h4{font-family:var(--display);font-size:23px;text-transform:uppercase;margin-bottom:8px}
.lead-done p{color:var(--ash);font-size:14px;line-height:1.5}
.privacy{font-family:var(--mono);font-size:10.5px;color:var(--ash);text-align:center;margin-top:12px;letter-spacing:.04em}

/* ---------- leads panel ---------- */
.lead-row{display:flex;align-items:center;gap:11px;padding:13px 22px;border-bottom:1px solid var(--line)}
.lead-row:last-child{border:none}
.lead-row .le{flex:1;min-width:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lead-row .lsrc{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;
  background:rgba(224,45,36,.14);color:var(--ember2);padding:3px 8px;border-radius:20px;flex:none}
.lead-row .ld{font-family:var(--mono);font-size:11px;color:var(--ash);flex:none}

/* availability blocking */
.blk-form{display:flex;flex-direction:column;gap:10px}
.blk-form input{width:100%;background:var(--f800);border:1.5px solid var(--line);border-radius:11px;
  padding:11px 13px;color:var(--bone);font-family:var(--body);font-size:14px;outline:none}
.blk-form input:focus{border-color:var(--ember)}
.blk-form input::placeholder{color:#6b5d52}
.blk-form input[type=date],.blk-form input[type=time]{font-family:var(--mono);font-size:13px;color-scheme:dark}
.blk-modes{display:flex;gap:9px}
.blk-times{display:flex;align-items:center;gap:9px}
.blk-times span{font-family:var(--mono);font-size:11px;color:var(--ash);flex:none}
.blk-err{color:var(--flame);font-family:var(--mono);font-size:12px;line-height:1.5}
.auth-err{color:var(--flame);font-family:var(--mono);font-size:12.5px;line-height:1.5;
  margin:-6px 0 14px;text-align:center}
.linkish{background:none;border:none;padding:0;color:var(--ember2);font:inherit;cursor:pointer;text-decoration:underline}
a.nlink{text-decoration:none;display:inline-flex;align-items:center}

/* booking cart */
.cart-bar{position:sticky;bottom:0;display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  background:var(--f900);border:1.5px solid var(--ember);border-radius:14px;padding:14px 18px;margin-top:18px}
.cart-bar .cn{font-family:var(--display);font-size:20px;letter-spacing:.01em;flex:none}
.cart-bar .cl{font-family:var(--mono);font-size:11.5px;color:var(--ash);flex:1;min-width:120px}
.cart-list{display:flex;flex-direction:column;gap:9px;margin-bottom:16px}
.cart-item{display:flex;align-items:center;gap:12px;background:var(--f800);border:1.5px solid var(--line);
  border-radius:11px;padding:12px 14px}
.cart-item .ci-when{flex:1;min-width:0;font-size:14px;font-weight:600}
.cart-item .ci-type{font-family:var(--mono);font-size:10px;letter-spacing:.07em;text-transform:uppercase;
  color:var(--ember2);flex:none}
.slot.picked{border-color:var(--gold);background:linear-gradient(150deg,rgba(240,171,51,.16),var(--f800))}
/* calendar invite links */
.cal-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:6px}
.cal-links a{font-family:var(--mono);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ember2);text-decoration:none;border-bottom:1px solid rgba(240,171,51,.35);padding-bottom:1px}
.cal-links a:hover{color:var(--bone);border-color:var(--bone)}
.srow.cal-row{align-items:flex-start}
.srow.cal-row .k{display:flex;flex-direction:column}

/* leads */
.badge.lead-new{background:rgba(240,171,51,.16);color:var(--gold)}
.badge.lead-contacted{background:rgba(111,138,153,.2);color:var(--steel)}
.badge.lead-converted{background:rgba(78,168,106,.18);color:#7fd39b}
.badge.lead-dead{background:rgba(176,161,147,.14);color:var(--ash)}
.lead-notes{width:100%;background:var(--f900);border:1.5px solid var(--line);border-radius:11px;
  padding:11px 13px;color:var(--bone);font-family:var(--body);font-size:13.5px;outline:none;resize:vertical}
.lead-notes:focus{border-color:var(--ember)}
.lead-notes::placeholder{color:#6b5d52}
.convert-note{margin:0 22px 14px;padding:13px 15px;border:1.5px solid var(--ember);border-radius:12px;
  background:rgba(224,45,36,.1);font-size:13.5px;line-height:1.65}
.convert-note code{font-family:var(--mono);font-size:13px;color:var(--ember2);
  background:var(--f900);padding:2px 7px;border-radius:5px;letter-spacing:.04em}

/* members & packages */
.mem-row{display:flex;align-items:center;gap:13px;width:100%;text-align:left;cursor:pointer;
  background:none;border:none;border-bottom:1px solid var(--line);padding:14px 22px;color:var(--bone)}
.mem-row:hover{background:var(--f800)}
.mem-packs{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;flex:none;max-width:52%}
.pack-chip{font-family:var(--mono);font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;
  padding:4px 9px;border-radius:20px;border:1.5px solid}
.pack-chip.group{border-color:var(--ember);color:var(--ember2);background:rgba(224,45,36,.12)}
.pack-chip.pt{border-color:var(--steel);color:var(--steel);background:rgba(111,138,153,.14)}
.pack-chip.none{border-color:var(--line);color:#6b5d52}
.mem-detail{padding:16px 22px 20px;background:var(--f800);border-bottom:1px solid var(--line)}
.assign-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.assign-row select{flex:1;min-width:200px;background:var(--f900);border:1.5px solid var(--line);
  border-radius:11px;padding:11px 13px;color:var(--bone);font-family:var(--body);font-size:13.5px;outline:none}
.assign-row select:focus{border-color:var(--ember)}
.pack-card{background:var(--f900);border:1.5px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}
.pack-head{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;margin-bottom:12px}
.pk-name{font-size:14.5px;font-weight:700}
.pk-sub{font-family:var(--mono);font-size:11.5px;color:var(--ash);margin-top:3px}
.adj-form{display:flex;gap:9px;margin-bottom:12px;flex-wrap:wrap}
.adj-form input{background:var(--f800);border:1.5px solid var(--line);border-radius:10px;
  padding:9px 12px;color:var(--bone);font-family:var(--body);font-size:13.5px;outline:none}
.adj-form input:focus{border-color:var(--ember)}
.adj-form input[type=number]{width:110px;font-family:var(--mono)}
.adj-form input:not([type=number]){flex:1;min-width:150px}
.pk-log{border-top:1px solid var(--line);padding-top:10px}
.pk-log-none{font-family:var(--mono);font-size:11.5px;color:#6b5d52}
.pk-log-row{display:flex;align-items:baseline;gap:9px;padding:5px 0;font-family:var(--mono);font-size:11px;flex-wrap:wrap}
.pk-delta{font-weight:700;min-width:28px;flex:none}
.pk-delta.up{color:#4ea86a}
.pk-delta.down{color:var(--flame)}
.pk-delta.flat{color:var(--ash)}
.pk-reason{color:var(--bone);flex:none}
.pk-note{color:var(--ash);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-when{color:#6b5d52;margin-left:auto;flex:none}

/* admin calendar */
.cal-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 22px 10px}
.cal-nav{display:flex;gap:7px}
.cal-title{font-family:var(--display);font-size:20px;letter-spacing:.01em;margin-left:auto}
.cal-legend{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:0 22px 14px;
  font-family:var(--mono);font-size:10.5px;color:var(--ash);letter-spacing:.05em;text-transform:uppercase}
.cal-legend span{display:inline-flex;align-items:center;gap:6px}
.cal-legend i{width:11px;height:11px;border-radius:3px;display:inline-block}
.cal-legend-note{margin-left:auto;text-transform:none;letter-spacing:.02em}
.cal-tile{display:flex;align-items:center;gap:7px;width:100%;text-align:left;cursor:pointer;
  border:1.5px solid;border-radius:9px;padding:7px 9px;font-family:var(--mono);font-size:11px;
  transition:transform .12s ease}
.cal-tile:hover{transform:translateY(-1px)}
.cal-tile .ct-time{font-weight:700;flex:none}
.cal-tile .ct-type{opacity:.8;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cal-tile .ct-cnt{margin-left:auto;font-weight:700;flex:none}
.cal-tile.compact{padding:4px 6px;font-size:9.5px;gap:5px;border-radius:6px}
.cal-week{display:grid;grid-template-columns:repeat(7,1fr);gap:9px;padding:0 22px 22px}
.cal-day{background:var(--f800);border:1.5px solid var(--line);border-radius:12px;padding:9px;min-height:130px}
.cal-day.is-today{border-color:var(--ember)}
.cal-dh{display:flex;align-items:baseline;gap:6px;margin-bottom:9px}
.cal-dh .cd-dow{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ash)}
.cal-dh .cd-num{font-family:var(--display);font-size:17px}
.cal-stack{display:flex;flex-direction:column;gap:6px}
.cal-none{color:#5b4d44;font-family:var(--mono);font-size:12px;text-align:center;padding:8px 0}
.cal-month{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;padding:0 22px 22px}
.cal-mh{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--ash);text-align:center;padding-bottom:4px}
.cal-cell{background:var(--f800);border:1.5px solid var(--line);border-radius:9px;padding:6px;min-height:84px}
.cal-cell.is-today{border-color:var(--ember)}
.cal-cell.outside{opacity:.4}
.cal-cell .cc-num{font-family:var(--mono);font-size:11px;color:var(--ash);margin-bottom:5px}
.cc-stack{display:flex;flex-direction:column;gap:3px}
.cal-overlay{position:fixed;inset:0;background:rgba(6,4,3,.72);z-index:60;display:flex;
  align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}
.cal-sheet{background:var(--f900);border:1.5px solid var(--line);border-radius:16px;
  width:100%;max-width:620px;overflow:hidden}

@media(max-width:860px){\
  .wrap{padding:0 16px}\
  .nav-in{height:64px}\
  .hero{padding:40px 0 50px}\
  .hero-bg-img{transform:translate(-50%,-50%);height:100%;object-position:center 30%}\
  .hero-logo{height:100px}\
  .section{padding:50px 0}\
  .card{padding:24px 18px}\
  .book-row{padding:12px 16px;gap:10px}\
  .panel-h{padding:14px 16px}\
  .datechip{width:64px;padding:10px 0}\
  .datechip .dnum{font-size:22px}\

  .cal-week{grid-template-columns:1fr;gap:7px}
  .cal-day{min-height:0}
  .cal-title{margin-left:0;width:100%}
  .cal-month{gap:3px;padding:0 12px 18px}
  .cal-cell{min-height:62px;padding:4px}
}

.mysess{display:flex;align-items:center;gap:13px;padding:14px 22px;border-bottom:1px solid var(--line)}
.mysess:last-child{border:none}
.mysess .ms-when{flex:1;min-width:0}
.mysess .ms-d{font-size:14.5px;font-weight:700}
.mysess .ms-t{font-family:var(--mono);font-size:11.5px;color:var(--ash);margin-top:3px}

@media(max-width:860px){
  .nav-links .nlink{display:none}
  .props,.three,.steps,.price-grid,.foot-grid{grid-template-columns:1fr}
  .stats{grid-template-columns:1fr 1fr}
  .kpis{grid-template-columns:1fr 1fr}
  .adm-grid{grid-template-columns:1fr}
  .lead{grid-template-columns:1fr;padding:32px 24px;gap:28px}
}

/* Mobile menu toggle */
.mobile-menu-btn{display:none;background:none;border:none;padding:10px;cursor:pointer;color:var(--bone);
  min-height:44px;min-width:44px;border-radius:8px;transition:.15s}
.mobile-menu-btn:active{background:var(--f800)}
.mobile-nav{display:none;position:fixed;top:64px;left:0;right:0;bottom:0;background:var(--black);
  z-index:49;padding:24px 20px;flex-direction:column;gap:6px;overflow-y:auto;
  border-top:1px solid var(--line)}
.mobile-nav.open{display:flex}
.mobile-nav .nlink{display:block;width:100%;text-align:left;padding:16px 18px;font-size:14px;
  border-radius:10px;-webkit-tap-highlight-color:transparent}
.mobile-nav .nlink:active{background:var(--f800)}
.mobile-nav .nlink.on{background:var(--f800);color:var(--ember2)}

@media(max-width:860px){
  .mobile-menu-btn{display:grid;place-items:center}
  .nav-in{height:64px}
}

@media(max-width:500px){
  .nav{backdrop-filter:blur(16px);background:rgba(12,9,8,.9)}
  .nav-in{height:60px;padding:0 4px}
  .logo svg{height:44px}
  .mobile-nav{top:60px;padding:20px 16px;gap:4px}
  .mobile-nav .nlink{padding:15px 16px;font-size:13px}
  .mobile-nav .btn{margin-top:8px}
}

/* Extra small screens */
@media(max-width:400px){
  .wrap{padding:0 12px}
  .stats{grid-template-columns:1fr}
  .stat{padding:18px 14px}
  .stat .n{font-size:30px}
  .kpis{grid-template-columns:1fr}
  .hero-h{font-size:36px}
  .opt{padding:16px;gap:12px}
  .opt .oicon{width:40px;height:40px}
  .opt .otitle{font-size:17px}
  .opt .oprice{font-size:22px}
  .slot-grid{grid-template-columns:1fr 1fr}
  .slot{padding:12px 10px}
  .slot .stime{font-size:16px}
  .field input{padding:12px 14px}
  .btn{padding:12px 16px;font-size:12px}
  .nav-btns{flex-direction:column}
  .nav-btns .btn{width:100%}
  .eyebrow{font-size:10px;padding:7px 14px}
  .hero-sub{font-size:15px}
  .band{padding:40px 24px;border-radius:16px}
  .band h2{font-size:28px}
  .foot-grid{gap:28px}
  .cart-bar{padding:12px 14px;gap:10px}
  .cal-links{gap:10px}
  .cal-links a{font-size:9px}


/* booking calendar */
.cal-header{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:20px;
  margin-bottom:24px;
}
.cal-month-title{
  font-family:var(--body);
  font-size:18px;
  font-weight:600;
  color:var(--bone);
  min-width:160px;
  text-align:center;
}
.cal-arrow{
  width:36px;
  height:36px;
  border-radius:8px;
  border:1px solid var(--line);
  background:transparent;
  color:var(--ash);
  font-size:20px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:.15s;
}
.cal-arrow:hover{
  border-color:var(--ember);
  color:var(--bone);
}
.booking-cal{
  background:transparent;
  padding:0;
  overflow:hidden;
  width:100%;
}
.booking-cal-head{
  display:grid;
  grid-template-columns:repeat(7, minmax(0, 1fr));
  gap:8px;
  margin-bottom:12px;
  width:100%;
}
.booking-cal-dow{
  text-align:center;
  font-family:var(--mono);
  font-size:11px;
  letter-spacing:.05em;
  color:var(--ash);
  text-transform:uppercase;
  padding:8px 0;
  min-width:0;
}
.booking-cal-grid{
  display:grid;
  grid-template-columns:repeat(7, minmax(0, 1fr));
  gap:8px;
  width:100%;
}
.booking-cal-day{
  width:100%;
  aspect-ratio:1;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:var(--body);
  font-weight:500;
  font-size:16px;
  background:var(--f900);
  border:2px solid var(--line);
  border-radius:8px;
  cursor:pointer;
  color:var(--ash);
  transition:.15s;
  padding:0;
  min-width:0;
}
.booking-cal-day:disabled{opacity:.25;cursor:not-allowed}
.booking-cal-day.outside{opacity:0;pointer-events:none}
.booking-cal-day.past{opacity:.35;color:var(--ash)}
.booking-cal-day.has-slots{
  border-color:var(--ember);
  background:rgba(224,45,36,.08);
  color:var(--bone);
}
.booking-cal-day.has-slots:hover{
  background:rgba(224,45,36,.18);
  transform:translateY(-2px);
}
.booking-cal-day.selected{
  background:var(--ember);
  border-color:var(--ember);
  color:#fff;
}
.booking-cal-day.today{
  border-color:var(--ember);
  box-shadow:0 0 0 1px var(--ember);
}
@media(max-width:500px){
  .booking-cal-grid,.booking-cal-head{gap:6px}
  .booking-cal-day{font-size:14px;border-radius:6px}
  .booking-cal-dow{font-size:9px;padding:6px 0}
  .cal-header{gap:14px;margin-bottom:20px}
  .cal-month-title{font-size:16px;min-width:140px}
}
@media(max-width:375px){
  .booking-cal-grid,.booking-cal-head{gap:4px}
  .booking-cal-day{font-size:13px;border-radius:5px}
  .booking-cal-dow{font-size:8px;padding:4px 0}
}

/* ========== MY SESSIONS PAGE REDESIGN ========== */

/* Page wrapper */
.my-sessions-page{padding:60px 0 40px}
.my-sessions-wrap{max-width:720px}

/* Greeting */
.my-sessions-greeting{text-align:center;margin-bottom:40px}
.greeting-label{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.2em;
  color:var(--ash);text-transform:uppercase;margin-bottom:8px}
.greeting-name{font-family:var(--display);font-size:clamp(42px,8vw,64px);text-transform:uppercase;
  line-height:.95;letter-spacing:.01em}

/* Action cards */
.my-sessions-actions{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:48px}
.ms-action-card{display:flex !important;flex-direction:row !important;align-items:center !important;
  justify-content:flex-start;gap:16px;width:100%;text-align:left;
  background-color:#1d1411 !important;background-image:none !important;
  border:2px solid #3a261d;border-radius:16px;padding:22px 24px;
  color:#f3ece1;cursor:pointer;transition:all .2s ease;
  -webkit-appearance:none;appearance:none;font-family:inherit}
.ms-action-card:hover{border-color:var(--ember);transform:translateY(-3px);
  box-shadow:0 8px 24px rgba(0,0,0,.25)}
.ms-action-card.primary{background-color:#c9251c !important;
  background-image:linear-gradient(135deg,#e02d24 0%,#c9251c 100%) !important;
  border-color:transparent;box-shadow:0 8px 28px rgba(224,45,36,.35);
  -webkit-appearance:none;appearance:none}
.ms-action-card.primary:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(224,45,36,.45)}
.ms-action-icon{width:56px;height:56px;min-width:56px;border-radius:14px;display:flex;
  align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,255,255,.12)}
.ms-action-card:not(.primary) .ms-action-icon{background:rgba(224,45,36,.12);color:#f0ab33}
.ms-action-text{flex:1 1 auto;min-width:0;display:flex !important;flex-direction:column !important;
  align-items:flex-start;gap:4px}
.ms-action-title{display:block !important;width:100%;font-family:var(--display);font-size:20px;
  text-transform:uppercase;letter-spacing:.02em;line-height:1.1;color:#f3ece1}
.ms-action-sub{display:block !important;width:100%;font-size:13px;color:rgba(255,255,255,.65);
  font-weight:500;margin-top:2px}
.ms-action-card:not(.primary) .ms-action-sub{color:#b0a193}
.ms-action-arrow{flex-shrink:0;width:20px;height:20px;display:flex;align-items:center;
  justify-content:center;opacity:.6;transition:.15s;color:#f3ece1;margin-left:auto}
.ms-action-card:hover .ms-action-arrow{opacity:1;transform:translateX(3px)}
.ms-action-card > svg{flex-shrink:0;opacity:.6;transition:.15s;color:#f3ece1;margin-left:auto}
.ms-action-card:hover > svg{opacity:1;transform:translateX(3px)}

/* Sessions panel */
.my-sessions-panel{background:#140d0b;border:1.5px solid #3a261d;border-radius:20px;
  overflow:hidden;margin-bottom:24px}
.my-sessions-panel.past-panel{opacity:.85}
.ms-panel-header{display:flex;align-items:center;justify-content:space-between;
  padding:20px 28px;border-bottom:1px solid #3a261d;background:#1d1411}
.ms-panel-header h2{font-family:var(--display);font-size:22px;text-transform:uppercase;
  letter-spacing:.02em;color:#f3ece1}
.ms-panel-count{font-family:var(--mono);font-size:13px;font-weight:700;color:#f0ab33;
  background:rgba(224,45,36,.15);padding:5px 12px;border-radius:20px}
.ms-panel-body{padding:24px 28px;background:#140d0b}
.ms-loading{text-align:center;color:#b0a193;font-family:var(--mono);font-size:13px;padding:40px 0}

/* Empty state */
.ms-empty-state{text-align:center;padding:48px 20px 56px}
.ms-empty-icon{width:100px;height:100px;border-radius:24px;margin:0 auto 28px;display:grid;place-items:center;
  background:linear-gradient(150deg,#1d1411,#281a15);border:1.5px solid #3a261d;color:#f0ab33}
.ms-empty-state h3{font-family:var(--display);font-size:28px;text-transform:uppercase;margin-bottom:12px;color:#f3ece1}
.ms-empty-state p{color:#b0a193;font-size:15px;line-height:1.6;margin-bottom:28px;max-width:300px;margin-left:auto;margin-right:auto}
.ms-empty-state .btn{padding:14px 32px;font-size:13px}

/* Session rows */
.ms-sessions-list{display:flex;flex-direction:column;gap:12px}
.sess-row{display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:var(--f800);border:1.5px solid var(--line);border-radius:14px;padding:18px 22px;
  transition:border-color .15s}
.sess-row:hover{border-color:rgba(224,45,36,.4)}
.sess-row.past{opacity:.65}
.sess-row.past:hover{border-color:var(--line)}
.sess-row-left{display:flex;align-items:center;gap:14px;flex:1;min-width:0}
.sess-row-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex:none;
  background:linear-gradient(150deg,rgba(224,45,36,.18),rgba(150,22,16,.06));color:var(--ember2)}
.sess-row-icon.muted{background:var(--f700);color:var(--ash)}
.sess-row-info{flex:1;min-width:0}
.sess-row-type{font-size:16px;font-weight:700;margin-bottom:3px}
.sess-row-when{font-family:var(--mono);font-size:12px;color:var(--ash);letter-spacing:.02em}
.sess-row-right{display:flex;align-items:center;gap:14px;flex:none}
.sess-row-right .badge{margin-right:6px}
.sess-row-actions{display:flex;gap:8px}
.sess-action-btn{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.04em;
  text-transform:uppercase;padding:10px 14px;border-radius:8px;cursor:pointer;transition:.15s;
  background:transparent;border:1.5px solid var(--line);color:var(--bone)}
.sess-action-btn:hover{border-color:var(--ember);color:var(--ember2)}
.sess-action-btn.cancel{color:var(--flame);border-color:rgba(224,45,36,.3)}
.sess-action-btn.cancel:hover{background:rgba(150,22,16,.2);border-color:var(--flame)}
.sess-row-cal{display:flex;gap:12px}
.sess-row-cal a{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;
  letter-spacing:.04em;text-transform:uppercase;color:var(--ash);text-decoration:none;transition:.15s}
.sess-row-cal a:hover{color:var(--ember2)}

/* ===== NEW SESSION CARD STYLES ===== */

/* Structured sessions container */
.ms-sessions-structured{display:flex;flex-direction:column;gap:16px}

/* Featured "Next Session" card */
.featured-session-card{
  background:linear-gradient(145deg,#1d1411 0%,#281a15 100%);
  border:2px solid #c9251c;
  border-radius:18px;
  padding:0;
  overflow:hidden;
  box-shadow:0 4px 24px rgba(201,37,28,.15),inset 0 1px 0 rgba(255,255,255,.03);
}
.featured-session-header{
  padding:14px 20px 0;
  display:flex;align-items:center;justify-content:space-between;
}
.featured-session-badge{
  display:flex;align-items:center;gap:12px;width:100%;justify-content:space-between;
}
.next-label{
  font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:#f0ab33;
  background:rgba(240,171,51,.12);padding:6px 12px;border-radius:20px;
}
.status-pill{
  font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.08em;
  text-transform:uppercase;padding:6px 12px;border-radius:20px;
}
.status-pill.status-confirmed{background:rgba(34,197,94,.15);color:#22c55e}
.status-pill.status-pending{background:rgba(251,191,36,.15);color:#fbbf24}
.status-pill.status-cancelled{background:rgba(239,68,68,.15);color:#ef4444}
.status-pill.status-checked-in{background:rgba(59,130,246,.15);color:#3b82f6}

.featured-session-content{
  padding:20px;
  display:flex;align-items:center;gap:18px;
}
.featured-session-icon{
  width:56px;height:56px;min-width:56px;border-radius:14px;
  display:grid;place-items:center;
  background:linear-gradient(150deg,rgba(224,45,36,.22),rgba(150,22,16,.08));
  color:#f0ab33;
}
.featured-session-details{flex:1;min-width:0}
.featured-session-type{
  font-size:20px;font-weight:700;color:#f3ece1;margin-bottom:4px;
}
.featured-session-when{
  font-family:var(--mono);font-size:13px;color:#b0a193;letter-spacing:.02em;
}

.featured-session-actions{
  display:grid;grid-template-columns:1fr 1fr;gap:12px;
  padding:0 20px 16px;
}
.session-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.05em;
  text-transform:uppercase;padding:12px 16px;border-radius:10px;
  cursor:pointer;transition:all .15s;border:none;
}
.session-btn.secondary{
  background:transparent;border:1.5px solid #3a261d;color:#f3ece1;
}
.session-btn.secondary:hover{border-color:#f0ab33;color:#f0ab33}
.session-btn.danger{
  background:rgba(239,68,68,.08);border:1.5px solid rgba(239,68,68,.3);color:#ef4444;
}
.session-btn.danger:hover{background:rgba(239,68,68,.15);border-color:#ef4444}
.session-btn.small{font-size:11px;padding:10px 12px;gap:6px}

.featured-session-divider{
  height:1px;background:#3a261d;margin:0 20px;
}

.featured-session-calendar{
  display:flex;align-items:center;justify-content:center;gap:24px;
  padding:16px 20px;
}
.calendar-link{
  display:inline-flex;align-items:center;gap:8px;
  font-family:var(--mono);font-size:12px;font-weight:500;letter-spacing:.03em;
  color:#b0a193;text-decoration:none;transition:color .15s;
  padding:6px 0;
}
.calendar-link:hover{color:#f0ab33}
.calendar-link.small{font-size:11px;gap:6px}

/* View all sessions toggle */
.remaining-sessions{margin-top:8px}
.view-all-toggle{
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:14px 20px;
  background:#1d1411;border:1.5px solid #3a261d;border-radius:12px;
  font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.06em;
  text-transform:uppercase;color:#b0a193;cursor:pointer;
  transition:all .15s;
}
.view-all-toggle:hover{border-color:#f0ab33;color:#f0ab33}
.view-all-toggle svg{transition:transform .2s}
.view-all-toggle.expanded svg{transform:rotate(180deg)}

.remaining-sessions-list{
  display:flex;flex-direction:column;gap:10px;
  margin-top:12px;
}

/* Compact session cards */
.compact-session-card{
  background:#1d1411;border:1.5px solid #3a261d;border-radius:14px;
  overflow:hidden;transition:border-color .15s;
}
.compact-session-card:hover{border-color:rgba(240,171,51,.3)}
.compact-session-card.expanded{border-color:rgba(224,45,36,.4)}

.compact-session-main{
  display:flex;align-items:center;gap:14px;
  width:100%;padding:16px 18px;
  background:transparent;border:none;cursor:pointer;text-align:left;
}
.compact-session-icon{
  width:42px;height:42px;min-width:42px;border-radius:11px;
  display:grid;place-items:center;
  background:rgba(240,171,51,.1);color:#b0a193;
}
.compact-session-info{flex:1;min-width:0}
.compact-session-type{
  font-size:15px;font-weight:600;color:#f3ece1;margin-bottom:2px;
}
.compact-session-when{
  font-family:var(--mono);font-size:11px;color:#78716c;letter-spacing:.02em;
}
.compact-session-chevron{
  color:#78716c;transition:transform .2s,color .15s;
}
.compact-session-chevron.rotated{transform:rotate(180deg);color:#f0ab33}
.compact-session-card:hover .compact-session-chevron{color:#b0a193}

.compact-session-expanded{
  padding:0 18px 16px;
  border-top:1px solid #281a15;
  padding-top:14px;
}
.compact-session-actions{
  display:grid;grid-template-columns:1fr 1fr;gap:10px;
  margin-bottom:12px;
}
.compact-session-calendar{
  display:flex;align-items:center;justify-content:center;gap:20px;
  padding-top:8px;border-top:1px solid #281a15;
}

/* Tablet adjustments */
@media(max-width:768px){
  .my-sessions-wrap{max-width:100%}
  .my-sessions-actions{gap:12px}
  .ms-action-card{padding:18px 20px;gap:14px}
  .ms-action-icon{width:48px;height:48px;border-radius:12px}
  .ms-action-title{font-size:17px}
  .ms-action-sub{font-size:12px}
  .ms-panel-header{padding:16px 20px}
  .ms-panel-body{padding:20px}
  .sess-row{flex-direction:column;align-items:stretch;gap:14px;padding:16px 18px}
  .sess-row-left{width:100%}
  .sess-row-right{justify-content:space-between;flex-wrap:wrap;gap:10px}
  .sess-row-actions{order:1}
  .sess-row-cal{order:2}
}

/* Mobile layout */
@media(max-width:500px){
  /* Page spacing */
  .my-sessions-page{padding:28px 0 32px}
  .my-sessions-wrap{padding:0 16px}

  /* Greeting */
  .my-sessions-greeting{margin-bottom:28px;text-align:center}
  .greeting-label{font-size:11px;letter-spacing:.18em;margin-bottom:6px}
  .greeting-name{font-size:38px}

  /* Action cards - stacked full width */
  .my-sessions-actions{grid-template-columns:1fr;gap:12px;margin-bottom:32px}
  .ms-action-card{display:flex !important;flex-direction:row !important;align-items:center !important;
    padding:18px 20px;gap:14px;border-radius:14px;
    -webkit-tap-highlight-color:transparent;touch-action:manipulation;
    -webkit-appearance:none !important;appearance:none !important}
  .ms-action-card:not(.primary){background-color:#1d1411 !important;background-image:none !important;border-color:#3a261d}
  .ms-action-card.primary{background-color:#c9251c !important;
    background-image:linear-gradient(135deg,#e02d24 0%,#c9251c 100%) !important}
  .ms-action-card:active{transform:scale(.98);opacity:.9}
  .ms-action-card.primary:active{box-shadow:0 4px 16px rgba(224,45,36,.4)}
  .ms-action-icon{width:48px;height:48px;min-width:48px;border-radius:12px;flex-shrink:0}
  .ms-action-text{display:flex !important;flex-direction:column !important;gap:2px;flex:1;min-width:0}
  .ms-action-title{display:block !important;font-size:17px;line-height:1.2}
  .ms-action-sub{display:block !important;font-size:12px;line-height:1.3;margin-top:2px}
  .ms-action-card > svg,.ms-action-arrow{display:none}

  /* Panel */
  .my-sessions-panel{border-radius:16px;margin-bottom:20px;background:#140d0b;border-color:#3a261d}
  .ms-panel-header{padding:16px 18px;background:#1d1411}
  .ms-panel-header h2{font-size:17px}
  .ms-panel-count{font-size:12px;padding:4px 10px}
  .ms-panel-body{padding:16px;background:#140d0b}

  /* Empty state */
  .ms-empty-state{padding:40px 16px 48px}
  .ms-empty-icon{width:88px;height:88px;border-radius:22px;margin-bottom:24px}
  .ms-empty-icon svg{width:44px;height:44px}
  .ms-empty-state h3{font-size:22px;margin-bottom:10px}
  .ms-empty-state p{font-size:14px;line-height:1.55;margin-bottom:24px;max-width:260px}
  .ms-empty-state .btn{width:100%;padding:16px 24px;font-size:12px}

  /* Session cards - full width mobile treatment */
  .ms-sessions-list{gap:14px}
  .sess-row{padding:18px;border-radius:14px;gap:16px}
  .sess-row-left{gap:12px}
  .sess-row-icon{width:44px;height:44px;border-radius:11px}
  .sess-row-info{gap:2px}
  .sess-row-type{font-size:15px;font-weight:700}
  .sess-row-when{font-size:11px;letter-spacing:.03em}

  /* New session card styles - mobile */
  .ms-sessions-structured{gap:14px}
  .featured-session-card{border-radius:16px;border-width:2px}
  .featured-session-header{padding:12px 16px 0}
  .next-label{font-size:9px;padding:5px 10px}
  .status-pill{font-size:9px;padding:5px 10px}
  .featured-session-content{padding:16px}
  .featured-session-icon{width:50px;height:50px;min-width:50px;border-radius:12px}
  .featured-session-type{font-size:18px}
  .featured-session-when{font-size:12px}
  .featured-session-actions{padding:0 16px 14px;gap:10px}
  .session-btn{padding:14px 12px;font-size:11px;border-radius:10px}
  .session-btn:active{transform:scale(.97);opacity:.85}
  .featured-session-divider{margin:0 16px}
  .featured-session-calendar{padding:14px 16px;gap:20px;flex-wrap:wrap}
  .calendar-link{font-size:11px}

  .view-all-toggle{padding:14px 16px;font-size:11px;border-radius:10px}
  .view-all-toggle:active{transform:scale(.98);opacity:.9}
  .remaining-sessions-list{gap:10px;margin-top:10px}

  .compact-session-card{border-radius:12px}
  .compact-session-main{padding:14px 16px;gap:12px}
  .compact-session-icon{width:40px;height:40px;min-width:40px;border-radius:10px}
  .compact-session-type{font-size:14px}
  .compact-session-when{font-size:10px}
  .compact-session-expanded{padding:0 16px 14px;padding-top:12px}
  .compact-session-actions{gap:8px;margin-bottom:10px}
  .session-btn.small{padding:12px 10px;font-size:10px}
  .compact-session-calendar{gap:16px;padding-top:10px}

  /* Status and actions */
  .sess-row-right{flex-direction:column;align-items:stretch;gap:12px}
  .sess-row-right .badge{align-self:flex-start;margin-right:0;font-size:10px;padding:5px 10px}

  /* Action buttons - side by side, full width */
  .sess-row-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
  .sess-action-btn{width:100%;padding:14px 12px;font-size:11px;border-radius:10px;
    font-weight:700;text-align:center;-webkit-tap-highlight-color:transparent}
  .sess-action-btn:active{transform:scale(.97);opacity:.85}

  /* Calendar links */
  .sess-row-cal{justify-content:center;gap:16px;padding-top:4px;
    border-top:1px solid var(--line);margin-top:2px}
  .sess-row-cal a{font-size:11px;padding:8px 0}

  /* Past sessions */
  .my-sessions-panel.past-panel{margin-bottom:0}
  .sess-row.past{padding:14px 16px}
  .sess-row.past .sess-row-icon{width:38px;height:38px}
  .sess-row.past .sess-row-type{font-size:14px}
}

/* Extra small screens (iPhone SE, etc) */
@media(max-width:375px){
  .my-sessions-page{padding:24px 0 28px}
  .my-sessions-wrap{padding:0 14px}
  .greeting-name{font-size:34px}
  .my-sessions-actions{gap:10px;margin-bottom:28px}
  .ms-action-card{display:flex !important;flex-direction:row !important;padding:16px 18px;gap:12px}
  .ms-action-icon{width:44px;height:44px;min-width:44px}
  .ms-action-text{display:flex !important;flex-direction:column !important;gap:2px}
  .ms-action-title{display:block !important;font-size:16px}
  .ms-action-sub{display:block !important;font-size:11px}
  .ms-panel-header{padding:14px 16px}
  .ms-panel-body{padding:14px}
  .ms-empty-state{padding:32px 14px 40px}
  .ms-empty-icon{width:76px;height:76px}
  .ms-empty-state h3{font-size:20px}
  .ms-empty-state p{font-size:13px}
  .sess-row{padding:16px}
  .sess-row-icon{width:40px;height:40px}
  .sess-row-type{font-size:14px}
  .sess-action-btn{padding:12px 10px;font-size:10px}
}

/* Cancel button variant */
.btn-cancel{background:rgba(150,22,16,.2);color:var(--flame);border:1px solid rgba(224,45,36,.3)}
.btn-cancel:hover{background:rgba(150,22,16,.35);border-color:var(--flame)}

/* ===== OUR STORY PAGE ===== */
.story-hero{position:relative;padding:100px 0 80px}
.story-hero .wrap{display:flex;flex-direction:column;align-items:center;text-align:center}
.story-hero .hero-glow{top:-100px}
.story-hero .hero-sub{margin-top:20px}

/* Quote styling with left border accent */
.story-quote{border-left:3px solid var(--ember);padding-left:20px;margin:16px 0 0;
  font-style:italic;color:var(--bone);font-size:15px;line-height:1.6}
@media(max-width:500px){.story-quote{padding-left:16px;font-size:14px}}

/* Modal overlay & dialog */
.modal-overlay{position:fixed;inset:0;background:rgba(6,4,3,.85);z-index:100;display:flex;
  align-items:center;justify-content:center;padding:20px;overflow-y:auto}
.modal{background:var(--f900);border:1.5px solid var(--line);border-radius:18px;padding:28px 26px;
  width:100%;max-width:380px}
.modal-lg{max-width:480px}
.modal h2{font-family:var(--display);font-size:26px;text-transform:uppercase;margin-bottom:16px;text-align:center}
.modal-session{background:var(--f800);border:1px solid var(--line);border-radius:12px;padding:16px;
  margin-bottom:16px;text-align:center}
.modal-error{padding:12px;background:rgba(150,22,16,.2);border:1px solid rgba(224,45,36,.3);
  border-radius:10px;color:var(--flame);font-size:13px;text-align:center}

/* Reschedule calendar nav */
.cal-nav{width:34px;height:34px;border-radius:8px;border:1px solid var(--line);background:transparent;
  color:var(--ash);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}
.cal-nav:hover{border-color:var(--ember);color:var(--bone)}

/* Reschedule comparison */
.reschedule-compare{display:flex;align-items:center;justify-content:center;gap:20px;padding:24px 0}
.resc-from,.resc-to{text-align:center}
.resc-label{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ash);margin-bottom:8px}
.resc-from .resc-label{color:#6b5d52}
.resc-to .resc-label{color:var(--ember2)}
.resc-date{font-family:var(--display);font-size:18px;margin-bottom:2px}
.resc-from .resc-date{color:#6b5d52;text-decoration:line-through}
.resc-time{font-family:var(--mono);font-size:14px}
.resc-from .resc-time{color:#6b5d52}
.resc-to .resc-time{color:var(--ember2)}
.resc-arrow{color:var(--ember2)}

@media(max-width:500px){
  .action-cards{grid-template-columns:1fr;max-width:300px}
  .action-card{padding:20px 16px}
  .sess-card{padding:16px}
  .modal{padding:24px 20px;max-width:calc(100% - 32px)}
  .reschedule-compare{gap:14px}
  .resc-date{font-size:16px}
}
`;

export function Theme() {
  return <style>{CSS}</style>;
}
