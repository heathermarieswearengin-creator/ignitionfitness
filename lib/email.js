import { Resend } from "resend";
import { STUDIO } from "@/lib/config";
import { buildIcs, googleCalendarUrl } from "@/lib/ics";

const CLASS_TITLE = { GROUP: "Group Class", PT: "1:1 Personal Training" };

let client = null;
function resend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const fmtDay = (isoDay) =>
  new Date(`${isoDay}T00:00:00.000Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

function confirmationHtml(bookings) {
  const first = bookings[0];
  const rows = bookings
    .map(
      (b) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #3a261d;color:#f3ece1;font:600 15px Helvetica,Arial,sans-serif">
          ${CLASS_TITLE[b.sessionType] ?? "Session"}<br>
          <span style="color:#b0a193;font:400 13px Helvetica,Arial,sans-serif">${fmtDay(b.date)} at ${b.time}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #3a261d;text-align:right;vertical-align:top">
          <a href="${googleCalendarUrl(b)}" style="color:#f0ab33;font:600 12px Helvetica,Arial,sans-serif;text-decoration:none">Add to Google Calendar</a>
        </td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#0c0807;padding:28px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background:#140d0b;border:1px solid #3a261d;border-radius:14px">
      <tr><td style="padding:28px 26px 6px">
        <div style="font:700 12px Helvetica,Arial,sans-serif;letter-spacing:.18em;color:#e02d24;text-transform:uppercase">Ignition Fitness</div>
        <h1 style="margin:10px 0 4px;font:800 27px Helvetica,Arial,sans-serif;color:#f3ece1">You're booked</h1>
        <p style="margin:0 0 16px;font:400 15px Helvetica,Arial,sans-serif;color:#b0a193;line-height:1.6">
          See you at the bell, ${first.name.split(" ")[0]}. ${bookings.length > 1 ? `All ${bookings.length} sessions are confirmed.` : ""}
        </p>
      </td></tr>
      <tr><td style="padding:0 26px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>
      <tr><td style="padding:18px 26px 28px">
        <p style="margin:0 0 6px;font:400 13px Helvetica,Arial,sans-serif;color:#b0a193;line-height:1.7">
          <strong style="color:#f3ece1">Where:</strong> ${STUDIO.fullAddress}<br>
          <strong style="color:#f3ece1">Confirmation:</strong> ${bookings.map((b) => b.ref).join(", ")}
        </p>
        <p style="margin:14px 0 0;font:400 12px Helvetica,Arial,sans-serif;color:#6b5d52;line-height:1.7">
          A calendar invite is attached. Payment is handled at the studio.
          Cancel free up to 12 hours before your session.
        </p>
      </td></tr>
    </table>
  </body></html>`;
}

function confirmationText(bookings) {
  const lines = bookings.map((b) => `  ${CLASS_TITLE[b.sessionType] ?? "Session"} — ${fmtDay(b.date)} at ${b.time}`);
  return [
    `You're booked, ${bookings[0].name.split(" ")[0]}.`,
    "",
    ...lines,
    "",
    `Where: ${STUDIO.fullAddress}`,
    `Confirmation: ${bookings.map((b) => b.ref).join(", ")}`,
    "",
    "A calendar invite is attached. Payment is handled at the studio.",
    "Cancel free up to 12 hours before your session.",
  ].join("\n");
}

/**
 * Send a password reset link. Same contract as the confirmation: never throws,
 * returns a result the caller can act on.
 */
export async function sendPasswordReset({ to, name, link }) {
  const mailer = resend();
  if (!mailer) return { sent: false, reason: "no-api-key" };

  const first = (name || "").split(" ")[0] || "there";
  const html = `<!doctype html><html><body style="margin:0;background:#0c0807;padding:28px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background:#140d0b;border:1px solid #3a261d;border-radius:14px">
      <tr><td style="padding:28px 26px">
        <div style="font:700 12px Helvetica,Arial,sans-serif;letter-spacing:.18em;color:#e02d24;text-transform:uppercase">Ignition Fitness</div>
        <h1 style="margin:10px 0 6px;font:800 25px Helvetica,Arial,sans-serif;color:#f3ece1">Reset your password</h1>
        <p style="margin:0 0 20px;font:400 15px Helvetica,Arial,sans-serif;color:#b0a193;line-height:1.6">
          Hi ${first} — tap the button to choose a new password. This link works once and expires in an hour.
        </p>
        <a href="${link}" style="display:inline-block;background:#c9251c;color:#f3ece1;font:700 14px Helvetica,Arial,sans-serif;text-decoration:none;padding:13px 24px;border-radius:10px">Choose a new password</a>
        <p style="margin:20px 0 0;font:400 12px Helvetica,Arial,sans-serif;color:#6b5d52;line-height:1.7">
          If the button doesn't work, paste this into your browser:<br>
          <span style="color:#b0a193;word-break:break-all">${link}</span>
        </p>
        <p style="margin:16px 0 0;font:400 12px Helvetica,Arial,sans-serif;color:#6b5d52;line-height:1.7">
          Didn't ask for this? Ignore this email — your password stays as it is.
        </p>
      </td></tr>
    </table>
  </body></html>`;

  const text = [
    `Hi ${first},`,
    "",
    "Choose a new password using the link below. It works once and expires in an hour.",
    "",
    link,
    "",
    "Didn't ask for this? Ignore this email — your password stays as it is.",
  ].join("\n");

  try {
    const { data, error } = await mailer.emails.send({
      from: process.env.EMAIL_FROM || "Ignition Fitness <onboarding@resend.dev>",
      to,
      subject: "Reset your Ignition Fitness password",
      html,
      text,
    });
    if (error) {
      console.error("[email] reset send failed:", error);
      return { sent: false, reason: "provider-error", error };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("[email] reset send threw:", err);
    return { sent: false, reason: "exception" };
  }
}

/**
 * Send the booking confirmation with a calendar attachment.
 *
 * Never throws: a booking that succeeded must not be reported as failed just
 * because the mail provider is unreachable or unconfigured. Returns a result
 * object so callers can log what happened.
 */
export async function sendBookingConfirmation(bookings) {
  if (!bookings?.length) return { sent: false, reason: "no-bookings" };

  const mailer = resend();
  if (!mailer) return { sent: false, reason: "no-api-key" };

  const to = bookings[0].email;
  const ics = buildIcs(bookings);
  const filename =
    bookings.length === 1 ? `ignition-${bookings[0].ref}.ics` : "ignition-sessions.ics";

  try {
    const { data, error } = await mailer.emails.send({
      from: process.env.EMAIL_FROM || "Ignition Fitness <onboarding@resend.dev>",
      to,
      subject:
        bookings.length > 1
          ? `You're booked — ${bookings.length} sessions at Ignition Fitness`
          : `You're booked — ${fmtDay(bookings[0].date)} at ${bookings[0].time}`,
      html: confirmationHtml(bookings),
      text: confirmationText(bookings),
      // One combined calendar covers every session in the booking.
      attachments: [{ filename, content: Buffer.from(ics).toString("base64") }],
    });

    if (error) {
      console.error("[email] send failed:", error);
      return { sent: false, reason: "provider-error", error };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { sent: false, reason: "exception" };
  }
}
