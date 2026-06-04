import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const blankStudent = {
  studentId: "",
  name: "",
  satCode: "",
  penCode: "",
  className: "",
  passes: 0,
  fails: 0,
  absent: 0,
  totalMarks: 0,
  examsTaken: 0,
  average: 0,
  results: []
};

export default function MarksOverview() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ classId: "", examType: "", search: "" });
  const [classes, setClasses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [overview, setOverview] = useState({
    summary: {
      totalStudents: 0,
      totalExams: 0,
      totalMarks: 0,
      passedCount: 0,
      failedCount: 0,
      absentCount: 0,
      teacherCount: 0
    },
    teachers: [],
    students: [],
    failedBreakdown: [],
    exams: []
  });
  const [selectedStudentId, setSelectedStudentId] = useState("");

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [classesRes, examTypesRes] = await Promise.all([
          api.get("/classes"),
          api.get("/exam-types")
        ]);
        setClasses(classesRes.data || []);
        setExamTypes(examTypesRes.data || []);
      } catch (error) {
        console.error("Unable to load marks filters", error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const params = {
          ...(filters.classId ? { classId: filters.classId } : {}),
          ...(filters.examType ? { examType: filters.examType } : {}),
          ...(filters.search.trim() ? { search: filters.search.trim() } : {})
        };
        const { data } = await api.get("/marks/admin/overview", { params });
        setOverview(data);
        setSelectedStudentId(prev => {
          if (data?.students?.some(student => student.studentId === prev)) return prev;
          return data?.students?.[0]?.studentId || "";
        });
      } catch (error) {
        console.error("Unable to load marks overview", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [filters.classId, filters.examType, filters.search]);

  const selectedStudent = useMemo(
    () => overview.students.find(student => student.studentId === selectedStudentId) || overview.students[0] || blankStudent,
    [overview.students, selectedStudentId]
  );

  const summaryCards = [
    { title: "Students", value: overview.summary.totalStudents, icon: "fa-solid fa-user-graduate", color: "#0e6b6b" },
    { title: "Exams", value: overview.summary.totalExams, icon: "fa-solid fa-file-invoice", color: "#c8960c" },
    { title: "Failed", value: overview.summary.failedCount, icon: "fa-solid fa-triangle-exclamation", color: "#b91c1c" },
    { title: "Teachers Uploaded", value: overview.summary.teacherCount, icon: "fa-solid fa-chalkboard-user", color: "#0369a1" }
  ];

  const selectedStudentPassRate = selectedStudent.examsTaken
    ? Math.round((selectedStudent.passes / selectedStudent.examsTaken) * 100)
    : 0;

  if (loading) {
    return <div style={s.loading}>Loading Marks Overview...</div>;
  }

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div>
          <p style={s.eyebrow}>Evaluation</p>
          <h1 style={s.title}>Marks Overview</h1>
          <p style={s.sub}>
            View teacher uploads, student-wise marks, failed subjects, and exam performance across classes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFilters({ classId: "", examType: "", search: "" })}
          style={s.resetBtn}
        >
          <i className="fa-solid fa-rotate-right" style={{ marginRight: 8 }} />
          Reset Filters
        </button>
      </div>

      <div style={s.filterBar}>
        <label style={s.field}>
          <span style={s.label}>Class</span>
          <select
            value={filters.classId}
            onChange={e => setFilters(prev => ({ ...prev, classId: e.target.value }))}
            style={s.input}
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>
                {[cls.name, cls.section].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        </label>

        <label style={s.field}>
          <span style={s.label}>Exam Type</span>
          <select
            value={filters.examType}
            onChange={e => setFilters(prev => ({ ...prev, examType: e.target.value }))}
            style={s.input}
          >
            <option value="">All Exam Types</option>
            {examTypes.map(type => (
              <option key={type._id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ ...s.field, flex: 1 }}>
          <span style={s.label}>Search student</span>
          <div style={s.searchWrap}>
            <i className="fa-solid fa-magnifying-glass" style={s.searchIcon} />
            <input
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by name, SAT code, or PEN code"
              style={s.searchInput}
            />
          </div>
        </label>
      </div>

      <div style={s.statsGrid}>
        {summaryCards.map(card => (
          <div key={card.title} style={s.statCard}>
            <div style={{ ...s.statIcon, color: card.color, background: `${card.color}14` }}>
              <i className={card.icon} />
            </div>
            <div>
              <div style={s.statValue}>{card.value}</div>
              <div style={s.statLabel}>{card.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.panelGrid}>
        <section style={s.panel}>
          <div style={s.panelHeader}>
            <h2 style={s.panelTitle}>Teachers Who Uploaded Marks</h2>
            <span style={s.panelBadge}>{overview.teachers.length} teachers</span>
          </div>

          <div style={s.teacherList}>
            {overview.teachers.length ? overview.teachers.map(teacher => (
              <div key={teacher.id} style={s.teacherRow}>
                <div>
                  <div style={s.teacherName}>{teacher.name}</div>
                  <div style={s.teacherMeta}>{teacher.marksCount} marks across {teacher.examCount} exams</div>
                </div>
                <div style={s.teacherCount}>{teacher.marksCount}</div>
              </div>
            )) : <div style={s.empty}>No marks uploaded yet.</div>}
          </div>
        </section>

        <section style={s.panel}>
          <div style={s.panelHeader}>
            <h2 style={s.panelTitle}>Failed Students and Subjects</h2>
            <span style={s.panelBadge}>{overview.failedBreakdown.length} entries</span>
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Exam</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {overview.failedBreakdown.length ? overview.failedBreakdown.map((row, idx) => (
                  <tr key={`${row.studentId}-${row.examTitle}-${row.subjectName}-${idx}`}>
                    <td>
                      <div style={s.cellTitle}>{row.name}</div>
                      <div style={s.cellSub}>{row.satCode || "SAT code not set"}</div>
                    </td>
                    <td>{row.className}</td>
                    <td>{row.subjectName}</td>
                    <td>
                      <div style={s.cellTitle}>{row.examTitle}</div>
                      <div style={s.cellSub}>{row.examType}</div>
                    </td>
                    <td>
                      <span style={row.marksObtained === "AB" ? s.absentPill : s.failPill}>
                        {row.marksObtained === "AB" ? "Absent" : `${row.marksObtained}/${row.maxMarks}`}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={s.emptyCell}>No failed marks found for the current filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div style={s.bottomGrid}>
        <section style={s.panel}>
          <div style={s.panelHeader}>
            <h2 style={s.panelTitle}>Students</h2>
            <span style={s.panelBadge}>{overview.students.length} students</span>
          </div>

          <div style={s.studentList}>
            {overview.students.length ? overview.students.map(student => {
              const isSelected = student.studentId === selectedStudent.studentId;
              return (
                <button
                  key={student.studentId}
                  type="button"
                  onClick={() => setSelectedStudentId(student.studentId)}
                  style={{ ...s.studentCard, ...(isSelected ? s.studentCardActive : {}) }}
                >
                  <div style={s.studentCardTop}>
                    <div>
                      <div style={s.studentName}>{student.name}</div>
                      <div style={s.studentMeta}>{student.satCode} {student.className ? `• ${student.className}` : ""}</div>
                    </div>
                    <span style={student.fails > 0 || student.absent > 0 ? s.warnPill : s.goodPill}>
                      {student.fails > 0 || student.absent > 0 ? "Needs Review" : "Stable"}
                    </span>
                  </div>
                  <div style={s.studentMetrics}>
                    <span>Pass {student.passes}</span>
                    <span>Fail {student.fails}</span>
                    <span>Absent {student.absent}</span>
                    <span>Avg {student.average}</span>
                  </div>
                </button>
              );
            }) : <div style={s.empty}>No students match the selected filters.</div>}
          </div>
        </section>

        <section style={s.panel}>
          <div style={s.panelHeader}>
            <h2 style={s.panelTitle}>Individual Student Marks</h2>
            <span style={s.panelBadge}>{selectedStudent.name || "Select a student"}</span>
          </div>

          {selectedStudent.studentId ? (
            <>
              <div style={s.studentDetailHeader}>
                <div>
                  <div style={s.detailName}>{selectedStudent.name}</div>
                  <div style={s.detailMeta}>
                    {selectedStudent.satCode || "SAT code not set"}
                    {selectedStudent.className ? ` • ${selectedStudent.className}` : ""}
                  </div>
                </div>
                <div style={s.detailStat}>
                  <div style={s.detailStatValue}>{selectedStudent.average}</div>
                  <div style={s.detailStatLabel}>Average</div>
                </div>
                <div style={s.detailStat}>
                  <div style={s.detailStatValue}>{selectedStudentPassRate}%</div>
                  <div style={s.detailStatLabel}>Pass Rate</div>
                </div>
              </div>

              <div style={s.resultTableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.results.length ? selectedStudent.results.map((result, idx) => (
                      <tr key={`${result.examId || idx}-${idx}`}>
                        <td>{result.examTitle}</td>
                        <td>{result.subjectName}</td>
                        <td>{result.examType}</td>
                        <td>{result.marksObtained === "AB" ? "Absent" : `${result.marksObtained}/${result.maxMarks}`}</td>
                        <td>
                          <span style={result.status === "Pass" ? s.goodPill : result.status === "Absent" ? s.absentPill : s.failPill}>
                            {result.status}
                          </span>
                        </td>
                        <td>{result.teacherName}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} style={s.emptyCell}>No marks available for this student.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={s.emptyPanel}>Choose a student on the left to see the complete marks record.</div>
          )}
        </section>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", gap: "20px" },
  loading: { padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "1rem" },
  hero: {
    background: "linear-gradient(135deg, rgba(9,79,79,0.95), rgba(14,107,107,0.95))",
    color: "var(--white)",
    borderRadius: "20px",
    padding: "28px 30px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    boxShadow: "var(--shadow-md)"
  },
  eyebrow: { margin: 0, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "0.72rem", color: "var(--gold-pale)" },
  title: { margin: "8px 0 10px", fontFamily: "var(--font-heading)", fontSize: "2rem" },
  sub: { margin: 0, maxWidth: "760px", color: "rgba(255,255,255,0.78)", lineHeight: 1.6 },
  resetBtn: {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "var(--white)",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    whiteSpace: "nowrap"
  },
  filterBar: {
    display: "grid",
    gridTemplateColumns: "220px 220px minmax(0, 1fr)",
    gap: "16px",
    alignItems: "end"
  },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 },
  input: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #dbe4ea",
    background: "var(--white)",
    padding: "0 14px",
    fontSize: "0.92rem",
    color: "var(--navy)"
  },
  searchWrap: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #dbe4ea",
    background: "var(--white)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 14px"
  },
  searchIcon: { color: "var(--text-muted)" },
  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "0.92rem",
    color: "var(--navy)",
    background: "transparent"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px"
  },
  statCard: {
    background: "var(--white)",
    borderRadius: "18px",
    border: "1px solid #e7eef2",
    boxShadow: "var(--shadow-sm)",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  statIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.1rem",
    flexShrink: 0
  },
  statValue: { fontSize: "1.7rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1 },
  statLabel: { fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "4px", fontWeight: 700 },
  panelGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: "16px"
  },
  panel: {
    background: "var(--white)",
    borderRadius: "18px",
    border: "1px solid #e7eef2",
    boxShadow: "var(--shadow-sm)",
    padding: "18px",
    minWidth: 0
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px"
  },
  panelTitle: { margin: 0, fontSize: "1.05rem", color: "var(--navy)", fontFamily: "var(--font-heading)" },
  panelBadge: {
    fontSize: "0.72rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--navy-dark)",
    background: "var(--gold-pale)",
    padding: "7px 10px",
    borderRadius: "999px"
  },
  teacherList: { display: "flex", flexDirection: "column", gap: "12px", maxHeight: "340px", overflow: "auto" },
  teacherRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "14px 16px",
    borderRadius: "14px",
    background: "#f8fbfb",
    border: "1px solid #edf3f5"
  },
  teacherName: { fontWeight: 800, color: "var(--navy)" },
  teacherMeta: { marginTop: "4px", fontSize: "0.82rem", color: "var(--text-muted)" },
  teacherCount: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "var(--navy)",
    color: "var(--white)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    flexShrink: 0
  },
  tableWrap: { overflow: "auto" },
  resultTableWrap: { overflow: "auto", marginTop: "8px" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "680px"
  },
  emptyCell: {
    textAlign: "center",
    padding: "18px",
    color: "var(--text-muted)"
  },
  tableHead: {},
  cellTitle: { fontWeight: 800, color: "var(--navy)" },
  cellSub: { fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "3px" },
  failPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "0.78rem",
    fontWeight: 800
  },
  absentPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#f3f4f6",
    color: "#4b5563",
    fontSize: "0.78rem",
    fontWeight: 800
  },
  goodPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "0.78rem",
    fontWeight: 800
  },
  warnPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "0.78rem",
    fontWeight: 800
  },
  studentList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "420px",
    overflow: "auto"
  },
  studentCard: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e7eef2",
    background: "#f9fbfb",
    borderRadius: "16px",
    padding: "14px 16px",
    cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease"
  },
  studentCardActive: {
    borderColor: "var(--gold)",
    boxShadow: "0 8px 20px rgba(200,150,12,0.12)",
    background: "#fffdf5"
  },
  studentCardTop: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" },
  studentName: { fontSize: "0.98rem", fontWeight: 800, color: "var(--navy)" },
  studentMeta: { marginTop: "4px", fontSize: "0.8rem", color: "var(--text-muted)" },
  studentMetrics: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "12px",
    fontSize: "0.8rem",
    color: "var(--navy-dark)",
    fontWeight: 700
  },
  studentDetailHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 120px 120px",
    gap: "12px",
    alignItems: "stretch",
    padding: "16px",
    background: "#f8fbfb",
    borderRadius: "16px",
    border: "1px solid #edf3f5"
  },
  detailName: { fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)" },
  detailMeta: { marginTop: "6px", color: "var(--text-muted)", fontSize: "0.86rem" },
  detailStat: {
    background: "var(--white)",
    borderRadius: "14px",
    border: "1px solid #e7eef2",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  detailStatValue: { fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)" },
  detailStatLabel: { marginTop: "4px", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 },
  empty: {
    padding: "20px",
    textAlign: "center",
    color: "var(--text-muted)",
    border: "1px dashed #d5dee6",
    borderRadius: "14px",
    background: "#fbfcfd"
  },
  emptyPanel: {
    minHeight: "320px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "var(--text-muted)",
    border: "1px dashed #d5dee6",
    borderRadius: "14px",
    background: "#fbfcfd",
    padding: "24px"
  }
};
