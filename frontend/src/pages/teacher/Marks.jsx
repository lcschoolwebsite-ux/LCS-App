import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/useAuth";
import { getTeacherAssignedClasses } from "../../utils/teacherClasses";

export default function Marks() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(searchParams.get("examId") || "");
  const [classFilter, setClassFilter] = useState(searchParams.get("classId") || "");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  const exam = exams.find(item => item._id === selectedExamId);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const [examRes, classRes] = await Promise.all([
          api.get(`/exams${classFilter ? `?classId=${classFilter}` : ""}`),
          api.get("/classes")
        ]);
        const myClasses = getTeacherAssignedClasses(user, classRes.data || []);
        setClasses(myClasses);
        const data = examRes.data || [];
        setExams(data);
        const requestedExam = searchParams.get("examId");
        const nextExamId = data.some(exam => exam._id === requestedExam) ? requestedExam : data[0]?._id;
        if (nextExamId) setSelectedExamId(nextExamId);
      } catch (e) {
        alert(e.response?.data?.message || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [classFilter, searchParams, user]);

  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    const next = new URLSearchParams(searchParams);
    if (examId) next.set("examId", examId);
    else next.delete("examId");
    setSearchParams(next, { replace: true });
  };

  const handleClassChange = (classId) => {
    setClassFilter(classId);
    const next = new URLSearchParams(searchParams);
    if (classId) next.set("classId", classId);
    else next.delete("classId");
    next.delete("examId");
    setSearchParams(next, { replace: true });
    setSelectedExamId("");
  };

  useEffect(() => {
    const fetchMarks = async () => {
      if (!selectedExamId) {
        setStudents([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.get(`/marks/exam/${selectedExamId}`);
        const studentList = Array.isArray(data) ? data : (data.students || []);
        setCanEdit(Array.isArray(data) ? true : data.canEdit !== false);
        setStudents(studentList.map(student => ({
          _id: student.studentId,
          name: student.name,
          satCode: student.satCode,
          marks: student.marksObtained,
          absent: student.isAbsent,
          remarks: ""
        })));
      } catch (e) {
        alert(e.response?.data?.message || "Failed to load marks");
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [selectedExamId]);

  const handleMarkChange = (id, value) => {
    setStudents(prev => prev.map(s => s._id === id ? { ...s, marks: value } : s));
  };

  const handleAbsentToggle = (id) => {
    setStudents(prev => prev.map(s => s._id === id ? { ...s, absent: !s.absent, marks: s.absent ? s.marks : "" } : s));
  };

  const handleRemarkChange = (id, value) => {
    setStudents(prev => prev.map(s => s._id === id ? { ...s, remarks: value } : s));
  };

  const getGrade = (marks, maxMarks) => {
    if (marks === "" || marks === null) return "-";
    const percent = (marks / maxMarks) * 100;
    if (percent >= 90) return { grade: "A+", bg: "var(--success-bg)", text: "var(--success-text)" };
    if (percent >= 80) return { grade: "A", bg: "var(--success-bg)", text: "var(--success-text)" };
    if (percent >= 70) return { grade: "B+", bg: "rgba(14,107,107,0.1)", text: "var(--navy)" };
    if (percent >= 60) return { grade: "B", bg: "rgba(14,107,107,0.1)", text: "var(--navy)" };
    if (percent >= 50) return { grade: "C", bg: "var(--gold-pale)", text: "var(--gold-light)" };
    if (percent >= 40) return { grade: "D", bg: "var(--warning-bg)", text: "var(--warning-text)" };
    return { grade: "F", bg: "var(--danger-bg)", text: "var(--danger-text)" };
  };

  const marksEnteredCount = students.filter(s => s.marks !== "" || s.absent).length;
  const readOnly = !canEdit;

  const handleSave = async () => {
    if (readOnly) return;
    if (!selectedExamId) return;
    setSaving(true);
    try {
      await api.post("/marks/save", {
        examId: selectedExamId,
        records: students.map(student => ({
          studentId: student._id,
          marksObtained: student.absent ? 0 : Number(student.marks || 0),
          isAbsent: student.absent
        }))
      });
      alert("Marks saved successfully!");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !exam) return <div>Loading marks...</div>;

  return (
    <div>
      <SectionTitle title="Enter Marks" subtitle="Update academic scores for your students." />
      {readOnly && (
        <div style={s.readOnlyBanner}>
          You can view this exam, but editing is restricted to the assigned subject teacher or class teacher.
        </div>
      )}

      {classes.length > 0 && (
        <div style={s.selectorRow}>
          <label style={s.selectorLabel}>Select Class</label>
          <select style={s.examSelect} value={classFilter} onChange={e => handleClassChange(e.target.value)}>
            <option value="">All My Classes</option>
            {classes.map(item => (
              <option key={item._id} value={item._id}>{item.name}{item.section}</option>
            ))}
          </select>
        </div>
      )}

      <div style={s.selectorRow}>
        <label style={s.selectorLabel}>Select Exam</label>
        <select style={s.examSelect} value={selectedExamId} onChange={e => handleExamChange(e.target.value)}>
          <option value="">Choose an exam</option>
          {exams.map(item => (
            <option key={item._id} value={item._id}>
              {item.title} - {item.subject?.name || "Subject"} - {item.class?.name || ""}{item.class?.section || ""}
            </option>
          ))}
        </select>
      </div>

      {!exam ? (
        <div style={s.empty}>No exams available for marks entry.</div>
      ) : (
        <>

      <div style={s.examInfoCard}>
        <h3 style={s.examTitle}>{exam.title}</h3>
        <div style={s.examDetails}>
          <span style={s.goldPill}>{exam.subject?.name || "Subject"}</span>
          <span style={s.goldPill}>Class {exam.class?.name || ""}{exam.class?.section || ""}</span>
          <span style={s.goldPill}>{exam.date}</span>
          <span style={s.goldPill}>Max Marks: {exam.maxMarks}</span>
        </div>
        <div style={s.progressRow}>
          <span>Progress</span>
          <span style={{color: 'var(--gold)'}}><strong>{marksEnteredCount} / {students.length}</strong> Marks Entered</span>
        </div>
      </div>

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead>
            <tr style={s.headerRow}>
              <th style={s.th}>Student</th>
              <th style={{...s.th, width: '120px', textAlign: 'center'}}>Marks</th>
              <th style={{...s.th, width: '80px', textAlign: 'center'}}>Grade</th>
              <th style={{...s.th, width: '100px', textAlign: 'center'}}>Absent</th>
              <th style={s.th}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const gradeInfo = student.absent ? { grade: "AB", bg: "var(--light-bg)", text: "var(--text-muted)" } : getGrade(student.marks, exam.maxMarks);
              const isPassing = student.marks !== "" && (student.marks / exam.maxMarks) >= 0.4;
              const isFailing = student.marks !== "" && (student.marks / exam.maxMarks) < 0.4;

              return (
                <tr key={student._id} style={s.row}>
                  <td style={s.td}>
                    <div style={s.studentName}>{student.name}</div>
                    <div style={s.studentCode}>{student.satCode}</div>
                  </td>
                  <td style={{...s.td, textAlign: 'center'}}>
                    <input 
                      type="number" 
                      style={{
                        ...s.markInput, 
                        borderColor: isPassing ? "var(--success-text)" : isFailing ? "var(--danger-text)" : "var(--border)",
                        background: student.absent ? "var(--light-bg)" : "var(--white)"
                      }}
                      value={student.marks}
                      onChange={e => handleMarkChange(student._id, e.target.value)}
                      disabled={student.absent || readOnly}
                      min="0" max={exam.maxMarks}
                    />
                  </td>
                  <td style={{...s.td, textAlign: 'center'}}>
                    <span style={{...s.gradeBadge, background: gradeInfo.bg, color: gradeInfo.text}}>
                      {gradeInfo.grade}
                    </span>
                  </td>
                  <td style={{...s.td, textAlign: 'center'}}>
                    <label style={s.checkboxContainer}>
                      <input 
                        type="checkbox" 
                        checked={student.absent} 
                        onChange={() => !readOnly && handleAbsentToggle(student._id)} 
                        disabled={readOnly}
                        style={s.checkbox}
                      />
                      <span style={s.checkmark}></span>
                    </label>
                  </td>
                  <td style={s.td}>
                    <input 
                      type="text" 
                      style={s.remarkInput}
                      value={student.remarks}
                      onChange={e => !readOnly && handleRemarkChange(student._id, e.target.value)}
                      disabled={readOnly}
                      placeholder="Optional"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button style={s.saveBtn} onClick={handleSave} disabled={saving || readOnly}>
        {readOnly ? "Read Only" : saving ? "Saving..." : "Save Marks"}
      </button>
        </>
      )}

    </div>
  );
}

const s = {
  selectorRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px", boxShadow: "var(--shadow-sm)" },
  readOnlyBanner: { marginBottom: "16px", padding: "14px 16px", borderRadius: "12px", background: "var(--gold-pale)", color: "var(--navy-dark)", border: "1px solid rgba(200,150,12,0.25)", fontWeight: "800" },
  selectorLabel: { color: "var(--navy)", fontWeight: "800", fontSize: "0.85rem", textTransform: "uppercase" },
  examSelect: { flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--border)", fontSize: "0.95rem", background: "var(--white)" },
  empty: { padding: "28px", textAlign: "center", background: "var(--white)", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "800" },
  examInfoCard: {
    background: "linear-gradient(135deg, var(--navy-dark), var(--navy))",
    padding: "24px 28px", borderRadius: "16px", color: "var(--white)",
    marginBottom: "24px", boxShadow: "var(--shadow-md)"
  },
  examTitle: { fontFamily: "var(--font-heading)", fontSize: "1.4rem", margin: "0 0 12px 0", color: "var(--white)" },
  examDetails: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" },
  goldPill: { background: "var(--gold)", color: "var(--navy-dark)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" },
  progressRow: { display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" },

  tableWrapper: { background: "var(--white)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)", marginBottom: "24px" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  headerRow: { background: "linear-gradient(135deg, var(--navy-dark), var(--navy))" },
  th: { padding: "14px 20px", color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" },
  row: { borderBottom: "1px solid #f0ebe0", transition: "var(--transition)" },
  td: { padding: "14px 20px", fontSize: "0.9rem", color: "var(--text)", verticalAlign: "middle" },
  
  studentName: { margin: 0, fontWeight: "700", color: "var(--navy)", fontSize: "0.95rem" },
  studentCode: { margin: 0, color: "var(--text-muted)", fontSize: "0.75rem" },
  
  markInput: { width: "80px", textAlign: "center", padding: "10px", borderRadius: "8px", border: "2px solid", fontSize: "1rem", fontWeight: "700", color: "var(--navy)", fontFamily: "var(--font-stats)" },
  remarkInput: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", fontSize: "0.85rem", background: "var(--light-bg)" },
  
  gradeBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "800", display: "inline-block", minWidth: "40px", textAlign: "center" },
  
  checkboxContainer: { display: "inline-block", position: "relative", paddingLeft: "30px", cursor: "pointer", fontSize: "22px", userSelect: "none" },
  checkbox: { position: "absolute", opacity: 0, cursor: "pointer", height: 0, width: 0 },
  checkmark: { position: "absolute", top: "-10px", left: "0", height: "24px", width: "24px", background: "var(--light-bg)", border: "2px solid var(--border)", borderRadius: "6px", transition: "var(--transition)" },

  saveBtn: {
    width: "100%", background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)", padding: "16px", borderRadius: "30px", fontWeight: "700",
    fontSize: "1rem", border: "none", cursor: "pointer", transition: "var(--transition)",
    boxShadow: "var(--shadow-md)",
    position: "relative", overflow: "hidden"
  }
};
