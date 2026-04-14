import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

const card = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.12)", borderRadius: 16 } as const;
const input = { padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "rgba(255,255,255,0.6)", color: "#4C1D95", fontSize: 14, fontFamily: "'Poppins', sans-serif", outline: "none", width: "100%" } as const;
const btn = { padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.2)" } as const;
const btnGhost = { padding: "10px 20px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "transparent", color: "#6E5E8A", cursor: "pointer", fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif" } as const;
const th = { padding: "8px 14px", textAlign: "left" as const, color: "#6E5E8A", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const };
const td = { padding: "8px 14px", color: "#4C1D95", fontSize: 13 };

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ id: "", categoryId: "", questionNumber: 1, title: "", prompt: "", scenario: "", durationSecs: 60 });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { adminApi.listQuestions().then(setQuestions).finally(() => setLoading(false)); }, []);

  const grouped: Record<string, any[]> = {};
  for (const q of questions) { if (!grouped[q.categoryId]) grouped[q.categoryId] = []; grouped[q.categoryId].push(q); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError("");
    if (!form.id || !form.categoryId || !form.title || !form.prompt || !form.scenario) { setError("All fields are required"); return; }
    setCreating(true);
    try {
      const created = await adminApi.createQuestion(form);
      setQuestions((prev) => [...prev, created]);
      setShowCreate(false);
      setForm({ id: "", categoryId: "", questionNumber: 1, title: "", prompt: "", scenario: "", durationSecs: 60 });
    } catch (e: any) { setError(e.message || "Failed"); } finally { setCreating(false); }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await adminApi.deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: "#4C1D95", fontWeight: 700, margin: 0, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>Questions</h1>
        <button onClick={() => setShowCreate(true)} style={btn}>+ Add Question</button>
      </div>

      {showCreate && (
        <div style={{ ...card, padding: 24, marginBottom: 20 }}>
          <h3 style={{ color: "#4C1D95", marginTop: 0, marginBottom: 16, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>New Question</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input placeholder="ID (e.g. ct-q6)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={input} />
              <input placeholder="Category ID" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={input} />
              <input placeholder="Question #" type="number" value={form.questionNumber}
                onChange={(e) => setForm({ ...form, questionNumber: parseInt(e.target.value) || 1 })} style={input} />
            </div>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ ...input, marginBottom: 12 }} />
            <textarea placeholder="Prompt" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={3} style={{ ...input, marginBottom: 12, resize: "vertical" } as any} />
            <textarea placeholder="Scenario" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })}
              rows={3} style={{ ...input, marginBottom: 12, resize: "vertical" } as any} />
            {error && <p style={{ color: "#F43F5E", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={creating} style={btn}>{creating ? "Creating..." : "Create"}</button>
              <button type="button" onClick={() => setShowCreate(false)} style={btnGhost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 && <p style={{ color: "#8B7AA8", textAlign: "center", padding: 40 }}>No questions yet</p>}

      {Object.entries(grouped).map(([category, qs]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, color: "#7C3AED", fontWeight: 600, marginBottom: 10, textTransform: "capitalize", fontFamily: "'Fredoka', 'Sora', sans-serif" }}>
            {category} ({qs.length})
          </h2>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.08)" }}>
                <th style={{ ...th, width: 40 }}>#</th><th style={th}>Title</th>
                <th style={{ ...th, textAlign: "center", width: 80 }}>Duration</th>
                <th style={{ ...th, textAlign: "right", width: 80 }}>Actions</th>
              </tr></thead>
              <tbody>
                {qs.sort((a: any, b: any) => a.questionNumber - b.questionNumber).map((q: any) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid rgba(124,58,237,0.06)" }}>
                    <td style={{ ...td, color: "#7C3AED", fontWeight: 600 }}>{q.questionNumber}</td>
                    <td style={td}>{q.title}</td>
                    <td style={{ ...td, textAlign: "center", color: "#8B7AA8" }}>{q.durationSecs}s</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button onClick={() => deleteQuestion(q.id)}
                        style={{ padding: "3px 10px", borderRadius: 8, border: "1.5px solid rgba(244,63,94,0.2)", background: "transparent", color: "#e11d48", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
