import { useState, useRef } from "react";
import { read, utils } from "xlsx";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

const btn = { padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.2)" } as const;
const btnGhost = { padding: "10px 20px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "transparent", color: "#6E5E8A", cursor: "pointer", fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif" } as const;
const glass = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.12)", borderRadius: 14 } as const;
const th = { padding: "8px 12px", textAlign: "left" as const, color: "#6E5E8A", fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.5 };
const td = { padding: "8px 12px", color: "#4C1D95", fontSize: 12 };
const font = "'Fredoka', 'Sora', sans-serif";

interface ParsedRow { name: string; email: string; grades: string; valid: boolean; error?: string }
interface ResultRow { name: string; email: string; username: string; password: string }

interface Props {
  schoolId: string;
  onClose: () => void;
  onImported: () => void;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z]/g, "");
}

function parseFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = read(data, { type: "array", raw: true, cellDates: false });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if (!sheet) { reject(new Error("No sheet found")); return; }

        const raw: any[][] = utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
        if (raw.length < 2) { reject(new Error("File must have a header row and at least one data row")); return; }

        // Find column indices from header row
        const headers = raw[0].map((h: any) => normalizeHeader(String(h)));
        const nameIdx = headers.findIndex((h: string) => h === "name" || h === "fullname" || h === "teachername");
        const emailIdx = headers.findIndex((h: string) => h === "email" || h === "emailid" || h === "emailaddress" || h === "mail");
        const gradesIdx = headers.findIndex((h: string) => h === "grades" || h === "grade" || h === "class" || h === "classes");

        if (nameIdx === -1) { reject(new Error("Missing required column: 'name'. Expected columns: name, email, grades")); return; }

        const rows: ParsedRow[] = [];
        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          const name = String(row[nameIdx] ?? "").replace(/^["']+|["']+$/g, "").trim();
          const email = emailIdx >= 0 ? String(row[emailIdx] ?? "").replace(/^["']+|["']+$/g, "").trim() : "";
          const grades = gradesIdx >= 0 ? String(row[gradesIdx] ?? "").replace(/^["']+|["']+$/g, "").trim() : "";

          // Skip completely empty rows
          if (!name && !email && !grades) continue;

          // Validate
          if (!name) {
            rows.push({ name: "", email, grades, valid: false, error: `Row ${i + 1}: Name is required` });
            continue;
          }

          // Validate email format if provided
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            rows.push({ name, email, grades, valid: false, error: `Row ${i + 1}: Invalid email "${email}"` });
            continue;
          }

          // Validate grades if provided
          if (grades) {
            const parts = grades.split(/[,\s]+/).filter(Boolean);
            const invalid = parts.find((g) => isNaN(Number(g)) || Number(g) < 1 || Number(g) > 10);
            if (invalid) {
              rows.push({ name, email, grades, valid: false, error: `Row ${i + 1}: Invalid grade "${invalid}" (must be 1-10)` });
              continue;
            }
          }

          rows.push({ name, email, grades, valid: true });
        }

        resolve(rows);
      } catch (e: any) {
        reject(new Error("Failed to parse file: " + (e.message || "Unknown error")));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function BulkImportModal({ schoolId, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      setError("Only .csv and .xlsx files are accepted");
      return;
    }
    setError("");
    setFileName(file.name);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) { setError("No data rows found in file"); return; }
      setRows(parsed);
    } catch (e: any) { setError(e.message); }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    if (importing || validRows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const teachers = validRows.map((r) => ({ name: r.name, email: r.email || undefined, grades: r.grades || undefined }));
      const res = await adminApi.bulkImportTeachers(schoolId, teachers);
      setResults(res.teachers);
      onImported();
    } catch (e: any) { setError(e.message || "Import failed"); } finally { setImporting(false); }
  }

  function downloadCSV() {
    if (!results) return;
    const csv = "name,email,username,password\n" + results.map((r) =>
      `"${r.name}","${r.email}","${r.username}","${r.password}"`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setRows([]);
    setFileName("");
    setError("");
    setResults(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 24, padding: 28, width: "100%", maxWidth: 600,
        boxShadow: "0 24px 80px rgba(124,58,237,0.15)", maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "#4C1D95", margin: 0, fontFamily: font, fontSize: 20 }}>
            {results ? "Import Complete" : "Bulk Import Teachers"}
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8B7AA8", cursor: "pointer", fontSize: 20, padding: 0 }}>✕</button>
        </div>

        {!results ? (
          <>
            {/* Instructions */}
            <div style={{ ...glass, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ color: "#4C1D95", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file with the following columns:
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>name *</span>
                <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(124,58,237,0.06)", color: "#8B7AA8" }}>email</span>
                <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(124,58,237,0.06)", color: "#8B7AA8" }}>grades</span>
              </div>
              <p style={{ color: "#8B7AA8", fontSize: 11, margin: "8px 0 0", lineHeight: 1.5 }}>
                Example: <code style={{ color: "#7C3AED" }}>Priya Sharma, priya@school.com, 1,2,3</code>
                <br />Grades should be numbers 1-10 separated by commas. Empty rows and whitespace are ignored.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#7C3AED" : "rgba(124,58,237,0.2)"}`,
                borderRadius: 16, padding: "28px 20px", textAlign: "center", cursor: "pointer",
                background: dragOver ? "rgba(124,58,237,0.06)" : "rgba(124,58,237,0.02)",
                transition: "all 0.2s", marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>📄</div>
              <p style={{ color: "#4C1D95", fontSize: 14, fontWeight: 600, margin: "0 0 4px", fontFamily: font }}>
                {fileName || "Drop file here or click to browse"}
              </p>
              <p style={{ color: "#8B7AA8", fontSize: 12, margin: 0 }}>Accepts .csv and .xlsx files only</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
            </div>

            {/* Validation results */}
            {rows.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {/* Summary */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ ...glass, padding: "10px 14px", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", fontFamily: font }}>{validRows.length}</div>
                    <div style={{ fontSize: 10, color: "#6E5E8A", textTransform: "uppercase", letterSpacing: 0.5 }}>Valid</div>
                  </div>
                  {invalidRows.length > 0 && (
                    <div style={{ ...glass, padding: "10px 14px", flex: 1, textAlign: "center", borderColor: "rgba(244,63,94,0.2)" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#e11d48", fontFamily: font }}>{invalidRows.length}</div>
                      <div style={{ fontSize: 10, color: "#6E5E8A", textTransform: "uppercase", letterSpacing: 0.5 }}>Skipped</div>
                    </div>
                  )}
                </div>

                {/* Validation errors */}
                {invalidRows.length > 0 && (
                  <div style={{
                    background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)",
                    borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#9f1239",
                  }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Skipped rows:</p>
                    {invalidRows.map((r, i) => <div key={i}>{r.error}</div>)}
                  </div>
                )}

                {/* Preview table */}
                {validRows.length > 0 && (
                  <div style={{ ...glass, padding: 0, overflow: "hidden" }}>
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.08)" }}>
                          <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Grades</th>
                        </tr></thead>
                        <tbody>
                          {validRows.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(124,58,237,0.05)" }}>
                              <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                              <td style={{ ...td, color: "#8B7AA8" }}>{r.email || "\u2014"}</td>
                              <td style={td}>
                                {r.grades ? r.grades.split(/[,\s]+/).filter(Boolean).map((g, j) => (
                                  <span key={j} style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: "rgba(124,58,237,0.08)", color: "#7C3AED", marginRight: 3 }}>{g}</span>
                                )) : <span style={{ color: "#C4B5FD" }}>&mdash;</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <p style={{ color: "#F43F5E", fontSize: 12, marginBottom: 12, fontWeight: 600 }}>{error}</p>}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <div>
                {rows.length > 0 && (
                  <button onClick={reset} style={{ ...btnGhost, fontSize: 12, padding: "8px 14px" }}>Reset</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onClose} style={btnGhost}>Cancel</button>
                <button onClick={handleImport} disabled={importing || validRows.length === 0}
                  style={{ ...btn, opacity: validRows.length > 0 ? 1 : 0.4, cursor: validRows.length > 0 ? "pointer" : "default" }}>
                  {importing ? <Spinner size={14} color="#fff" /> : `Import ${validRows.length} Teacher${validRows.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Success */}
            <div style={{ ...glass, padding: "16px 18px", marginBottom: 16, borderColor: "rgba(34,197,94,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <span style={{ color: "#16a34a", fontSize: 15, fontWeight: 700, fontFamily: font }}>
                  {results.length} teacher{results.length !== 1 ? "s" : ""} created successfully
                </span>
              </div>
              <p style={{ color: "#6E5E8A", fontSize: 12, margin: 0 }}>
                Download the credentials CSV and share with teachers. Passwords are shown only once.
              </p>
            </div>

            {/* Results table */}
            <div style={{ ...glass, padding: 0, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ maxHeight: 250, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.08)" }}>
                    <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Username</th><th style={th}>Password</th>
                  </tr></thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(124,58,237,0.05)" }}>
                        <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                        <td style={{ ...td, color: "#8B7AA8" }}>{r.email || "\u2014"}</td>
                        <td style={{ ...td, color: "#7C3AED", fontWeight: 700, fontFamily: "'Poppins', monospace" }}>{r.username}</td>
                        <td style={{ ...td, color: "#B45309", fontWeight: 700, fontFamily: "'Poppins', monospace" }}>{r.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btnGhost}>Close</button>
              <button onClick={downloadCSV} style={btn}>Download Credentials CSV</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
