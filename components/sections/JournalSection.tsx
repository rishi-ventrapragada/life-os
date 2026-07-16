import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function JournalSection() {
  return (
    <section id="journal" className="scroll-mt-8">
      <SectionHeader eyebrow="One entry per day" title="Journal" />
      <div className="mt-6">
        <GlowCard>
          <p className="text-(--color-text-muted)">
            Daily journal entries will live here, newest first.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
