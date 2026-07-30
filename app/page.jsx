"use client";
import React, { useState, useEffect, useMemo } from "react";

// Browser storage shim (replaces the artifact-only storage).
// NOTE: this saves to THIS browser only. Shared bookings across devices
// require a real database (the next milestone, wired via Claude Code).
const storage = {
  async get(key) {
    try { const v = typeof window !== "undefined" ? window.localStorage.getItem(key) : null; return v ? { value: v } : null; }
    catch { return null; }
  },
  async set(key, value) {
    try { if (typeof window !== "undefined") window.localStorage.setItem(key, value); } catch {}
  },
};


/* ============================================================
   IGNITION FITNESS: landing + booking + admin (single app)
   Aesthetic: "the forge". Dark charcoal, brand red and gold, heavy
   industrial type. Bookings persist via storage so the
   booking flow feeds the admin dashboard for real.
   ============================================================ */

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

@media(max-width:860px){
  .nav-links .nlink{display:none}
  .props,.three,.steps,.price-grid,.foot-grid{grid-template-columns:1fr}
  .stats{grid-template-columns:1fr 1fr}
  .kpis{grid-template-columns:1fr 1fr}
  .adm-grid{grid-template-columns:1fr}
  .lead{grid-template-columns:1fr;padding:32px 24px;gap:28px}
}
`;

/* ---------- data / helpers ---------- */
const CLASSES = [
  { id: "group", label: "Group Class", tag: "All levels", price: 25, cap: 10,
    desc: "Small-group strength + cardio in 60 minutes. Drop-ins welcome." },
  { id: "pt", label: "1:1 Personal Training", tag: "Private session", price: 80, cap: 1,
    desc: "One-on-one coaching with Mike, tailored to your goals." },
];
const CLASS_MAP = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

// weekly slot template: 0=Sun ... 6=Sat
const WEEKLY = {
  0: [],
  1: [["6:00 AM","group"],["9:00 AM","group"],["12:00 PM","group"],["5:30 PM","group"],["6:30 PM","group"]],
  2: [["6:00 AM","group"],["9:00 AM","group"],["5:30 PM","group"],["6:30 PM","group"]],
  3: [["6:00 AM","group"],["9:00 AM","group"],["12:00 PM","group"],["5:30 PM","group"],["6:30 PM","group"]],
  4: [["6:00 AM","group"],["9:00 AM","group"],["5:30 PM","group"],["6:30 PM","group"]],
  5: [["6:00 AM","group"],["9:00 AM","group"],["12:00 PM","group"],["5:30 PM","group"]],
  6: [["8:00 AM","group"],["9:30 AM","group"]],
};
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const KEY = "ignition-bookings";
const LEADS_KEY = "ignition-leads";

// Brand logo. Swap this data URI for a hosted file anytime (e.g. "/logo.png").
const LOGO_URL = "data:image/png;base64,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";

const iso = (d) => d.toISOString().slice(0, 10);
const toMin = (t) => { const m = t.match(/(\d+):(\d+) (\w+)/); let h = +m[1] % 12; if (m[3] === "PM") h += 12; return h * 60 + +m[2]; };
const makeRef = () => "IGN-" + Math.random().toString(36).slice(2, 7).toUpperCase();
const next14 = () => { const a = []; const t = new Date(); for (let i = 0; i < 14; i++) { const d = new Date(t); d.setDate(t.getDate() + i); a.push(d); } return a; };

function seed() {
  const days = next14();
  const pick = (d) => iso(days[d]);
  return [
    { id: "s1", ref: "IGN-7K2QA", name: "Sarah Mendez", email: "sarah.m@email.com", phone: "909-555-0142", classType: "group", date: pick(0), time: "6:00 AM", status: "confirmed", createdAt: Date.now() - 86400000 },
    { id: "s2", ref: "IGN-9B4LP", name: "Marcus Lee", email: "marcus.lee@email.com", phone: "909-555-0188", classType: "group", date: pick(0), time: "6:00 AM", status: "checked-in", createdAt: Date.now() - 90000000 },
    { id: "s3", ref: "IGN-3X8MN", name: "Priya Shah", email: "priya@email.com", phone: "909-555-0119", classType: "group", date: pick(0), time: "9:00 AM", status: "confirmed", createdAt: Date.now() - 70000000 },
    { id: "s4", ref: "IGN-2W6TZ", name: "Devon Carter", email: "devon.c@email.com", phone: "909-555-0173", classType: "pt", date: pick(1), time: "12:00 PM", status: "confirmed", createdAt: Date.now() - 60000000 },
    { id: "s5", ref: "IGN-5R1QV", name: "Ana Torres", email: "ana.t@email.com", phone: "909-555-0166", classType: "group", date: pick(0), time: "5:30 PM", status: "pending", createdAt: Date.now() - 40000000 },
    { id: "s6", ref: "IGN-8H3KD", name: "Jordan Blake", email: "jblake@email.com", phone: "909-555-0150", classType: "group", date: pick(2), time: "9:00 AM", status: "confirmed", createdAt: Date.now() - 20000000 },
    { id: "s7", ref: "IGN-1N9FC", name: "Emily Rhodes", email: "emily.r@email.com", phone: "909-555-0134", classType: "group", date: pick(0), time: "6:00 AM", status: "confirmed", createdAt: Date.now() - 10000000 },
  ];
}
// bookings saved before the Foundations class was retired fall back to Group Class
const migrate = (list) => list.map((b) => (CLASS_MAP[b.classType] ? b : { ...b, classType: "group" }));

function seedLeads() {
  return [
    { id: "l1", email: "kayla.jensen@email.com", source: "kb-basics", createdAt: Date.now() - 5400000 },
    { id: "l2", email: "trevor.m@email.com", source: "kb-basics", createdAt: Date.now() - 50000000 },
    { id: "l3", email: "nina.solis@email.com", source: "kb-basics", createdAt: Date.now() - 140000000 },
  ];
}
function relTime(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

/* ---------- icons ---------- */
const Flame = ({ s = 18 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 9 11 11 11c1.5 0 2-1.5 1-4 .5.5 0 0 0-5z" fill="currentColor"/><path d="M12 22a6 6 0 0 0 6-6c0-2-1-4-2.5-5.5C16 13 14.5 14 13 14c-2.5 0-3-2.5-2-5C8 11 6 13 6 16a6 6 0 0 0 6 6z" fill="currentColor"/></svg>);
const Bell = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 8c-3.5 0-6 2.8-6 6.5C6 18 8.7 21 12 21s6-3 6-6.5C18 10.8 15.5 8 12 8z" stroke="currentColor" strokeWidth="2"/></svg>);
const Check = ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const Clock = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const User = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const Lock = ({ s = 26 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2"/></svg>);
const Arrow = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);

function Logo({ h = 44 }) {
  if (LOGO_URL && !LOGO_URL.includes("__")) return <img src={LOGO_URL} alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
  return <span className="logo-word">IGNITION <b>FITNESS</b></span>;
}

/* ================= APP ================= */
export default function App() {
  const [view, setView] = useState("home");
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(KEY, false);
        if (r && r.value) setBookings(migrate(JSON.parse(r.value)));
        else { const s = seed(); setBookings(s); await storage.set(KEY, JSON.stringify(s), false); }
      } catch { const s = seed(); setBookings(s); try { await storage.set(KEY, JSON.stringify(s), false); } catch {} }
      try {
        const rl = await storage.get(LEADS_KEY, false);
        if (rl && rl.value) setLeads(JSON.parse(rl.value));
        else { const sl = seedLeads(); setLeads(sl); await storage.set(LEADS_KEY, JSON.stringify(sl), false); }
      } catch { const sl = seedLeads(); setLeads(sl); }
      setLoaded(true);
    })();
  }, []);

  const persist = async (next) => {
    setBookings(next);
    try { await storage.set(KEY, JSON.stringify(next), false); } catch {}
  };
  const addBooking = (b) => persist([...bookings, b]);
  const updateBooking = (id, patch) => persist(bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const addLead = (email, source) => {
    if (leads.some((l) => l.email.toLowerCase() === email.toLowerCase())) return;
    const next = [...leads, { id: "l" + Date.now(), email, source, createdAt: Date.now() }];
    setLeads(next);
    try { storage.set(LEADS_KEY, JSON.stringify(next), false); } catch {}
  };

  const go = (v) => { setView(v); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="ign">
      <style>{CSS}</style>
      <Nav view={view} go={go} />
      {view === "home" && <Home go={go} addLead={addLead} />}
      {view === "book" && <Booking bookings={bookings} addBooking={addBooking} go={go} loaded={loaded} />}
      {view === "admin" && <Admin bookings={bookings} updateBooking={updateBooking} leads={leads} loaded={loaded} />}
      {view !== "admin" && <Footer go={go} />}
    </div>
  );
}

/* ---------- nav ---------- */
function Nav({ view, go }) {
  return (
    <nav className="nav">
      <div className="wrap nav-in">
        <button className="logo" onClick={() => go("home")}>
          <Logo h={52} />
        </button>
        <div className="nav-links">
          <button className={"nlink" + (view === "home" ? " on" : "")} onClick={() => go("home")}>HOME</button>
          <button className="nlink" onClick={() => go("home")}>OUR STORY</button>
          <button className="nlink" onClick={() => go("home")}>PRICING</button>
          <button className={"nlink" + (view === "admin" ? " on" : "")} onClick={() => go("admin")}>ADMIN</button>
          <button className="btn btn-primary" onClick={() => go("book")} style={{ marginLeft: 8 }}>Book a Class</button>
        </div>
      </div>
    </nav>
  );
}

/* ---------- home ---------- */
function Home({ go, addLead }) {
  return (
    <>
      <header className="hero">
        <div className="hero-glow" /><div className="hero-glow2" />
        <div className="wrap hero-in">
          <img className="hero-logo reveal d1" src={LOGO_URL} alt="Ignition Fitness" />
          <div className="eyebrow reveal d2"><span className="dot" /> Kettlebell Training Specialists</div>
          <h1 className="hero-h reveal d3">Forge Your<br /><span className="lit">Strength</span><br /><span className="at">At Ignition Fitness</span></h1>
          <p className="hero-sub reveal d4">Small-group kettlebell training in Rancho Cucamonga. 15+ years of expert coaching, ten people max, and a whole lot of swing.</p>
          <div className="hero-cta reveal d4">
            <button className="btn btn-primary" onClick={() => go("book")}>Book Your First Class</button>
            <button className="btn btn-ghost" onClick={() => go("home")}>See Pricing</button>
          </div>
          <div className="stats reveal d5">
            {[["15+","Years Coaching"],["10","Max Class Size"],["RKC","Certified Since '08"],["100%","Commitment"]].map(([n,l]) => (
              <div className="stat" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>
            ))}
          </div>
        </div>
      </header>

      <section className="section"><div className="wrap">
        <div className="kicker">One Tool · Infinite Possibilities</div>
        <h2 className="sh">One Bell.<br />Everything You Need.</h2>
        <div className="props">
          {["Strength + cardio in a single 60-minute session",
            "Burns more calories than traditional weight training",
            "Builds functional, real-world strength you actually use",
            "Low impact on joints, high impact on results",
            "Expert coaching every session, never guess again",
            "No machines, no confusion. Just you and the bell."].map((t) => (
            <div className="prop" key={t}><span className="ic"><Bell s={20} /></span><p>{t}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Why Kettlebells Win</div>
        <h2 className="sh">The Numbers Don't Lie</h2>
        <div className="three">
          {[["60","Minutes. That's It.","Strength, cardio, and mobility in one efficient session."],
            ["100%","Total Body","Glutes, core, shoulders, grip. Nothing gets left behind."],
            ["1","Tool. That's It.","No machines, no confusion. Just you and the bell."]].map(([n,t,p]) => (
            <div className="big" key={t}><div className="n">{n}</div><div className="t">{t}</div><p>{p}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Getting Started</div>
        <h2 className="sh">Three Steps To Ignition</h2>
        <p className="sh-sub">No experience needed. We meet you where you are.</p>
        <div className="steps">
          {[["01","Book A Class","Pick a time that works. Group classes are built for every level, and 1:1 training is there when you want it. Drop-ins always welcome."],
            ["02","Show Up","Small groups, max 10 people. Coach Mike guides every rep. You'll learn proper form from day one."],
            ["03","Get Strong","Feel the difference after one session. See it after four. Training that compounds. Every week you level up."]].map(([n,h,p]) => (
            <div className="step" key={n}><div className="num">{n}</div><h4>{h}</h4><p>{p}</p></div>
          ))}
        </div>
      </div></section>

      <LeadMagnet addLead={addLead} />

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Flexible Options</div>
        <h2 className="sh">Invest In Yourself</h2>
        <p className="sh-sub">Drop-ins, memberships, and 1:1 packs. Your first class is just $25.</p>
        <div className="price-grid">
          <div className="pcard">
            <div className="pname">Drop-In</div>
            <div className="pamt">$25<span> /class</span></div>
            <div className="pdesc">Try us out. No commitment.</div>
            <ul><li><Check /> Any class on the schedule</li><li><Check /> Expert coaching included</li><li><Check /> Perfect for first-timers</li></ul>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => go("book")}>Book a Session</button>
          </div>
          <div className="pcard feat">
            <span className="pbadge">Best Value</span>
            <div className="pname">Biweekly</div>
            <div className="pamt">$75<span> /2 weeks</span></div>
            <div className="pdesc">Commit to your fitness. Save money.</div>
            <ul><li><Check /> Unlimited group classes</li><li><Check /> All class types included</li><li><Check /> Online booking</li></ul>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => go("book")}>Get Started</button>
          </div>
          <div className="pcard">
            <div className="pname">1:1 Training</div>
            <div className="pamt">$80<span> /session</span></div>
            <div className="pdesc">Your goals. Your pace. Packs from $65/session.</div>
            <ul><li><Check /> One-on-one attention</li><li><Check /> 8 sessions, save $80</li><li><Check /> 12 sessions, save $180</li></ul>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => go("book")}>Book a Session</button>
          </div>
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="band"><div className="hero-glow2" />
          <h2>Ready To Ignite?</h2>
          <p>Your first class is waiting. Show up, work hard, see what happens.</p>
          <button className="btn btn-ghost" onClick={() => go("book")}>Get Started Today</button>
        </div>
      </div></section>
    </>
  );
}

/* ---------- booking ---------- */
function Booking({ bookings, addBooking, go, loaded }) {
  const [step, setStep] = useState(1);
  const [classType, setClassType] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [done, setDone] = useState(null);

  const days = useMemo(() => next14(), []);
  const cls = classType ? CLASS_MAP[classType] : null;

  const slotsFor = (d) => {
    const list = WEEKLY[new Date(d + "T00:00:00").getDay()] || [];
    return list.map(([t, type]) => {
      const taken = bookings.filter((b) => b.date === d && b.time === t && b.status !== "cancelled").length;
      const cap = cls ? cls.cap : 10;
      return { time: t, type, left: Math.max(0, cap - taken) };
    });
  };

  const confirm = () => {
    const b = { id: "b" + Date.now(), ref: makeRef(), name: form.name.trim(), email: form.email.trim(),
      phone: form.phone.trim(), classType, date, time, status: "confirmed", createdAt: Date.now() };
    addBooking(b); setDone(b); setStep(5);
  };

  if (done) {
    return (
      <div className="page"><div className="wrap"><div className="confirm">
        <div className="seal"><Check s={42} /></div>
        <h1>You're Booked</h1>
        <p style={{ color: "var(--ash)", fontSize: 16 }}>See you at the bell, {done.name.split(" ")[0]}. A confirmation is on its way to {done.email}.</p>
        <div className="ref">CONFIRMATION · {done.ref}</div>
        <div className="summary" style={{ marginTop: 24, textAlign: "left" }}>
          <div className="srow"><span className="k">Class</span><span className="v">{CLASS_MAP[done.classType].label}</span></div>
          <div className="srow"><span className="k">When</span><span className="v">{fmtDate(done.date)} · {done.time}</span></div>
          <div className="srow"><span className="k">Location</span><span className="v">9125 Archibald Ave, Ste D</span></div>
          <div className="srow total"><span className="k">Due at studio</span><span className="v">${CLASS_MAP[done.classType].price}</span></div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => go("home")}>Back Home</button>
          <button className="btn btn-primary" onClick={() => { setDone(null); setStep(1); setClassType(null); setDate(null); setTime(null); setForm({ name: "", email: "", phone: "" }); }}>Book Another</button>
        </div>
      </div></div></div>
    );
  }

  const canNext = (step === 1 && classType) || (step === 2 && date && time) ||
    (step === 3 && form.name && /\S+@\S+\.\S+/.test(form.email) && form.phone.length >= 7);

  return (
    <div className="page"><div className="wrap">
      <div className="page-head">
        <h1>Book Your Spot</h1>
        <p>Pick your class, grab a time, and we'll see you at the studio.</p>
      </div>

      <div className="steps-bar">
        {[1, 2, 3, 4].map((n, i) => (
          <React.Fragment key={n}>
            <div className={"sbubble" + (step === n ? " on" : step > n ? " done" : "")}>{step > n ? <Check /> : n}</div>
            {i < 3 && <div className={"sline" + (step > n ? " on" : "")} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <>
            <SLabel>Choose your training</SLabel>
            <div className="opt-grid">
              {CLASSES.map((c) => (
                <button key={c.id} className={"opt" + (classType === c.id ? " sel" : "")} onClick={() => setClassType(c.id)}>
                  <span className="oicon">{c.id === "pt" ? <User s={22} /> : <Bell s={22} />}</span>
                  <span><span className="otitle">{c.label}</span><span className="otag">{c.tag}</span><span className="odesc">{c.desc}</span></span>
                  <span className="oprice">${c.price}<small>{c.id === "pt" ? "per session" : "drop-in"}</small></span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <SLabel>Pick a date</SLabel>
            <div className="date-row">
              {days.map((d) => {
                const k = iso(d); const open = (WEEKLY[d.getDay()] || []).length > 0;
                return (
                  <button key={k} disabled={!open} className={"datechip" + (date === k ? " sel" : "")}
                    onClick={() => { setDate(k); setTime(null); }} style={!open ? { opacity: .3, cursor: "not-allowed" } : {}}>
                    <div className="dow">{DOW[d.getDay()]}</div>
                    <div className="dnum">{d.getDate()}</div>
                    <div className="dmo">{MON[d.getMonth()]}</div>
                  </button>
                );
              })}
            </div>
            {date ? (
              <>
                <SLabel>Available times</SLabel>
                <div className="slot-grid">
                  {slotsFor(date).map((s) => {
                    const cl = s.left === 0 ? "spots-none" : s.left <= 3 ? "spots-low" : "spots-ok";
                    return (
                      <button key={s.time} disabled={s.left === 0} className={"slot" + (time === s.time ? " sel" : "")} onClick={() => setTime(s.time)}>
                        <div className="stime">{s.time}</div>
                        <div className="stype">{(cls || CLASS_MAP[s.type]).label}</div>
                        <div className={"sspots " + cl}>{s.left === 0 ? "Full" : s.left + (s.left === 1 ? " spot left" : " spots left")}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : <div className="empty-day">Select a date to see open class times.</div>}
          </>
        )}

        {step === 3 && (
          <>
            <SLabel>Your details</SLabel>
            <div className="field"><label>Full name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
            <div className="field"><label>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@email.com" /></div>
            <div className="field"><label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(909) 555-0123" /></div>
          </>
        )}

        {step === 4 && (
          <>
            <SLabel>Review &amp; confirm</SLabel>
            <div className="summary">
              <div className="srow"><span className="k">Name</span><span className="v">{form.name}</span></div>
              <div className="srow"><span className="k">Class</span><span className="v">{cls.label}</span></div>
              <div className="srow"><span className="k">When</span><span className="v">{fmtDate(date)} · {time}</span></div>
              <div className="srow"><span className="k">Contact</span><span className="v">{form.email}</span></div>
              <div className="srow total"><span className="k">Due at studio</span><span className="v">${cls.price}</span></div>
            </div>
            <p style={{ color: "var(--ash)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center" }}>Payment handled in person. Cancel free up to 12 hours before.</p>
          </>
        )}
      </div>

      <div className="nav-btns">
        <button className="btn btn-ghost" onClick={() => step === 1 ? go("home") : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
        {step < 4
          ? <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <Arrow /></button>
          : <button className="btn btn-primary" onClick={confirm}>Confirm Booking <Check /></button>}
      </div>
    </div></div>
  );
}
const SLabel = ({ children }) => (<div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".14em", color: "var(--ember2)", textTransform: "uppercase", marginBottom: 18, fontWeight: 600 }}>{children}</div>);
function fmtDate(d) { const x = new Date(d + "T00:00:00"); return `${DOW[x.getDay()]}, ${MON[x.getMonth()]} ${x.getDate()}`; }

/* ---------- admin ---------- */
function Admin({ bookings, updateBooking, leads, loaded }) {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fWhen, setFWhen] = useState("upcoming");

  if (!authed) {
    return (
      <div className="adm"><div className="wrap"><div className="gate">
        <div className="glock"><Lock /></div>
        <h2>Coach Login</h2>
        <p>This dashboard is for Ignition staff. Enter your access code to manage bookings.</p>
        <div className="field"><input value={pass} onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pass === "ignite" && setAuthed(true)} placeholder="Access code" style={{ textAlign: "center", letterSpacing: ".3em" }} /></div>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={pass !== "ignite"} onClick={() => setAuthed(true)}>Enter Dashboard</button>
        <div className="hint">demo access code: <b style={{ color: "var(--ember2)" }}>ignite</b></div>
      </div></div></div>
    );
  }

  const today = iso(new Date());
  const weekEnd = iso(new Date(Date.now() + 7 * 86400000));

  const filtered = bookings
    .filter((b) => fStatus === "all" ? true : b.status === fStatus)
    .filter((b) => {
      if (fWhen === "today") return b.date === today;
      if (fWhen === "week") return b.date >= today && b.date <= weekEnd;
      if (fWhen === "upcoming") return b.date >= today;
      return true;
    })
    .sort((a, b) => a.date === b.date ? toMin(a.time) - toMin(b.time) : a.date.localeCompare(b.date));

  const active = bookings.filter((b) => b.status !== "cancelled");
  const todays = active.filter((b) => b.date === today);
  const upcoming = active.filter((b) => b.date >= today);
  const weekCount = active.filter((b) => b.date >= today && b.date <= weekEnd).length;
  const totalCap = todays.length ? Math.round((todays.length / (WEEKLY[new Date(today + "T00:00:00").getDay()]?.length * 10 || 50)) * 100) : 0;

  // today's schedule capacity
  const todaySlots = (WEEKLY[new Date(today + "T00:00:00").getDay()] || []).map(([t, type]) => {
    const n = active.filter((b) => b.date === today && b.time === t).length;
    return { time: t, type, n, cap: CLASS_MAP[type].cap };
  });

  return (
    <div className="adm"><div className="wrap">
      <div className="adm-top">
        <h1>Bookings Dashboard<small>IGNITION FITNESS · COACH MIKE</small></h1>
        <button className="btn btn-ghost" onClick={() => setAuthed(false)}>Sign out</button>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="kn">{todays.length}</div><div className="kl">Booked Today</div>
          <div className="kbar"><i style={{ width: Math.min(100, totalCap) + "%" }} /></div></div>
        <div className="kpi"><div className="kn">{upcoming.length}</div><div className="kl">Upcoming Total</div></div>
        <div className="kpi"><div className="kn">{weekCount}</div><div className="kl">Next 7 Days</div></div>
        <div className="kpi"><div className="kn">{active.filter((b) => b.status === "pending").length}</div><div className="kl">Awaiting Confirm</div></div>
      </div>

      <div className="adm-grid">
        <div className="panel">
          <div className="panel-h"><h3>Bookings</h3><span className="cnt">{filtered.length} shown</span></div>
          <div className="filters" style={{ padding: "14px 22px 4px" }}>
            {[["upcoming","Upcoming"],["today","Today"],["week","This Week"],["all","All Time"]].map(([k, l]) => (
              <button key={k} className={"fbtn" + (fWhen === k ? " on" : "")} onClick={() => setFWhen(k)}>{l}</button>
            ))}
          </div>
          <div className="filters" style={{ padding: "0 22px 12px" }}>
            {[["all","Any"],["confirmed","Confirmed"],["pending","Pending"],["checked-in","Checked-in"],["cancelled","Cancelled"]].map(([k, l]) => (
              <button key={k} className={"fbtn" + (fStatus === k ? " on" : "")} onClick={() => setFStatus(k)}>{l}</button>
            ))}
          </div>
          <div>
            {filtered.length === 0 && <div className="empty">No bookings match this filter.</div>}
            {filtered.map((b) => (
              <div className="book-row" key={b.id}>
                <div className="avatar">{b.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                <div className="bmeta">
                  <div className="bn">{b.name}</div>
                  <div className="bd">{CLASS_MAP[b.classType].label} · {fmtDate(b.date)} · {b.time} · {b.ref}</div>
                </div>
                <span className={"badge bg-" + b.status}>{b.status.replace("-", " ")}</span>
                <div className="row-acts">
                  {b.status !== "checked-in" && b.status !== "cancelled" && (
                    <button className="iact go" title="Check in" onClick={() => updateBooking(b.id, { status: "checked-in" })}><Check /></button>
                  )}
                  {b.status === "pending" && (
                    <button className="iact ok" title="Confirm" onClick={() => updateBooking(b.id, { status: "confirmed" })}><Bell s={14} /></button>
                  )}
                  {b.status !== "cancelled" && (
                    <button className="iact no" title="Cancel" onClick={() => updateBooking(b.id, { status: "cancelled" })}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="panel">
          <div className="panel-h"><h3>Today's Schedule</h3><span className="cnt">{fmtDate(today)}</span></div>
          {todaySlots.length === 0 && <div className="empty">No classes scheduled today.</div>}
          {todaySlots.map((s) => {
            const pct = Math.round((s.n / s.cap) * 100);
            const col = pct >= 100 ? "var(--flame)" : pct >= 70 ? "var(--gold)" : "var(--ember)";
            return (
              <div className="sched-row" key={s.time}>
                <div className="sched-time">{s.time}</div>
                <div className="sched-info">
                  <div className="st">{CLASS_MAP[s.type].label}</div>
                  <div className="capbar"><i style={{ width: Math.min(100, pct) + "%", background: col }} /></div>
                </div>
                <div className="sched-cnt" style={{ color: col }}>{s.n}/{s.cap}</div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="panel-h"><h3>Leads</h3><span className="cnt">{leads.length} captured</span></div>
          {leads.length === 0 && <div className="empty">No leads yet. The free-guide form feeds this list.</div>}
          {[...leads].sort((a, b) => b.createdAt - a.createdAt).map((l) => (
            <div className="lead-row" key={l.id}>
              <div className="le">{l.email}</div>
              <span className="lsrc">{l.source}</span>
              <span className="ld">{relTime(l.createdAt)}</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div></div>
  );
}

/* ---------- lead magnet ---------- */
function LeadMagnet({ addLead }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);
  const submit = () => { if (!valid) return; addLead(email.trim(), "kb-basics"); setDone(true); };
  return (
    <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
      <div className="lead"><div className="lead-glow" />
        <div>
          <div className="kicker">Free Download</div>
          <h2>The Kettlebell<br />Basics Guide</h2>
          <p className="lp">New to the bell? This free guide covers everything you need before your first swing. No fluff, just the fundamentals that keep you safe and strong.</p>
          <ul>
            <li><Check /> The 6 foundational movements, step by step</li>
            <li><Check /> How to breathe, brace, and protect your back</li>
            <li><Check /> A beginner workout you can do anywhere</li>
            <li><Check /> The 5 most common mistakes, and the fixes</li>
          </ul>
        </div>
        <div className="lead-form">
          {done ? (
            <div className="lead-done">
              <div className="lc"><Check s={30} /></div>
              <h4>Check Your Inbox</h4>
              <p>Your Kettlebell Basics guide is on its way to {email}. See you at the studio.</p>
            </div>
          ) : (
            <>
              <div className="ttl">Get It Free</div>
              <div className="sub">Drop your email and we'll send the PDF straight over.</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
                onKeyDown={(e) => e.key === "Enter" && submit()} />
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={!valid} onClick={submit}>Send Me The Guide</button>
              <div className="privacy">No spam, ever. Unsubscribe anytime.</div>
            </>
          )}
        </div>
      </div>
    </div></section>
  );
}

/* ---------- footer ---------- */
function Footer({ go }) {
  return (
    <footer className="foot"><div className="wrap">
      <div className="foot-grid">
        <div>
          <button className="logo" onClick={() => go("home")} style={{ marginBottom: 18 }}>
            <Logo h={62} />
          </button>
          <p style={{ maxWidth: "34ch" }}>Forging strength, one swing at a time. Small-group kettlebell training in Rancho Cucamonga.</p>
        </div>
        <div><h5>Navigate</h5>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Home</a>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Our Story</a>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Pricing</a>
          <a onClick={() => go("book")} style={{ cursor: "pointer" }}>Book a Class</a>
        </div>
        <div><h5>Contact</h5>
          <a href="mailto:mike@ignitionfitness.com">mike@ignitionfitness.com</a>
          <a href="tel:9099214463">(909) 921-4463</a>
          <p>9125 Archibald Ave, Ste D<br />Rancho Cucamonga, CA 91730</p>
        </div>
      </div>
      <div className="foot-bottom"><span>© 2026 Ignition Fitness</span><span>FORGE · SWING · REPEAT</span></div>
    </div></footer>
  );
}
