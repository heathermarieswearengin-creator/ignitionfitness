// Reusable secondary contact CTA - a subtle link beneath primary booking CTAs
// Provides an alternative path for users with questions before committing

export function SecondaryContactCTA({ text = "Have questions first?", linkText = "Contact us" }) {
  return (
    <p style={{
      marginTop: 16,
      fontSize: 14,
      color: "var(--ash)",
      fontFamily: "var(--body)",
    }}>
      {text}{" "}
      <a
        href="/contact"
        style={{
          color: "var(--ember2)",
          textDecoration: "underline",
          textUnderlineOffset: 2,
        }}
      >
        {linkText}
      </a>
    </p>
  );
}
