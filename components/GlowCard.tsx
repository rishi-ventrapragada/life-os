type GlowCardProps = {
  children: React.ReactNode;
  /**
   * "soft" (default) is grid-safe: a tight bloom that won't pool in the gutters
   * between neighbouring cards. "strong" is the full bloom — standalone/hero
   * cards only (e.g. Today).
   */
  glow?: "soft" | "strong";
  className?: string;
};

/**
 * The signature surface: dark card with a two-tone glow edge (amethyst core,
 * magenta bloom). Styles live in globals.css under `.glow-card*`.
 *
 * Presentational only. The `:focus-visible` ring is defined but inert until a
 * card becomes interactive — a plain div takes no focus. When Step 2 makes
 * these clickable, render the interactive element inside rather than adding
 * tabIndex here.
 */
export default function GlowCard({
  children,
  glow = "soft",
  className = "",
}: GlowCardProps) {
  return (
    <div className={`glow-card glow-card-${glow} rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}
