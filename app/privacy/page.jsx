"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Theme } from "@/app/theme";
import { PageHeader } from "@/app/components/PageHeader";
import { Nav } from "@/app/components/Nav";

function Logo({ h = 44 }) {
  return <img src="/images/logo.png" alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
}

export default function PrivacyPage() {
  const router = useRouter();

  const sectionStyle = {
    marginBottom: 32,
  };

  const headingStyle = {
    fontSize: 20,
    fontWeight: 600,
    color: "var(--bone)",
    marginBottom: 12,
  };

  const paragraphStyle = {
    color: "var(--ash)",
    fontSize: 15,
    lineHeight: 1.7,
    marginBottom: 12,
  };

  const listStyle = {
    color: "var(--ash)",
    fontSize: 15,
    lineHeight: 1.7,
    paddingLeft: 24,
    marginBottom: 12,
  };

  return (
    <div className="ign">
      <Theme />
      <Nav activePage="" />

      <PageHeader
        badge="Legal"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information."
      />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div style={{
            background: "var(--f900)",
            border: "1.5px solid var(--line)",
            borderRadius: 16,
            padding: "32px 28px",
          }}>
            <p style={{ ...paragraphStyle, marginBottom: 24, fontStyle: "italic", color: "var(--ember2)" }}>
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>1. Information We Collect</h2>
              <p style={paragraphStyle}>
                When you use Ignition Fitness, we collect the following personal information:
              </p>
              <ul style={listStyle}>
                <li><strong>Contact information:</strong> Name, email address, and phone number (optional)</li>
                <li><strong>Account information:</strong> Login credentials (password is stored securely hashed)</li>
                <li><strong>Booking history:</strong> Records of classes and sessions you book with us</li>
                <li><strong>Contact form submissions:</strong> Messages you send through our contact form</li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>2. How We Use Your Information</h2>
              <p style={paragraphStyle}>
                We use your personal information to:
              </p>
              <ul style={listStyle}>
                <li>Create and manage your member account</li>
                <li>Process and confirm your class bookings</li>
                <li>Send booking confirmations, reminders, and updates via email</li>
                <li>Respond to your inquiries and contact form submissions</li>
                <li>Maintain records of your training history</li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>3. Third-Party Services</h2>
              <p style={paragraphStyle}>
                We use the following third-party services to operate our platform:
              </p>
              <ul style={listStyle}>
                <li><strong>Resend:</strong> Email delivery service for booking confirmations and communications</li>
                <li><strong>Vercel:</strong> Website hosting and infrastructure</li>
                <li><strong>Neon:</strong> Secure database hosting for your account and booking data</li>
              </ul>
              <p style={paragraphStyle}>
                We do not sell your personal information to third parties. We do not use advertising trackers or analytics services.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>4. Cookies</h2>
              <p style={paragraphStyle}>
                This website uses only essential cookies required for authentication and security. We do not use tracking cookies, advertising cookies, or third-party analytics cookies.
              </p>
              <ul style={listStyle}>
                <li><strong>Session cookie:</strong> Required to keep you logged in to your account</li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>5. Data Security</h2>
              <p style={paragraphStyle}>
                We take reasonable measures to protect your personal information:
              </p>
              <ul style={listStyle}>
                <li>Passwords are securely hashed using bcrypt</li>
                <li>All data is transmitted over HTTPS encryption</li>
                <li>Database access is restricted and secured</li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>6. Data Retention</h2>
              <p style={paragraphStyle}>
                We retain your account information and booking history for as long as your account is active. If you request account deletion, we will permanently remove your personal data and booking records from our systems.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>7. Your Rights</h2>
              <p style={paragraphStyle}>
                You have the right to:
              </p>
              <ul style={listStyle}>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and personal data</li>
              </ul>
              <p style={paragraphStyle}>
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:mike@ignitionfitness.com" style={{ color: "var(--ember2)" }}>
                  mike@ignitionfitness.com
                </a>.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={headingStyle}>8. Contact Us</h2>
              <p style={paragraphStyle}>
                If you have questions about this Privacy Policy or our data practices, please contact:
              </p>
              <p style={paragraphStyle}>
                <strong>Ignition Fitness</strong><br />
                9125 Archibald Ave, Ste D<br />
                Rancho Cucamonga, CA 91730<br />
                <a href="mailto:mike@ignitionfitness.com" style={{ color: "var(--ember2)" }}>
                  mike@ignitionfitness.com
                </a><br />
                <a href="tel:+19099214463" style={{ color: "var(--ember2)" }}>
                  (909) 921-4463
                </a>
              </p>
            </div>

            <div style={{
              marginTop: 32,
              padding: 16,
              background: "var(--f800)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--ash)",
              lineHeight: 1.6,
            }}>
              <strong>Note:</strong> This privacy policy is provided for informational purposes and describes our actual data practices. For a legally binding privacy policy tailored to your specific jurisdiction, we recommend consulting a privacy policy generator service (such as Termly or iubenda) or a legal professional.
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
            <span><a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
