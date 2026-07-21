import { describe, it, expect } from "vitest";
import { courseDoneTotal } from "@/lib/academics";

const a = (courseId: string, status: "Pending" | "Done") => ({ courseId, status });

describe("courseDoneTotal", () => {
  it("empty list is 0/0", () => {
    expect(courseDoneTotal([], "c1")).toEqual({ done: 0, total: 0 });
  });

  it("counts only the given course's rows", () => {
    const rows = [a("c1", "Done"), a("c2", "Done"), a("c1", "Pending")];
    expect(courseDoneTotal(rows, "c1")).toEqual({ done: 1, total: 2 });
  });

  it("all done", () => {
    expect(courseDoneTotal([a("c1", "Done"), a("c1", "Done")], "c1")).toEqual({
      done: 2,
      total: 2,
    });
  });

  it("none done", () => {
    expect(courseDoneTotal([a("c1", "Pending"), a("c1", "Pending")], "c1")).toEqual({
      done: 0,
      total: 2,
    });
  });

  it("a course with no assignments is 0/0", () => {
    expect(courseDoneTotal([a("c2", "Done")], "c1")).toEqual({ done: 0, total: 0 });
  });
});
