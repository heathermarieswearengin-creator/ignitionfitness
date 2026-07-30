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
.wrap{max-width:1180px;margin:0 auto;padding:0 24px;position:relative;z-index:2}

/* nav */
.nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);
  background:rgba(12,9,8,.82);border-bottom:1px solid var(--line)}
.nav-in{display:flex;align-items:center;justify-content:space-between;height:78px}
.logo{display:flex;align-items:center;gap:11px;cursor:pointer;background:none;border:none;padding:0}
.logo-word{font-family:var(--display);font-size:23px;letter-spacing:.06em;color:var(--bone);line-height:1;text-transform:uppercase}
.logo-word b{color:var(--gold);font-weight:400}
.nav-links{display:flex;align-items:center;gap:6px}
.nlink{background:none;border:none;color:var(--ash);font-family:var(--mono);font-size:12px;
  letter-spacing:.08em;font-weight:500;padding:9px 13px;cursor:pointer;border-radius:7px;transition:.18s}
.nlink:hover{color:var(--bone);background:var(--f800)}
.nlink.on{color:var(--ember2)}
.btn{font-family:var(--mono);font-weight:700;letter-spacing:.06em;font-size:12.5px;cursor:pointer;
  border:none;border-radius:9px;padding:12px 20px;transition:.2s;text-transform:uppercase}
.btn-primary{background:linear-gradient(150deg,var(--flame),var(--ember));color:#fff;
  box-shadow:0 8px 26px rgba(224,45,36,.32)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 34px rgba(224,45,36,.5)}
.btn-ghost{background:transparent;color:var(--bone);border:1px solid var(--line)}
.btn-ghost:hover{border-color:var(--ember);color:var(--ember2)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}

/* hero */
.hero{position:relative;padding:64px 0 78px;overflow:hidden}
.hero-in{display:flex;flex-direction:column;align-items:center;text-align:center}
.hero-logo{height:150px;width:auto;margin-bottom:26px;filter:drop-shadow(0 6px 30px rgba(224,45,36,.35))}
.hero-glow{position:absolute;top:-180px;left:50%;transform:translateX(-50%);width:760px;height:540px;
  background:radial-gradient(ellipse,rgba(224,45,36,.32),transparent 62%);filter:blur(36px);pointer-events:none}
.hero-glow2{position:absolute;bottom:-120px;left:50%;transform:translateX(-50%);width:540px;height:420px;
  background:radial-gradient(circle,rgba(150,22,16,.3),transparent 64%);filter:blur(40px);pointer-events:none}
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
.opt .otitle{font-family:var(--display);font-size:20px;letter-spacing:.02em;text-transform:uppercase}
.opt .otag{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;color:var(--ash);text-transform:uppercase;margin-top:3px}
.opt .odesc{font-size:13.5px;color:var(--ash);margin-top:6px;line-height:1.4}
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
  padding:13px 15px;color:var(--bone);font-family:var(--body);font-size:15px;outline:none;transition:.16s}
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

@media(max-width:860px){
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
`;

export function Theme() {
  return <style>{CSS}</style>;
}
