"use client";
import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function Logo({ h = 44 }) {
  return <img src="/images/logo.png" alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
}

// Shared navigation component for interior pages
export function Nav({ activePage }) {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className="nav">
        <div className="wrap nav-in">
          <button className="logo" onClick={() => router.push("/")}>
            <Logo h={52} />
          </button>
          <div className="nav-links">
            <button className="nlink" onClick={() => router.push("/")}>HOME</button>
            <button className={"nlink" + (activePage === "our-story" ? " on" : "")} onClick={() => router.push("/our-story")}>OUR STORY</button>
            <button className={"nlink" + (activePage === "studio" ? " on" : "")} onClick={() => router.push("/studio")}>THE STUDIO</button>
            <button className="nlink" onClick={() => router.push("/#pricing")}>PRICING</button>
            <button className={"nlink" + (activePage === "contact" ? " on" : "")} onClick={() => router.push("/contact")}>CONTACT</button>
            {user ? (
              <>
                <button className="nlink" onClick={() => router.push("/sessions")}>MY SESSIONS</button>
                <button className="nlink" onClick={() => signOut({ callbackUrl: "/" })}>SIGN OUT</button>
              </>
            ) : (
              <a className="nlink" href="/login">SIGN IN</a>
            )}
            <button className="btn btn-primary" onClick={() => router.push("/")} style={{ marginLeft: 8 }}>Book a Class</button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            )}
          </button>
        </div>
      </nav>
      <div className={"mobile-nav" + (mobileOpen ? " open" : "")}>
        <a className="nlink" href="/" onClick={closeMobile}>HOME</a>
        <a className={"nlink" + (activePage === "our-story" ? " on" : "")} href="/our-story" onClick={closeMobile}>OUR STORY</a>
        <a className={"nlink" + (activePage === "studio" ? " on" : "")} href="/studio" onClick={closeMobile}>THE STUDIO</a>
        <a className="nlink" href="/#pricing" onClick={closeMobile}>PRICING</a>
        <a className={"nlink" + (activePage === "contact" ? " on" : "")} href="/contact" onClick={closeMobile}>CONTACT</a>
        {user && (
          <a className="nlink" href="/sessions" onClick={closeMobile}>MY SESSIONS</a>
        )}
        {user
          ? <button className="nlink" onClick={() => { signOut({ callbackUrl: "/" }); closeMobile(); }}>SIGN OUT</button>
          : <a className="nlink" href="/login" onClick={closeMobile}>SIGN IN</a>}
        <a className="btn btn-primary" href="/" style={{ marginTop: 12, width: "100%", textAlign: "center" }}>Book a Class</a>
      </div>
    </>
  );
}
