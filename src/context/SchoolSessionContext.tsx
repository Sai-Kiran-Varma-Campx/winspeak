import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { SchoolCategoryId, SchoolQuestion } from "@/constants/challenges-school";

interface SchoolStudentLite {
  id: string;
  fullName: string;
  grade: number;
  section?: string | null;
}

/**
 * Holds the in-flight Challenge Administration Flow state.
 * Persisted only in memory — cleared when the teacher exits the flow.
 */
interface SchoolSessionState {
  // Step 1
  selectedCategory: SchoolCategoryId | null;
  // Step 2
  selectedGrade: number | null;
  selectedQuestion: SchoolQuestion | null;
  // Step 3
  rosterSnapshot: SchoolStudentLite[];
  currentStudentId: string | null;
  /** student id → status during this session */
  studentStatus: Record<string, "pending" | "active" | "done">;

  setCategory: (id: SchoolCategoryId) => void;
  setCustomChallenge: (title: string, prompt: string, scenario: string) => void;
  setGradeAndQuestion: (grade: number, q: SchoolQuestion) => void;
  setRoster: (students: SchoolStudentLite[]) => void;
  startStudent: (id: string) => void;
  markStudentDone: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<SchoolSessionState | null>(null);

export function SchoolSessionProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<SchoolCategoryId | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<SchoolQuestion | null>(null);
  const [rosterSnapshot, setRosterSnapshot] = useState<SchoolStudentLite[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState<Record<string, "pending" | "active" | "done">>({});

  const setCategory = useCallback((id: SchoolCategoryId) => {
    setSelectedCategory(id);
    setSelectedGrade(null);
    setSelectedQuestion(null);
  }, []);

  const setCustomChallenge = useCallback((title: string, prompt: string, scenario: string) => {
    setSelectedCategory("circletime" as SchoolCategoryId); // fallback category
    setSelectedGrade(1);
    setSelectedQuestion({
      id: `custom_${Date.now()}`,
      categoryId: "circletime" as SchoolCategoryId,
      grade: 1,
      title,
      prompt,
      scenario,
      durationSecs: 60,
    });
  }, []);

  const setGradeAndQuestion = useCallback((grade: number, q: SchoolQuestion) => {
    setSelectedGrade(grade);
    setSelectedQuestion(q);
  }, []);

  const setRoster = useCallback((students: SchoolStudentLite[]) => {
    setRosterSnapshot(students);
    const initial: Record<string, "pending" | "active" | "done"> = {};
    students.forEach((s) => {
      initial[s.id] = "pending";
    });
    setStudentStatus(initial);
    setCurrentStudentId(null);
  }, []);

  const startStudent = useCallback((id: string) => {
    setCurrentStudentId(id);
    setStudentStatus((prev) => ({ ...prev, [id]: "active" }));
  }, []);

  const markStudentDone = useCallback((id: string) => {
    setStudentStatus((prev) => ({ ...prev, [id]: "done" }));
    setCurrentStudentId(null);
  }, []);

  const reset = useCallback(() => {
    setSelectedCategory(null);
    setSelectedGrade(null);
    setSelectedQuestion(null);
    setRosterSnapshot([]);
    setCurrentStudentId(null);
    setStudentStatus({});
  }, []);

  return (
    <Ctx.Provider
      value={{
        selectedCategory,
        selectedGrade,
        selectedQuestion,
        rosterSnapshot,
        currentStudentId,
        studentStatus,
        setCategory,
        setCustomChallenge,
        setGradeAndQuestion,
        setRoster,
        startStudent,
        markStudentDone,
        reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSchoolSession(): SchoolSessionState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSchoolSession must be inside SchoolSessionProvider");
  return ctx;
}
