"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useCoursesState } from "@/components/academics/useCoursesState";
import { useAssignmentsState } from "@/components/academics/useAssignmentsState";

/* ----------------------------------------------------------------- context */

export type CoursesValue = ReturnType<typeof useCoursesState>;
export type AssignmentsValue = ReturnType<typeof useAssignmentsState>;

type AcademicsValue = { courses: CoursesValue; assignments: AssignmentsValue };

/**
 * An `undefined` default on purpose — no benign fallback. A consumer mounted
 * outside the provider would otherwise render empty lists and no-op writers: a
 * silently dead section rather than a loud failure.
 */
const AcademicsContext = createContext<AcademicsValue | undefined>(undefined);

/**
 * Holds courses and assignments together, because they are already coupled:
 * assignments needs the loaded course ids for its parent-ownership guard (the
 * DB's INSERT policy checks the caller owns the parent course). Keeping them in
 * one provider is what lets useAssignments() become parameterless — the
 * provider derives the course ids from its own course state instead of making
 * every caller thread them through.
 *
 * Mounted inside AuthGate (app/page.tsx) so neither fetch runs for a logged-out
 * visitor, and so signing out unmounts both rather than leaking rows into the
 * next session — the same placement as TasksProvider/HabitsProvider.
 */
export default function AcademicsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const courses = useCoursesState();
  const courseIds = useMemo(
    () => courses.courses.map((c) => c.id),
    [courses.courses],
  );
  const assignments = useAssignmentsState(courseIds);
  const value = useMemo(
    () => ({ courses, assignments }),
    [courses, assignments],
  );
  return (
    <AcademicsContext.Provider value={value}>
      {children}
    </AcademicsContext.Provider>
  );
}

function useAcademics(): AcademicsValue {
  const ctx = useContext(AcademicsContext);
  if (!ctx) {
    throw new Error(
      "useCourses/useAssignments must be used inside <AcademicsProvider>. Wrap the authed tree in app/page.tsx.",
    );
  }
  return ctx;
}

/** Read the shared course state anywhere below <AcademicsProvider>. */
export function useCourses(): CoursesValue {
  return useAcademics().courses;
}

/**
 * Read the shared assignment state anywhere below <AcademicsProvider>.
 * Parameterless by design — the provider supplies the course ids the write
 * guard needs.
 */
export function useAssignments(): AssignmentsValue {
  return useAcademics().assignments;
}
