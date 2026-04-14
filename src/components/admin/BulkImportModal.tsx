import { useState, useRef } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

const btn = { padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.2)" } as const;
const btnGhost = { padding: "10px 20px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "transparent", color: "#6E5E8A", cursor: "pointer", fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif" } as const;

interface Props {
  schoolId: string;
  onClose: () => void;
  onImported: () => void;
}

export default function BulkImportModal({ schoolId, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<{ name: string; grades: string }[]>([]);
  const [results, setResults] = useState<{ name: string; username: string; password: string }[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const start = lines[0]?.toLowerCase().includes("name") ? 1 : 0;
      const parsed = lines.slice(start).map((line) => {
        const parts = line.split(",");
        const name = parts[0]?.replace(/"/g, "").trim() || "";
        const grades = parts.slice(1).join(",").replace(/"/g, "").trim();
        return { name, grades };
      }).filter((r) => r.name);
      setRows(parsed);
      setError("");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (importing || rows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const res = await adminApi.bulkImportTeachers(schoolId, rows);
      setResults(res.teachers);
      onImported();
    } catch (e: any) { setError(e.message || "Import failed"); } finally { setImporting(false); }
  }

  function downloadCSV() {
    if (!results) return;
    const csv = "name,username,password\n" + results.map((r) => `"${r.name}","${r.username}","${r.password}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 24, padding: 28, width: "100%", maxWidth: 520,
        boxShadow: "0 24px 80px rgba(124,58,237,0.15)",
      }}>
        <h3 style={{ color: "#4C1D95", marginTop: 0, marginBottom: 16, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>
          {results ? "Import Complete" : "Bulk Import Teachers"}
        </h3>

        {!results ? (
          <>
            <p style={{ color: "#6E5E8A", fontSize: 13, marginBottom: 16 }}>
              Upload a CSV with columns: <code style={{ color: "#7C3AED", fontWeight: 600 }}>name, grades</code><br />
              Example: <code style={{ color: "#8B7AA8" }}>Priya Sharma, "1,2,3"</code>
            </p>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
              style={{ display: "block", marginBottom: 16, color: "#6E5E8A", fontSize: 13 }} />

            {rows.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "#7C3AED", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>{rows.length} teachers found:</p>
                <div style={{ maxHeight: 150, overflowY: "auto", background: "rgba(124,58,237,0.05)", borderRadius: 10, padding: 10, fontSize: 12, color: "#4C1D95" }}>
                  {rows.map((r, i) => <div key={i}>{r.name} — grades: {r.grades || "none"}</div>)}
                </div>
              </div>
            )}

            {error && <p style={{ color: "#F43F5E", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>{error}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleImport} disabled={importing || rows.length === 0}
                style={{ ...btn, opacity: rows.length > 0 ? 1 : 0.4, cursor: rows.length > 0 ? "pointer" : "default" }}>
                {importing ? <Spinner size={14} color="#fff" /> : `Import ${rows.length} Teachers`}
              </button>
              <button onClick={onClose} style={btnGhost}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: "#16a34a", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
              Successfully created {results.length} teacher accounts.
            </p>
            <div style={{ maxHeight: 200, overflowY: "auto", background: "rgba(124,58,237,0.05)", borderRadius: 10, padding: 10, fontSize: 12, color: "#4C1D95", marginBottom: 16 }}>
              {results.map((r, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {r.name} &rarr; <span style={{ color: "#7C3AED", fontWeight: 600 }}>{r.username}</span> / <span style={{ color: "#B45309", fontWeight: 600 }}>{r.password}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={downloadCSV} style={btn}>Download Credentials CSV</button>
              <button onClick={onClose} style={btnGhost}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
