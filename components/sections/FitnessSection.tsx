import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function FitnessSection() {
  return (
    <section id="fitness" className="scroll-mt-8">
      <SectionHeader eyebrow="Training" title="Fitness" />
      <div className="mt-6">
        <GlowCard>
          <p className="text-(--color-text-muted)">
            Your weekly workout split and training log will live here.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
