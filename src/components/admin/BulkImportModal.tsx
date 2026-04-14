import { useState, useRef } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

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
      // Skip header if it looks like one
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
    } catch (e: any) {
      setError(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520 }}>
        <h3 style={{ color: "#e0e0ff", marginTop: 0, marginBottom: 16 }}>
          {results ? "Import Complete" : "Bulk Import Teachers"}
        </h3>

        {!results ? (
          <>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
              Upload a CSV with columns: <code style={{ color: "#6366f1" }}>name, grades</code><br />
              Example: <code style={{ color: "#888" }}>Priya Sharma, "1,2,3"</code>
            </p>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
              style={{ display: "block", marginBottom: 16, color: "#888", fontSize: 13 }} />

            {rows.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "#a5b4fc", fontSize: 13, marginBottom: 8 }}>{rows.length} teachers found:</p>
                <div style={{ maxHeight: 150, overflowY: "auto", background: "#12122a", borderRadius: 8, padding: 10, fontSize: 12, color: "#ccc" }}>
                  {rows.map((r, i) => (
                    <div key={i}>{r.name} — grades: {r.grades || "none"}</div>
                  ))}
                </div>
              </div>
            )}

            {error && <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 8 }}>{error}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleImport} disabled={importing || rows.length === 0}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: rows.length > 0 ? "#6366f1" : "#333", color: "#fff", cursor: rows.length > 0 ? "pointer" : "default", fontSize: 13 }}>
                {importing ? <Spinner size={14} color="#fff" /> : `Import ${rows.length} Teachers`}
              </button>
              <button onClick={onClose}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: "#22c55e", fontSize: 13, marginBottom: 16 }}>
              Successfully created {results.length} teacher accounts.
            </p>
            <div style={{ maxHeight: 200, overflowY: "auto", background: "#12122a", borderRadius: 8, padding: 10, fontSize: 12, color: "#ccc", marginBottom: 16 }}>
              {results.map((r, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {r.name} → <span style={{ color: "#8b5cf6" }}>{r.username}</span> / <span style={{ color: "#fbbf24" }}>{r.password}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={downloadCSV}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Download Credentials CSV
              </button>
              <button onClick={onClose}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
