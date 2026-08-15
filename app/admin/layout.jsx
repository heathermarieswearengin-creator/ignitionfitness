"use client";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "Overview", icon: "grid" },
  { href: "/admin/schedule", label: "Schedule", icon: "calendar" },
  { href: "/admin/bookings", label: "Bookings", icon: "list" },
  { href: "/admin/availability", label: "Availability", icon: "clock" },
  { href: "/admin/members", label: "Members", icon: "users" },
  { href: "/admin/leads", label: "Leads", icon: "inbox" },
];

function Icon({ name, size = 20 }) {
  const icons = {
    grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
    calendar: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />,
    list: <path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" />,
    clock: <circle cx="12" cy="12" r="10" />,
    users: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
    inbox: <path d="M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />,
    menu: <path d="M3 12h18M3 6h18M3 18h18" />,
    x: <path d="M18 6L6 18M6 6l12 12" />,
    logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  // Loading state
  if (status === "loading") {
    return (
      <div className="adm-layout">
        <style>{adminStyles}</style>
        <div className="adm-loading">
          <div className="adm-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="adm-layout">
        <style>{adminStyles}</style>
        <div className="adm-gate">
          <div className="adm-gate-icon">
            <Icon name="users" size={32} />
          </div>
          <h1>Coach Login Required</h1>
          <p>
            {user
              ? "Your account doesn't have admin access."
              : "Sign in with your coach account to access the dashboard."}
          </p>
          {user ? (
            <button className="adm-btn adm-btn-secondary" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign Out
            </button>
          ) : (
            <Link href="/login?next=/admin/overview" className="adm-btn adm-btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="adm-layout">
      <style>{adminStyles}</style>

      {/* Mobile header */}
      <header className="adm-mobile-header">
        <button className="adm-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Icon name={sidebarOpen ? "x" : "menu"} />
        </button>
        <span className="adm-mobile-title">Ignition Admin</span>
      </header>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`adm-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="adm-sidebar-header">
          <div className="adm-logo">
            <span className="adm-logo-icon">I</span>
            <div className="adm-logo-text">
              <span className="adm-logo-title">Ignition</span>
              <span className="adm-logo-sub">Coach {user?.name?.split(" ")[0] || "Mike"}</span>
            </div>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`adm-nav-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="adm-sidebar-footer">
          <button className="adm-nav-link adm-signout" onClick={() => signOut({ callbackUrl: "/" })}>
            <Icon name="logout" size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="adm-main">
        {children}
      </main>
    </div>
  );
}

const adminStyles = `
  .adm-layout {
    min-height: 100vh;
    display: flex;
    background: #f5f5f4;
    font-family: 'Archivo', system-ui, sans-serif;
  }

  /* Loading & Gate states */
  .adm-loading, .adm-gate {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #57534e;
  }
  .adm-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e7e5e4;
    border-top-color: #c9251c;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .adm-gate {
    text-align: center;
    padding: 24px;
  }
  .adm-gate-icon {
    width: 64px;
    height: 64px;
    background: #fef2f2;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c9251c;
    margin-bottom: 8px;
  }
  .adm-gate h1 {
    font-size: 20px;
    font-weight: 600;
    color: #1c1917;
    margin: 0;
  }
  .adm-gate p {
    color: #78716c;
    margin: 8px 0 24px;
    max-width: 300px;
  }

  /* Buttons */
  .adm-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    text-decoration: none;
    transition: all 0.15s;
  }
  .adm-btn-primary {
    background: #c9251c;
    color: white;
  }
  .adm-btn-primary:hover {
    background: #a61d16;
  }
  .adm-btn-secondary {
    background: #e7e5e4;
    color: #1c1917;
  }
  .adm-btn-secondary:hover {
    background: #d6d3d1;
  }

  /* Mobile header */
  .adm-mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: #0c0807;
    border-bottom: 1px solid #2a1f1a;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    z-index: 100;
  }
  .adm-menu-btn {
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: #f3ece1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
  }
  .adm-menu-btn:hover {
    background: #1d1411;
  }
  .adm-mobile-title {
    font-weight: 600;
    color: #f3ece1;
  }

  /* Overlay */
  .adm-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 199;
  }

  /* Sidebar */
  .adm-sidebar {
    width: 240px;
    background: #0c0807;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    position: sticky;
    top: 0;
  }
  .adm-sidebar-header {
    padding: 20px 16px;
    border-bottom: 1px solid #2a1f1a;
  }
  .adm-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .adm-logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #e02d24, #c9251c);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Anton', sans-serif;
    font-size: 22px;
    color: white;
  }
  .adm-logo-text {
    display: flex;
    flex-direction: column;
  }
  .adm-logo-title {
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    color: #f3ece1;
    letter-spacing: 0.02em;
  }
  .adm-logo-sub {
    font-size: 12px;
    color: #78716c;
  }

  /* Nav */
  .adm-nav {
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }
  .adm-nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    color: #a8a29e;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s;
    cursor: pointer;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
  }
  .adm-nav-link:hover {
    background: #1d1411;
    color: #f3ece1;
  }
  .adm-nav-link.active {
    background: #1d1411;
    color: #f3ece1;
    position: relative;
  }
  .adm-nav-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: #c9251c;
    border-radius: 0 2px 2px 0;
  }

  /* Sidebar footer */
  .adm-sidebar-footer {
    padding: 12px;
    border-top: 1px solid #2a1f1a;
  }
  .adm-signout {
    color: #78716c;
  }
  .adm-signout:hover {
    color: #fef2f2;
    background: #450a0a;
  }

  /* Main content */
  .adm-main {
    flex: 1;
    min-height: 100vh;
    padding: 32px;
    overflow-x: auto;
  }

  /* Page header */
  .adm-page-header {
    margin-bottom: 24px;
  }
  .adm-page-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1c1917;
    margin: 0 0 4px;
  }
  .adm-page-header p {
    color: #78716c;
    margin: 0;
    font-size: 14px;
  }

  /* Cards */
  .adm-card {
    background: white;
    border: 1px solid #e7e5e4;
    border-radius: 12px;
    padding: 20px;
  }
  .adm-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .adm-card-title {
    font-size: 14px;
    font-weight: 600;
    color: #1c1917;
    margin: 0;
  }

  /* Stat cards */
  .adm-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .adm-stat {
    background: white;
    border: 1px solid #e7e5e4;
    border-radius: 12px;
    padding: 20px;
  }
  .adm-stat-label {
    font-size: 12px;
    font-weight: 500;
    color: #78716c;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .adm-stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #1c1917;
    line-height: 1;
  }
  .adm-stat-sub {
    font-size: 13px;
    color: #a8a29e;
    margin-top: 4px;
  }
  .adm-stat.highlight {
    border-color: #c9251c;
    background: #fef2f2;
  }
  .adm-stat.highlight .adm-stat-value {
    color: #c9251c;
  }

  /* Tables */
  .adm-table {
    width: 100%;
    border-collapse: collapse;
  }
  .adm-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #78716c;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e7e5e4;
  }
  .adm-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f5f5f4;
    font-size: 14px;
    color: #1c1917;
  }
  .adm-table tr:hover {
    background: #fafaf9;
  }

  /* Badges */
  .adm-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
  }
  .adm-badge-green {
    background: #dcfce7;
    color: #166534;
  }
  .adm-badge-yellow {
    background: #fef9c3;
    color: #854d0e;
  }
  .adm-badge-red {
    background: #fef2f2;
    color: #991b1b;
  }
  .adm-badge-gray {
    background: #f5f5f4;
    color: #57534e;
  }

  /* Filters */
  .adm-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .adm-filter-btn {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #e7e5e4;
    background: white;
    font-size: 13px;
    font-weight: 500;
    color: #57534e;
    cursor: pointer;
    transition: all 0.15s;
  }
  .adm-filter-btn:hover {
    border-color: #d6d3d1;
    background: #fafaf9;
  }
  .adm-filter-btn.active {
    background: #1c1917;
    color: white;
    border-color: #1c1917;
  }

  /* Forms */
  .adm-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e7e5e4;
    border-radius: 8px;
    font-size: 14px;
    color: #1c1917;
    background: white;
    transition: border-color 0.15s;
  }
  .adm-input:focus {
    outline: none;
    border-color: #c9251c;
  }
  .adm-input::placeholder {
    color: #a8a29e;
  }
  .adm-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #57534e;
    margin-bottom: 6px;
  }
  .adm-field {
    margin-bottom: 16px;
  }

  /* Empty state */
  .adm-empty {
    text-align: center;
    padding: 48px 24px;
    color: #78716c;
  }
  .adm-empty-icon {
    width: 48px;
    height: 48px;
    background: #f5f5f4;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #a8a29e;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .adm-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .adm-mobile-header {
      display: flex;
    }
    .adm-sidebar {
      position: fixed;
      left: -240px;
      top: 0;
      bottom: 0;
      z-index: 200;
      transition: left 0.2s;
    }
    .adm-sidebar.open {
      left: 0;
    }
    .adm-overlay {
      display: block;
    }
    .adm-main {
      padding: 72px 16px 24px;
    }
    .adm-stats {
      grid-template-columns: 1fr;
    }
    .adm-page-header h1 {
      font-size: 20px;
    }
  }
`;
