import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useStore } from "@/context/UserStoreContext";
import Spinner from "@/components/Spinner";
import AddStudentModal from "./AddStudentModal";

interface StudentRow {
  id: string;
  fullName: string;
  grade: number;
  section: string | null;
  parentEmail: string | null;
  lastChallengeDate: string | null;
}

export default function TeacherHome() {
  const navigate = useNavigate();
  const store = useStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const rows = await api.listStudents() as StudentRow[];
      setStudents(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="home-page" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 70px)",
      padding: "40px 20px",
    }}>
      {/* Greeting card — glassmorphism */}
      <div className="school-glass" style={{
        padding: "50px 60px",
        textAlign: "center",
        maxWidth: 520,
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(255, 255, 255, 0.6)",
          padding: "4px 16px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          color: "#6b2fa0",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 12,
        }}>
          Welcome, Teacher
        </div>
        <h1 style={{
          fontFamily: "'Fredoka', 'Sora', sans-serif",
          fontSize: 52,
          fontWeight: 700,
          color: "#2d1b69",
          lineHeight: 1.1,
          marginBottom: 4,
        }}>
          {store.name}
        </h1>
        <p style={{
          fontFamily: "'Fredoka', 'Sora', sans-serif",
          fontSize: 32,
          fontWeight: 600,
          color: "#5a3e8a",
          marginBottom: 30,
        }}>
          Welcome Back!
        </p>

        <button
          onClick={() => navigate("/school/dashboard")}
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
            color: "white",
            padding: "14px 36px",
            borderRadius: 30,
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
            transition: "all 0.3s ease",
            fontFamily: "'Nunito', 'Poppins', sans-serif",
          }}
        >
          View Dashboard
        </button>
      </div>

      {showAdd && (
        <AddStudentModal
          teacherGrades={store.grades}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}
