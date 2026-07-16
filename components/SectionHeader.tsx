type SectionHeaderProps = {
  eyebrow: string;
  title: string;
};

export default function SectionHeader({ eyebrow, title }: SectionHeaderProps) {
  return (
    <header>
      <p className="font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em]">
        {title}
      </h2>
    </header>
  );
}
