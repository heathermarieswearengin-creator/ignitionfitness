"use client";
import { useState, useEffect } from "react";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

function Icon({ name, size = 20 }) {
  const icons = {
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"
  const [selectedId, setSelectedId] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "PATCH" });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, readAt: new Date().toISOString() } : m))
        );
      }
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/admin/messages/mark-all-read", { method: "POST" });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => m.readAt ? m : { ...m, readAt: new Date().toISOString() })
        );
      }
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const handleSelect = (msg) => {
    setSelectedId(msg.id);
    if (!msg.readAt) {
      markAsRead(msg.id);
    }
  };

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.readAt;
    if (filter === "read") return !!m.readAt;
    return true;
  });

  const selected = messages.find((m) => m.id === selectedId);
  const unreadCount = messages.filter((m) => !m.readAt).length;

  return (
    <div>
      <style>{pageStyles}</style>

      <div className="adm-page-header">
        <h1>Messages</h1>
        <p>Contact form submissions from your website</p>
      </div>

      {/* Filters */}
      <div className="msg-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          <button
            className={`adm-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            style={{ flexShrink: 0 }}
          >
            All ({messages.length})
          </button>
          <button
            className={`adm-filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
            style={{ flexShrink: 0 }}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`adm-filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
            style={{ flexShrink: 0 }}
          >
            Read ({messages.length - unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <button className="msg-mark-all-btn" onClick={markAllAsRead} style={{ flexShrink: 0, minHeight: 44, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "white", border: "1px solid #e7e5e4", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#57534e", cursor: "pointer" }}>
            <Icon name="checkCircle" size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-spinner" style={{ margin: "0 auto" }} />
            <p style={{ marginTop: 16 }}>Loading messages...</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <Icon name="mail" size={24} />
            </div>
            <p>No contact form submissions yet</p>
          </div>
        </div>
      ) : isMobile ? (
        /* Mobile: Full-screen detail view when message selected */
        selected ? (
          <div className="adm-card" style={{ padding: 0 }}>
            {/* Mobile back button */}
            <button
              onClick={() => setSelectedId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 16px",
                background: "#fafaf9",
                border: "none",
                borderBottom: "1px solid #e7e5e4",
                width: "100%",
                fontSize: 14,
                fontWeight: 500,
                color: "#c9251c",
                cursor: "pointer",
              }}
            >
              ← Back to messages
            </button>
            <div style={{ padding: 20 }}>
              <div className="msg-detail-header" style={{ borderBottom: "1px solid #f5f5f4", paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1c1917", margin: "0 0 4px" }}>{selected.name || "Anonymous"}</h2>
                  <span style={{ fontSize: 13, color: "#78716c" }}>{new Date(selected.createdAt).toLocaleString()}</span>
                </div>
                {selected.readAt && (
                  <span className="msg-read-badge">
                    <Icon name="check" size={14} />
                    Read
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <a href={`mailto:${selected.email}`} style={{ color: "#c9251c", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
                  {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "#c9251c", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
                    <Icon name="phone" size={14} />
                    {selected.phone}
                  </a>
                )}
              </div>

              {selected.interest && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Interested in:</span>
                  <span style={{ fontSize: 15, color: "#1c1917" }}>{selected.interest}</span>
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Message:</span>
                <p style={{ fontSize: 15, color: "#1c1917", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{selected.message || "(No message provided)"}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href={`mailto:${selected.email}?subject=Re: Your inquiry to Ignition Fitness`}
                  className="adm-btn adm-btn-primary"
                  style={{ textAlign: "center", textDecoration: "none", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  Reply via Email
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="adm-btn adm-btn-secondary" style={{ textAlign: "center", textDecoration: "none", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Mobile: Message list */
          <div className="adm-card" style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#78716c" }}>
                No {filter} messages
              </div>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  style={{
                    padding: 16,
                    borderBottom: "1px solid #f5f5f4",
                    background: !msg.readAt ? "#fffbeb" : "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: !msg.readAt ? 700 : 600, color: "#1c1917", fontSize: 14 }}>{msg.name || "Anonymous"}</span>
                    <span style={{ fontSize: 12, color: "#a8a29e" }}>{formatDate(msg.createdAt)}</span>
                  </div>
                  {msg.interest && (
                    <div style={{ fontSize: 12, color: "#c9251c", fontWeight: 500, marginBottom: 4 }}>{msg.interest}</div>
                  )}
                  <div style={{ fontSize: 13, color: "#78716c", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {msg.message?.slice(0, 60) || "(No message)"}
                    {msg.message?.length > 60 ? "..." : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      ) : (
        /* Desktop: Two-column layout */
        <div className="msg-layout">
          {/* Message list */}
          <div className="msg-list">
            {filtered.length === 0 ? (
              <div className="msg-empty">
                No {filter} messages
              </div>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg.id}
                  className={`msg-item ${!msg.readAt ? "unread" : ""} ${selectedId === msg.id ? "selected" : ""}`}
                  onClick={() => handleSelect(msg)}
                >
                  <div className="msg-item-header">
                    <span className="msg-item-name">{msg.name || "Anonymous"}</span>
                    <div className="msg-item-actions">
                      {!msg.readAt && (
                        <button
                          className="msg-mark-read-btn"
                          onClick={(e) => markAsRead(msg.id, e)}
                          title="Mark as read"
                        >
                          <Icon name="check" size={14} />
                        </button>
                      )}
                      <span className="msg-item-time">{formatDate(msg.createdAt)}</span>
                    </div>
                  </div>
                  {msg.interest && (
                    <div className="msg-item-interest">{msg.interest}</div>
                  )}
                  <div className="msg-item-preview">
                    {msg.message?.slice(0, 80) || "(No message)"}
                    {msg.message?.length > 80 ? "..." : ""}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message detail */}
          <div className="msg-detail">
            {selected ? (
              <>
                <div className="msg-detail-header">
                  <div>
                    <h2>{selected.name || "Anonymous"}</h2>
                    <span className="msg-detail-time">{new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                  {selected.readAt && (
                    <span className="msg-read-badge">
                      <Icon name="check" size={14} />
                      Read
                    </span>
                  )}
                </div>

                <div className="msg-detail-contact">
                  <a href={`mailto:${selected.email}`} className="msg-contact-link">
                    {selected.email}
                  </a>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="msg-contact-link">
                      <Icon name="phone" size={14} />
                      {selected.phone}
                    </a>
                  )}
                </div>

                {selected.interest && (
                  <div className="msg-detail-interest">
                    <span className="msg-detail-label">Interested in:</span>
                    <span>{selected.interest}</span>
                  </div>
                )}

                <div className="msg-detail-body">
                  <span className="msg-detail-label">Message:</span>
                  <p>{selected.message || "(No message provided)"}</p>
                </div>

                <div className="msg-actions">
                  <a
                    href={`mailto:${selected.email}?subject=Re: Your inquiry to Ignition Fitness`}
                    className="adm-btn adm-btn-primary"
                  >
                    Reply via Email
                  </a>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="adm-btn adm-btn-secondary">
                      Call
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="msg-detail-empty">
                <Icon name="mail" size={32} />
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyles = `
  .msg-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }
  .msg-toolbar .adm-filters {
    margin-bottom: 0;
  }
  .msg-mark-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: white;
    border: 1px solid #e7e5e4;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #57534e;
    cursor: pointer;
    transition: all 0.15s;
  }
  .msg-mark-all-btn:hover {
    background: #dcfce7;
    border-color: #86efac;
    color: #166534;
  }

  .msg-layout {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 24px;
    min-height: 500px;
  }

  .msg-list {
    background: white;
    border: 1px solid #e7e5e4;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .msg-empty {
    padding: 32px;
    text-align: center;
    color: #78716c;
  }

  .msg-item {
    display: block;
    width: 100%;
    padding: 16px;
    border: none;
    border-bottom: 1px solid #f5f5f4;
    background: white;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }
  .msg-item:hover {
    background: #fafaf9;
  }
  .msg-item.selected {
    background: #fef2f2;
    border-left: 3px solid #c9251c;
    padding-left: 13px;
  }
  .msg-item.unread {
    background: #fffbeb;
  }
  .msg-item.unread.selected {
    background: #fef2f2;
  }

  .msg-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .msg-item-name {
    font-weight: 600;
    color: #1c1917;
    font-size: 14px;
  }
  .msg-item.unread .msg-item-name {
    font-weight: 700;
  }
  .msg-item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .msg-item-time {
    font-size: 12px;
    color: #a8a29e;
  }
  .msg-mark-read-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: transparent;
    border: 1px solid #d6d3d1;
    border-radius: 4px;
    color: #78716c;
    cursor: pointer;
    transition: all 0.15s;
    opacity: 0;
  }
  .msg-item:hover .msg-mark-read-btn {
    opacity: 1;
  }
  .msg-mark-read-btn:hover {
    background: #dcfce7;
    border-color: #86efac;
    color: #166534;
  }
  .msg-item-interest {
    font-size: 12px;
    color: #c9251c;
    font-weight: 500;
    margin-bottom: 4px;
  }
  .msg-item-preview {
    font-size: 13px;
    color: #78716c;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .msg-detail {
    background: white;
    border: 1px solid #e7e5e4;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  .msg-detail-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #a8a29e;
  }

  .msg-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f5f5f4;
  }
  .msg-detail-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1c1917;
    margin: 0 0 4px;
  }
  .msg-detail-time {
    font-size: 13px;
    color: #78716c;
  }

  .msg-read-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: #dcfce7;
    color: #166534;
    font-size: 12px;
    font-weight: 500;
    border-radius: 9999px;
  }

  .msg-detail-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
  }
  .msg-contact-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #c9251c;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
  }
  .msg-contact-link:hover {
    text-decoration: underline;
  }

  .msg-detail-interest {
    margin-bottom: 20px;
  }
  .msg-detail-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #78716c;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .msg-detail-interest span:last-child {
    font-size: 15px;
    color: #1c1917;
  }

  .msg-detail-body {
    flex: 1;
    margin-bottom: 24px;
  }
  .msg-detail-body p {
    font-size: 15px;
    color: #1c1917;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  .msg-actions {
    display: flex;
    gap: 12px;
  }
`;
