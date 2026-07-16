import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function AcademicsSection() {
  return (
    <section id="academics" className="scroll-mt-8">
      <SectionHeader eyebrow="Courses and deadlines" title="Academics" />
      <div className="mt-6">
        <GlowCard>
          <p className="text-(--color-text-muted)">
            Course cards, the assignment list, and your weekly timetable will
            live here.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
