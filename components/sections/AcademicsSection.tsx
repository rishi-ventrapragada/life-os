"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import CourseCard from "@/components/academics/CourseCard";
import CourseForm from "@/components/academics/CourseForm";
import AssignmentForm from "@/components/academics/AssignmentForm";
import AssignmentList from "@/components/academics/AssignmentList";
import TimetableSlotForm from "@/components/academics/TimetableSlotForm";
import WeeklyTimetable from "@/components/academics/WeeklyTimetable";
import {
  useCourses,
  useAssignments,
} from "@/components/academics/AcademicsProvider";
import { useTimetable } from "@/components/academics/useTimetable";
import type {
  Assignment,
  Course,
  TimetableSlot,
} from "@/components/academics/types";

const accentBtn =
  "rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const subheading =
  "font-display text-sm uppercase tracking-[0.2em] text-(--color-text-muted)";

export default function AcademicsSection() {
  // Courses and assignments come from AcademicsProvider — one shared instance,
  // so Today's "What's due" and this section never disagree. The provider owns
  // the course-id list the assignment write guard needs.
  const courses = useCourses();
  const assignments = useAssignments();
  const timetable = useTimetable();

  const [addingCourse, setAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [addingSlot, setAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  const coursesReady = courses.status === "ready";
  const hasCourses = courses.courses.length > 0;

  async function saveCourse(data: Omit<Course, "id">) {
    const ok = editingCourse
      ? await courses.updateCourse(editingCourse, data)
      : await courses.addCourse(data);
    if (ok) {
      setAddingCourse(false);
      setEditingCourse(null);
    }
  }

  async function saveAssignment(data: Omit<Assignment, "id">) {
    const ok = editingAssignment
      ? await assignments.updateAssignment(editingAssignment.id, {
          title: data.title,
          dueDate: data.dueDate,
          status: data.status,
        })
      : await assignments.addAssignment(data);
    if (ok) {
      setAddingAssignment(false);
      setEditingAssignment(null);
    }
  }

  async function saveSlot(data: Omit<TimetableSlot, "id">) {
    const ok = editingSlot
      ? await timetable.updateSlot(editingSlot.id, data)
      : await timetable.addSlot(data);
    if (ok) {
      setAddingSlot(false);
      setEditingSlot(null);
    }
  }

  return (
    <section id="academics" className="scroll-mt-8 flex flex-col gap-8">
      <SectionHeader eyebrow="Courses and deadlines" title="Academics" />

      {/* Courses */}
      <Reveal index={0} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={subheading}>Courses</h3>
          {!addingCourse && (
            <button type="button" disabled={!coursesReady} onClick={() => setAddingCourse(true)} className={accentBtn}>
              + Add course
            </button>
          )}
        </div>
        {courses.error && <p role="alert" className="text-sm text-red-400">{courses.error}</p>}
        {addingCourse && (
          <CourseForm onSave={saveCourse} onCancel={() => setAddingCourse(false)} />
        )}
        {courses.status === "loading" ? (
          <GlowCard><p className="text-(--color-text-muted)">Loading courses…</p></GlowCard>
        ) : !hasCourses && !addingCourse ? (
          <GlowCard><p className="text-(--color-text-muted)">No courses yet. Add one to start tracking assignments.</p></GlowCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.courses.map((course) =>
              editingCourse === course.id ? (
                <CourseForm key={course.id} initial={course} onSave={saveCourse} onCancel={() => setEditingCourse(null)} />
              ) : (
                <CourseCard
                  key={course.id}
                  course={course}
                  assignments={assignments.assignments}
                  onEdit={() => setEditingCourse(course.id)}
                  onDelete={() => courses.deleteCourse(course.id)}
                />
              ),
            )}
          </div>
        )}
      </Reveal>

      {/* Assignments — only meaningful once a course exists */}
      {hasCourses && (
        <Reveal index={1} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={subheading}>Assignments</h3>
            {!addingAssignment && !editingAssignment && (
              <button type="button" disabled={assignments.status !== "ready"} onClick={() => setAddingAssignment(true)} className={accentBtn}>
                + Add assignment
              </button>
            )}
          </div>
          {assignments.error && <p role="alert" className="text-sm text-red-400">{assignments.error}</p>}
          {(addingAssignment || editingAssignment) && (
            <AssignmentForm
              courses={courses.courses}
              initial={editingAssignment ?? undefined}
              onSave={saveAssignment}
              onCancel={() => { setAddingAssignment(false); setEditingAssignment(null); }}
            />
          )}
          <AssignmentList
            assignments={assignments.assignments}
            courses={courses.courses}
            ready={assignments.status === "ready"}
            onToggle={(a) => assignments.updateAssignment(a.id, { status: a.status === "Done" ? "Pending" : "Done" })}
            onEdit={(a) => setEditingAssignment(a)}
            onDelete={(a) => assignments.deleteAssignment(a.id)}
          />
        </Reveal>
      )}

      {/* Timetable */}
      <Reveal index={2} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={subheading}>Weekly timetable</h3>
          {!addingSlot && !editingSlot && (
            <button type="button" disabled={timetable.status !== "ready"} onClick={() => setAddingSlot(true)} className={accentBtn}>
              + Add slot
            </button>
          )}
        </div>
        {timetable.error && <p role="alert" className="text-sm text-red-400">{timetable.error}</p>}
        {(addingSlot || editingSlot) && (
          <TimetableSlotForm
            initial={editingSlot ?? undefined}
            onSave={saveSlot}
            onCancel={() => { setAddingSlot(false); setEditingSlot(null); }}
          />
        )}
        {timetable.status === "loading" ? (
          <GlowCard><p className="text-(--color-text-muted)">Loading timetable…</p></GlowCard>
        ) : (
          <WeeklyTimetable
            slots={timetable.slots}
            onEdit={(s) => setEditingSlot(s)}
            onDelete={(s) => timetable.deleteSlot(s.id)}
          />
        )}
      </Reveal>
    </section>
  );
}
