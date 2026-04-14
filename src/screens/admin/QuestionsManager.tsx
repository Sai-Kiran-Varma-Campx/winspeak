import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ id: "", categoryId: "", questionNumber: 1, title: "", prompt: "", scenario: "", durationSecs: 60 });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.listQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const q of questions) {
    if (!grouped[q.categoryId]) grouped[q.categoryId] = [];
    grouped[q.categoryId].push(q);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError("");
    if (!form.id || !form.categoryId || !form.title || !form.prompt || !form.scenario) {
      setError("All fields are required");
      return;
    }
    setCreating(true);
    try {
      const created = await adminApi.createQuestion(form);
      setQuestions((prev) => [...prev, created]);
      setShowCreate(false);
      setForm({ id: "", categoryId: "", questionNumber: 1, title: "", prompt: "", scenario: "", durationSecs: 60 });
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await adminApi.deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;

  const inputStyle = {
    padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a",
    background: "#12122a", color: "#e0e0ff", fontSize: 13, width: "100%",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, margin: 0 }}>Questions</h1>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          + Add Question
        </button>
      </div>

      {showCreate && (
        <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ color: "#e0e0ff", marginTop: 0, marginBottom: 16 }}>New Question</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input placeholder="ID (e.g. ct-q6)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={inputStyle} />
              <input placeholder="Category ID" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inputStyle} />
              <input placeholder="Question #" type="number" value={form.questionNumber}
                onChange={(e) => setForm({ ...form, questionNumber: parseInt(e.target.value) || 1 })} style={inputStyle} />
            </div>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ ...inputStyle, marginBottom: 12 }} />
            <textarea placeholder="Prompt" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={3} style={{ ...inputStyle, marginBottom: 12, resize: "vertical" }} />
            <textarea placeholder="Scenario" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })}
              rows={3} style={{ ...inputStyle, marginBottom: 12, resize: "vertical" }} />
            {error && <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={creating}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 && (
        <p style={{ color: "#555", textAlign: "center", padding: 40 }}>No questions yet</p>
      )}

      {Object.entries(grouped).map(([category, qs]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, color: "#a5b4fc", fontWeight: 600, marginBottom: 10, textTransform: "capitalize" }}>
            {category} ({qs.length})
          </h2>
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#888", width: 40 }}>#</th>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#888" }}>Title</th>
                  <th style={{ padding: "8px 14px", textAlign: "center", color: "#888", width: 80 }}>Duration</th>
                  <th style={{ padding: "8px 14px", textAlign: "right", color: "#888", width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {qs.sort((a: any, b: any) => a.questionNumber - b.questionNumber).map((q: any) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                    <td style={{ padding: "8px 14px", color: "#6366f1" }}>{q.questionNumber}</td>
                    <td style={{ padding: "8px 14px" }}>{q.title}</td>
                    <td style={{ padding: "8px 14px", textAlign: "center", color: "#888" }}>{q.durationSecs}s</td>
                    <td style={{ padding: "8px 14px", textAlign: "right" }}>
                      <button onClick={() => deleteQuestion(q.id)}
                        style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #f43f5e33", background: "transparent", color: "#f43f5e", cursor: "pointer", fontSize: 11 }}>
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
