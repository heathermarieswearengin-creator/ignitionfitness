"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Theme } from "@/app/theme";
import { PageHeader } from "@/app/components/PageHeader";
import { Nav } from "@/app/components/Nav";

function Logo({ h = 44 }) {
  return <img src="/images/logo.png" alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
}

export default function StudioPage() {
  const router = useRouter();

  return (
    <div className="ign">
      <Theme />
      <Nav activePage="studio" />

      {/* Page Header */}
      <PageHeader
        badge="Take a Look Inside"
        title="The Studio"
        subtitle="9,000 sq ft of dedicated kettlebell training space in Rancho Cucamonga."
      />

      {/* Gallery - using inline styles for reliability */}
      <style>{`
        .gallery-grid-top {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .gallery-grid-main {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 40px;
        }
        .gallery-img {
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          width: 100%;
          min-width: 0;
        }
        .gallery-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .gallery-img-tall { height: 380px; }
        .gallery-img-wide { height: 280px; }
        .gallery-img-med { height: 280px; }
        .gallery-img-detail { width: 260px; height: 220px; flex-shrink: 0; }
        .gallery-cta-row {
          display: flex;
          gap: 20px;
          align-items: stretch;
        }
        .gallery-cta-row .band {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (max-width: 1024px) {
          .gallery-grid-top { grid-template-columns: 1fr 1fr; gap: 12px; }
          .gallery-grid-main { grid-template-columns: 1fr 1fr; gap: 12px; }
          .gallery-img-tall { height: 280px; }
          .gallery-img-wide { height: 240px; grid-column: span 2; }
          .gallery-img-med { height: 220px; }
        }
        @media (max-width: 768px) {
          .gallery-grid-top { grid-template-columns: 1fr; }
          .gallery-grid-main { grid-template-columns: 1fr; }
          .gallery-img-tall { height: 240px; }
          .gallery-img-wide { height: 220px; grid-column: auto; }
          .gallery-img-med { height: 200px; }
          .gallery-cta-row { flex-direction: column; gap: 16px; }
          .gallery-img-detail { width: 100%; height: 200px; }
        }
        @media (max-width: 500px) {
          .gallery-img-tall, .gallery-img-wide, .gallery-img-med { height: 180px; }
          .gallery-img-detail { height: 160px; }
        }
      `}</style>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {/* Top row - exterior shots */}
          <div className="gallery-grid-top">
            <div className="gallery-img gallery-img-tall">
              <img src="/images/exterior-storefront.JPG" alt="Ignition Fitness building exterior with turf lawn" loading="lazy" />
            </div>
            <div className="gallery-img gallery-img-tall">
              <img src="/images/signage-closeup.JPG" alt="Ignition Fitness storefront signage" loading="lazy" />
            </div>
          </div>

          {/* Interior grid */}
          <div className="gallery-grid-main">
            <div className="gallery-img gallery-img-wide">
              <img src="/images/training-floor.JPG" alt="Open training floor with kettlebell wall and rig" loading="lazy" />
            </div>
            <div className="gallery-img gallery-img-med">
              <img src="/images/entrance-hallway.JPG" alt="Glass entry hallway leading to gym floor" loading="lazy" />
            </div>
            <div className="gallery-img gallery-img-med">
              <img src="/images/strength-machines.JPG" alt="Secondary equipment room with machines" loading="lazy" />
            </div>
          </div>

          {/* CTA with detail image */}
          <div className="gallery-cta-row">
            <div className="gallery-img gallery-img-detail">
              <img src="/images/kettlebell-detail.JPG" alt="Kettlebell close-up with Ignition logo" loading="lazy" />
            </div>
            <div className="band">
              <div className="hero-glow2" />
              <h2>Come See It For Yourself</h2>
              <p>Your first class is just $25. No commitment, no contracts.</p>
              <button className="btn btn-ghost" onClick={() => router.push("/#book")}>Book Your First Class</button>
              <p style={{ marginTop: 16, fontSize: 14, color: "var(--ash)" }}>
                Have questions first? <a href="/contact" style={{ color: "var(--ember2)", textDecoration: "underline", textUnderlineOffset: 2 }}>Contact us</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <button className="logo" onClick={() => router.push("/")} style={{ marginBottom: 16 }}>
                <Logo h={44} />
              </button>
              <p style={{ maxWidth: "34ch" }}>Forging strength, one swing at a time. Small-group kettlebell training in Rancho Cucamonga.</p>
            </div>
            <div>
              <h5>Navigate</h5>
              <a href="/">Home</a>
              <a href="/our-story">Our Story</a>
              <a href="/studio">The Studio</a>
              <a href="/#pricing">Pricing</a>
              <a href="/contact">Contact</a>
            </div>
            <div>
              <h5>Contact</h5>
              <a href="mailto:mike@ignitionfitness.com">mike@ignitionfitness.com</a>
              <a href="tel:9099214463">(909) 921-4463</a>
              <p>9125 Archibald Ave, Ste D<br />Rancho Cucamonga, CA 91730</p>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} Ignition Fitness. All rights reserved.</span>
            <span><a href="/privacy" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
