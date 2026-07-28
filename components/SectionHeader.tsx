type SectionHeaderProps = {
  /**
   * Optional. Omitting it renders the title alone — the `mt-2` that spaces the
   * title from the eyebrow is dropped with it, so a header without an eyebrow
   * has no stray gap above the title. Every section that passes one renders
   * exactly as before.
   */
  eyebrow?: string;
  title: string;
};

export default function SectionHeader({ eyebrow, title }: SectionHeaderProps) {
  return (
    <header>
      {eyebrow && (
        <p className="font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-display text-4xl font-bold tracking-[-0.03em] ${
          eyebrow ? "mt-2" : ""
        }`}
      >
        {title}
      </h2>
    </header>
  );
}
