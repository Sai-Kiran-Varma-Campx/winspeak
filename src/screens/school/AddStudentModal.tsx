import { useState } from "react";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";

interface Props {
  teacherGrades: number[];
  onClose: () => void;
  onCreated: () => void;
}

export default function AddStudentModal({ teacherGrades, onClose, onCreated }: Props) {
  const allowedGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const [fullName, setFullName] = useState("");
  const [studentExternalId, setStudentExternalId] = useState("");
  const [grade, setGrade] = useState<number>(allowedGrades[0]);
  const [section, setSection] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (!fullName.trim()) {
      setError("Please enter the student's full name.");
      return;
    }
    if (!studentExternalId.trim()) {
      setError("Please enter the roll number.");
      return;
    }
    if (!section.trim()) {
      setError("Please enter the section.");
      return;
    }
    if (parentEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parentEmail)) {
      setError("Parent email looks wrong.");
      return;
    }
    setLoading(true);
    try {
      await api.createStudent({
        fullName: fullName.trim(),
        studentExternalId: studentExternalId.trim() || null,
        grade,
        section: section.trim() || null,
        parentEmail: parentEmail.trim() || null,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || "Could not add student.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-[14px] px-4 py-3 text-[14px] font-semibold outline-none border mb-3";
  const inputStyle: React.CSSProperties = {
    background: "#fff",
    borderColor: "rgba(124, 58, 237, 0.15)",
    color: "#4C1D95",
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(76, 29, 149, 0.25)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] border-[1.5px] shadow-lg p-6 w-full max-w-md"
        style={{ borderColor: "rgba(124, 58, 237, 0.15)", boxShadow: "0 8px 32px rgba(124, 58, 237, 0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="text-[20px] font-extrabold" style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", color: "#4C1D95" }}>Add Student</div>
          <button
            onClick={onClose}
            className="text-[20px] leading-none cursor-pointer border-none bg-transparent"
            style={{ color: "#6E5E8A" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="block text-[11px] font-bold mb-1.5" style={{ color: "#6E5E8A" }}>FULL NAME</label>
          <input className={inputCls} style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} placeholder="e.g. Aanya Patel" autoFocus />

          <label className="block text-[11px] font-bold mb-1.5" style={{ color: "#6E5E8A" }}>ROLL NUMBER</label>
          <input className={inputCls} style={inputStyle} value={studentExternalId} onChange={(e) => setStudentExternalId(e.target.value)} maxLength={60} placeholder="e.g. 14" />

          <label className="block text-[11px] font-bold mb-1.5" style={{ color: "#6E5E8A" }}>GRADE</label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => {
              const active = grade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className="rounded-[14px] py-2.5 text-[14px] font-extrabold border"
                  style={{
                    background: active ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "#fff",
                    color: active ? "#fff" : "#4C1D95",
                    borderColor: active ? "transparent" : "rgba(124, 58, 237, 0.15)",
                    cursor: "pointer",
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>

          <label className="block text-[11px] font-bold mb-1.5" style={{ color: "#6E5E8A" }}>SECTION</label>
          <input className={inputCls} style={inputStyle} value={section} onChange={(e) => setSection(e.target.value)} maxLength={40} placeholder="e.g. A" />

          <label className="block text-[11px] font-bold mb-1.5" style={{ color: "#6E5E8A" }}>PARENT EMAIL (OPTIONAL)</label>
          <input className={inputCls} style={inputStyle} type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} maxLength={200} placeholder="parent@example.com" />

          {error && (
            <p className="text-[12px] mb-3 text-[#F43F5E]">{error}</p>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[14px] py-3 text-[14px] font-bold border cursor-pointer"
              style={{ background: "#fff", borderColor: "rgba(124, 58, 237, 0.15)", color: "#4C1D95" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-[14px] py-3 text-[14px] font-extrabold border-none cursor-pointer disabled:opacity-60 text-white"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
            >
              {loading ? <Spinner size={16} color="#fff" /> : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
