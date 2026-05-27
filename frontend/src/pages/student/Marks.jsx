import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import SectionTitle from "../../components/SectionTitle";
import useActiveAcademicYear from "../../hooks/useActiveAcademicYear";

const formatPercent = value => `${Number(value || 0).toFixed(1)}%`;
const SCHOOL_NAME = "LORETTO CENTRAL SCHOOL";
const SCHOOL_ADDRESS = "Amtady Village, Loretto Post Bantwal 574211";
const SCHOOL_PHONE = "+919480663011";
const SCHOOL_EMAIL = "Lorettocentralschool@gmail.com";
const SOFTWARE_CREDIT = "Software developed by Appvertex";

const cleanFileName = value => String(value || "report-card").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "");

const loadLogo = async () => {
  try {
    const response = await fetch("/logo.png");
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const fitText = (doc, text, maxWidth) => {
  const value = String(text ?? "N/A");
  if (doc.getTextWidth(value) <= maxWidth) return value;
  let output = value;
  while (output.length > 3 && doc.getTextWidth(`${output}...`) > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
};

export default function Marks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { examType } = useParams();
  const [report, setReport] = useState({ subjects: {} });
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { academicYearLabel } = useActiveAcademicYear(user?.academicYear?.year);

  const studentId = user?._id || user?.id;
  const activeType = examType ? decodeURIComponent(examType) : "";

  useEffect(() => {
    const loadReport = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const [marksResult, typesResult] = await Promise.allSettled([
        api.get(`/marks/report-card?studentId=${studentId}`),
        api.get("/exam-types")
      ]);

      if (marksResult.status === "fulfilled") {
        setReport(marksResult.value.data || { subjects: {} });
      } else {
        setReport({ subjects: {} });
        setError(marksResult.reason?.response?.data?.message || "Unable to load marks.");
      }

      if (typesResult.status === "fulfilled") {
        setExamTypes(typesResult.value.data || []);
      } else {
        setExamTypes([]);
      }

      setLoading(false);
    };

    loadReport();
  }, [studentId]);

  const rows = useMemo(() => {
    const subjects = report?.subjects || {};
    return Object.entries(subjects).flatMap(([subjectName, entries]) =>
      entries.map((entry, index) => ({
        id: `${subjectName}-${entry.examTitle}-${index}`,
        subjectName,
        examType: entry.examType || "Exam",
        ...entry
      }))
    );
  }, [report]);

  const typeNames = useMemo(() => {
    return examTypes.map(type => type.name).filter(Boolean);
  }, [examTypes]);

  const rowsByType = useMemo(() => (
    rows.reduce((acc, row) => {
      const type = row.examType || "Exam";
      if (!acc[type]) acc[type] = [];
      acc[type].push(row);
      return acc;
    }, {})
  ), [rows]);

  const isCategoryLaunched = !activeType || typeNames.includes(activeType);
  const activeRows = isCategoryLaunched ? (rowsByType[activeType] || []) : [];

  const summary = useMemo(() => {
    const totalScored = activeRows.reduce((sum, row) => sum + Number(row.marksObtained || 0), 0);
    const totalMax = activeRows.reduce((sum, row) => sum + Number(row.maxMarks || 0), 0);
    const percentage = totalMax > 0 ? (totalScored / totalMax) * 100 : null;

    return {
      totalScored,
      totalMax,
      percentage,
      grade: percentage === null
        ? "N/A"
        : percentage >= 90 ? "A+"
          : percentage >= 75 ? "A"
            : percentage >= 60 ? "B"
              : percentage >= 45 ? "C"
                : "Needs Support"
    };
  }, [activeRows]);

  const classLabel = [user?.class?.name, user?.class?.section].filter(Boolean).join("");

  const handleDownload = async () => {
    if (!activeRows.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const logo = await loadLogo();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;
    const green = "#315a25";
    const red = "#d00000";
    const line = "#777777";
    const text = "#5f6368";
    const black = "#1f2933";

    const cell = (x, y, w, h, value, opts = {}) => {
      doc.setDrawColor(opts.border || line);
      doc.setLineWidth(opts.lineWidth || 0.8);
      if (opts.fill) {
        doc.setFillColor(opts.fill);
        doc.rect(x, y, w, h, "FD");
      } else {
        doc.rect(x, y, w, h);
      }
      doc.setTextColor(opts.color || black);
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(opts.size || 9);
      const safeText = fitText(doc, value, w - 10);
      const textX = opts.align === "center" ? x + w / 2 : x + 5;
      doc.text(safeText, textX, y + h / 2 + (opts.size || 9) / 3, { align: opts.align || "left" });
    };

    doc.setFillColor(red);
    doc.triangle(0, 0, 124, 0, 0, 34, "F");

    doc.setTextColor(green);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(22);
    doc.text("STUDENT REPORT CARD", pageWidth / 2, 72, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(SCHOOL_NAME, margin, 124);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(text);
    doc.text(`Address: ${SCHOOL_ADDRESS}`, margin, 144);
    doc.text(`Phone: ${SCHOOL_PHONE}`, margin, 162);
    doc.text(`Email: ${SCHOOL_EMAIL}`, margin, 180);

    doc.setDrawColor(line);
    doc.rect(pageWidth - margin - 74, 105, 74, 74);
    if (logo) doc.addImage(logo, "PNG", pageWidth - margin - 64, 113, 54, 54);

    const infoY = 210;
    cell(margin, infoY, contentWidth, 30, `Name of the Student: ${user?.name || "N/A"}`, { size: 12, color: text });
    cell(margin, infoY + 30, contentWidth / 4, 34, `Date of Birth: ${user?.dob || "N/A"}`, { size: 9, color: text });
    cell(margin + contentWidth / 4, infoY + 30, contentWidth / 4, 34, `Class: ${classLabel || "N/A"}`, { size: 9, color: text });
    cell(margin + (contentWidth / 4) * 2, infoY + 30, contentWidth / 4, 34, `SATS No.: ${user?.satCode || "N/A"}`, { size: 9, color: text });
    cell(margin + (contentWidth / 4) * 3, infoY + 30, contentWidth / 4, 34, `Academic Year: ${academicYearLabel || "N/A"}`, { size: 9, color: text });

    const sectionY = infoY + 64;
    cell(margin, sectionY, contentWidth, 30, "MARKS OF EACH SUBJECT", {
      size: 13,
      bold: true,
      align: "center",
      color: green,
      border: line
    });

    const tableY = sectionY + 30;
    const headerH = 34;
    const footerSpace = 142;
    const rowH = Math.min(24, Math.max(5.5, (pageHeight - tableY - footerSpace - headerH) / activeRows.length));
    const cols = [
      { label: "SUBJECTS", width: 138, key: "subjectName", align: "left" },
      { label: "EXAM", width: 138, key: "examTitle", align: "left" },
      { label: "MAX", width: 58, key: "maxMarks", align: "center" },
      { label: "MARKS", width: 66, key: "marksObtained", align: "center" },
      { label: "GRADE", width: 55, key: "grade", align: "center" },
      { label: "AVERAGE", width: contentWidth - 455, key: "percentage", align: "center" }
    ];

    let x = margin;
    cols.forEach(col => {
      cell(x, tableY, col.width, headerH, col.label, { fill: green, color: "#ffffff", bold: true, align: col.align, size: 10, border: green });
      x += col.width;
    });

    activeRows.forEach((row, index) => {
      x = margin;
      cols.forEach(col => {
        const rawValue = col.key === "percentage" ? formatPercent(row.percentage) : row[col.key];
        cell(x, tableY + headerH + rowH * index, col.width, rowH, rawValue, {
          size: rowH < 8 ? 4.8 : rowH < 11 ? 6 : rowH < 17 ? 7 : 8.5,
          align: col.align,
          color: text
        });
        x += col.width;
      });
    });

    let y = tableY + headerH + rowH * activeRows.length + 28;
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#111111");
    doc.setFontSize(11);
    doc.text("GRADE SCALE:", margin + 10, y);
    doc.setFont("helvetica", "normal");
    doc.text("A+: 90%-100%    A: 80%-89%    B+: 70%-79%    B: 60%-69%    C: 50%-59%    D: 35%-49%    F: Fail", margin + 94, y);

    y += 24;
    const commentH = Math.max(52, pageHeight - y - 40);
    doc.setDrawColor(line);
    doc.rect(margin + 6, y, contentWidth - 12, commentH);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#111111");
    doc.setFontSize(10);
    doc.text("COMMENTS:", margin + 16, y + 20);

    const sigY = y + commentH - 24;
    doc.text("Class Teacher Sign", margin + 42, sigY);
    doc.text("Principal Sign with Stamp", pageWidth - margin - 160, sigY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(text);
    doc.setFontSize(8);
    doc.text(SOFTWARE_CREDIT, pageWidth / 2, pageHeight - 14, { align: "center" });

    doc.save(`${cleanFileName(activeType)}-${cleanFileName(user?.name)}-marks-card.pdf`);
  };

  const openMarksCard = (type) => {
    navigate(`/student/marks/${encodeURIComponent(type)}`);
  };

  const goBackToCategories = () => {
    navigate("/student/marks");
  };

  if (loading) return <div style={s.loading}>Loading report card...</div>;

  return (
    <div style={s.page} className="student-marks-page">
      <SectionTitle title="Marks & Reports" subtitle="Review marks entered by your teachers." />

      <div style={s.categoryShell} className="student-category-shell">
        <div style={s.categoryHeader}>
          <div>
            <h2 style={s.categoryTitle}>Exam Categories</h2>
            <p style={s.categorySub}>Select an exam type to open its marks card.</p>
          </div>
          <span style={s.categoryCount}>{typeNames.length} categories</span>
        </div>
        <div style={s.categoryGrid}>
          {typeNames.length ? typeNames.map(type => {
            const count = rowsByType[type]?.length || 0;
            return (
              <button
                key={type}
                type="button"
                style={{...s.categoryCard, ...(activeType === type ? s.categoryCardActive : {})}}
                onClick={() => openMarksCard(type)}
              >
                <span style={s.categoryIcon}><i className="fa-solid fa-file-lines"></i></span>
                <span style={s.categoryName}>{type}</span>
                <small style={s.categoryMeta}>{count ? `${count} mark entries` : "Marks card"}</small>
              </button>
            );
          }) : (
            <div style={s.emptyMini}>No exam categories have been created yet.</div>
          )}
        </div>
      </div>

      {activeType && (
        <div style={s.printActions} className="student-print-actions">
          <button style={s.backBtn} onClick={goBackToCategories}>
            <i className="fa-solid fa-arrow-left"></i> Categories
          </button>
          <button style={s.printBtn} onClick={handleDownload} disabled={!activeRows.length}>
            <i className="fa-solid fa-download"></i> Download {activeType} Card
          </button>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}

      {!activeType ? (
        <div style={s.promptCard}>
          <i className="fa-solid fa-arrow-up" style={s.promptIcon}></i>
          <div style={s.promptTitle}>Choose an exam category</div>
          <div style={s.promptText}>Your marks card will open here after you select a category.</div>
        </div>
      ) : !isCategoryLaunched ? (
        <div style={s.promptCard}>
          <i className="fa-solid fa-lock" style={s.promptIcon}></i>
          <div style={s.promptTitle}>Marks card not launched</div>
          <div style={s.promptText}>This exam category is not available to students yet.</div>
        </div>
      ) : (
      <div style={s.reportCard} className="print-area student-report-card">
        <div style={s.cornerMark}></div>
        <div style={s.rcHeader} className="student-report-header">
          <div>
            <h1 style={s.rcSchoolName}>STUDENT REPORT CARD</h1>
          </div>
          <img src="/logo.png" alt="School Logo" style={s.rcLogo} />
        </div>

        <div style={s.rcTitleArea}>
          <div>
            <h2 style={s.rcTitle}>LORETTO CENTRAL SCHOOL</h2>
            <p style={s.rcTerm}>Address: {SCHOOL_ADDRESS}</p>
            <p style={s.rcTerm}>Phone: {SCHOOL_PHONE}</p>
            <p style={s.rcTerm}>Email: {SCHOOL_EMAIL}</p>
          </div>
          <div style={s.examPill}>{activeType ? activeType : "Marks Card"}</div>
        </div>

        <div style={s.infoGrid} className="student-report-info-grid">
          <div style={{...s.infoItem, gridColumn: "1 / -1"}}><span style={s.infoLabel}>Name of the Student:</span> <span style={s.infoValue}>{user?.name || "N/A"}</span></div>
          <div style={s.infoItem}><span style={s.infoLabel}>Date of Birth:</span> <span style={s.infoValue}>{user?.dob || "N/A"}</span></div>
          <div style={s.infoItem}><span style={s.infoLabel}>Class:</span> <span style={s.infoValue}>{classLabel || "N/A"}</span></div>
          <div style={s.infoItem}><span style={s.infoLabel}>SATS No.:</span> <span style={s.infoValue}>{user?.satCode || "N/A"}</span></div>
          <div style={s.infoItem}><span style={s.infoLabel}>Academic Year:</span> <span style={s.infoValue}>{academicYearLabel || "N/A"}</span></div>
        </div>

        {activeRows.length ? (
          <>
            <h3 style={s.subjectTitle}>MARKS OF EACH SUBJECT</h3>
            <div className="student-table-wrap" style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Subject</th>
                    <th style={s.th}>Exam</th>
                    <th style={{...s.th, textAlign: 'center'}}>Max Marks</th>
                    <th style={{...s.th, textAlign: 'center'}}>Marks Scored</th>
                    <th style={{...s.th, textAlign: 'center'}}>Grade</th>
                    <th style={{...s.th, textAlign: 'center'}}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map(row => (
                    <tr key={row.id} style={s.tr}>
                      <td style={s.td}><strong>{row.subjectName}</strong></td>
                      <td style={s.td}>{row.examTitle}</td>
                      <td style={{...s.td, textAlign: 'center'}}>{row.maxMarks}</td>
                      <td style={{...s.td, textAlign: 'center', fontWeight: '800'}}>{row.marksObtained}</td>
                      <td style={{...s.td, textAlign: 'center'}}>
                        <span style={s.gradeBadge}>{row.grade || "N/A"}</span>
                      </td>
                      <td style={{...s.td, textAlign: 'center'}}>{formatPercent(row.percentage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={s.summaryBar} className="student-report-summary">
              <div style={s.summaryItem}>
                <div style={s.summaryVal}>{summary.totalScored} <span style={{fontSize:'1rem', color:'#65706a'}}>/{summary.totalMax}</span></div>
                <div style={s.summaryLabel}>Total Marks</div>
              </div>
              <div style={s.summaryItem}>
                <div style={s.summaryVal}>{summary.percentage === null ? "N/A" : formatPercent(summary.percentage)}</div>
                <div style={s.summaryLabel}>Percentage</div>
              </div>
              <div style={s.summaryItem}>
                <div style={s.summaryVal}>{summary.grade}</div>
                <div style={s.summaryLabel}>Overall Grade</div>
              </div>
            </div>
            <div style={s.gradeScale}>
              <strong>GRADE SCALE:</strong> A+: 90%-100% &nbsp; A: 80%-89% &nbsp; B+: 70%-79% &nbsp; B: 60%-69% &nbsp; C: 50%-59% &nbsp; D: 35%-49% &nbsp; F: Fail
            </div>
          </>
        ) : (
          <div style={s.empty}>
            {activeType ? `No marks have been published under ${activeType} yet.` : "No marks have been published for this student yet."}
          </div>
        )}

        <div style={s.signatures} className="student-report-signatures">
          <div style={s.sigBox}><div style={s.sigLine}></div><p>Class Teacher Sign</p></div>
          <div style={s.sigBox}><div style={s.sigLine}></div><p>Principal Sign with Stamp</p></div>
        </div>
        <div style={s.softwareCredit}>{SOFTWARE_CREDIT}</div>
      </div>
      )}

      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
            ::-webkit-scrollbar { display: none; }
          }
        `}
      </style>
    </div>
  );
}

const s = {
  page: { width: "100%", maxWidth: "980px", margin: "0 auto" },
  loading: { textAlign: "center", padding: "40px", color: "var(--text-muted)" },
  error: { background: "var(--danger-bg)", color: "var(--danger-text)", padding: "14px 18px", borderRadius: "12px", fontWeight: "800", marginBottom: "16px" },
  empty: { padding: "40px", textAlign: "center", color: "var(--text-muted)", background: "var(--light-bg)", borderRadius: "12px", border: "1px dashed var(--border)", marginBottom: "36px" },
  emptyMini: { padding: "14px", color: "var(--text-muted)", fontWeight: "800" },
  categoryShell: { background: "var(--white)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", boxShadow: "var(--shadow-sm)", marginBottom: "18px" },
  categoryHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "14px" },
  categoryTitle: { margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.08rem", fontWeight: "900" },
  categorySub: { margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.86rem", fontWeight: "700" },
  categoryCount: { borderRadius: "999px", background: "var(--gold-pale)", color: "var(--navy-dark)", padding: "6px 10px", fontSize: "0.75rem", fontWeight: "900", whiteSpace: "nowrap" },
  categoryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px" },
  categoryCard: { border: "1px solid var(--border)", background: "var(--light-bg)", color: "var(--text)", borderRadius: "10px", padding: "16px", fontWeight: "900", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "9px", minHeight: "118px", textAlign: "left", transition: "var(--transition)" },
  categoryCardActive: { background: "var(--navy)", color: "var(--white)", borderColor: "var(--navy)", boxShadow: "var(--shadow-sm)" },
  categoryIcon: { width: "34px", height: "34px", borderRadius: "9px", background: "rgba(200,150,12,0.18)", color: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" },
  categoryName: { fontSize: "1rem", lineHeight: 1.2 },
  categoryMeta: { color: "inherit", opacity: 0.72, fontSize: "0.75rem", fontWeight: "800" },
  promptCard: { background: "var(--white)", border: "1px dashed var(--border)", borderRadius: "14px", padding: "38px 22px", textAlign: "center", color: "var(--text-muted)", boxShadow: "var(--shadow-sm)" },
  promptIcon: { width: "42px", height: "42px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--gold-pale)", color: "var(--navy)", marginBottom: "12px" },
  promptTitle: { color: "var(--navy)", fontWeight: "900", fontSize: "1.05rem", marginBottom: "4px" },
  promptText: { fontWeight: "700", fontSize: "0.9rem" },
  printActions: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  backBtn: { background: "var(--white)", color: "var(--navy)", border: "1px solid var(--border)", padding: "10px 16px", borderRadius: "8px", fontWeight: "800", cursor: "pointer", boxShadow: "var(--shadow-sm)" },
  printBtn: { background: "var(--navy)", color: "var(--white)", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", transition: "var(--transition)", boxShadow: "var(--shadow-sm)" },
  reportCard: { background: "var(--white)", borderRadius: "6px", padding: "34px 38px 30px", boxShadow: "var(--shadow-lg)", border: "1px solid #8a8a8a", position: "relative", overflow: "hidden", color: "#555" },
  cornerMark: { position: "absolute", top: 0, left: 0, width: 0, height: 0, borderTop: "34px solid #d00000", borderRight: "150px solid transparent" },
  rcHeader: { display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", marginBottom: "22px", color: "#315a25", minHeight: "78px" },
  rcLogo: { width: "74px", height: "74px", objectFit: "contain", flex: "0 0 auto", border: "1px solid #555", padding: "8px", marginLeft: "auto" },
  rcSchoolName: { fontFamily: "var(--font-heading)", fontSize: "2rem", margin: 0, lineHeight: 1, fontWeight: "500", color: "#315a25", letterSpacing: "0.02em" },
  rcTitleArea: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "18px", marginBottom: "24px" },
  rcTitle: { fontFamily: "var(--font-heading)", color: "#315a25", fontSize: "1.15rem", margin: "0 0 8px", fontWeight: "900" },
  rcTerm: { color: "#777", fontWeight: "600", fontSize: "0.86rem", margin: "3px 0" },
  examPill: { border: "1px solid #315a25", color: "#315a25", padding: "8px 13px", borderRadius: "4px", fontWeight: "900", textTransform: "uppercase", fontSize: "0.78rem", whiteSpace: "nowrap" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0, border: "1px solid #777", marginBottom: "0" },
  infoItem: { fontSize: "0.9rem", padding: "13px 12px", borderRight: "1px solid #777", borderBottom: "1px solid #777", minHeight: "48px" },
  infoLabel: { color: "#6b6b6b", fontWeight: "600", display: "inline-block", marginRight: "6px" },
  infoValue: { color: "var(--navy)", fontWeight: "800" },
  subjectTitle: { margin: 0, padding: "13px", textAlign: "center", color: "#315a25", borderLeft: "1px solid #777", borderRight: "1px solid #777", fontSize: "1.05rem", letterSpacing: "0.02em" },
  tableWrap: { overflowX: "auto", marginBottom: "20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#315a25", color: "var(--white)", padding: "12px", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", border: "1px solid #315a25" },
  tr: { borderBottom: "1px solid #777" },
  td: { padding: "11px 12px", fontSize: "0.9rem", border: "1px solid #777", color: "#686868" },
  gradeBadge: { padding: "4px 11px", borderRadius: "3px", fontWeight: "800", color: "#315a25", background: "#eef5e9", border: "1px solid rgba(49,90,37,0.28)" },
  summaryBar: { display: "flex", background: "#f7faf5", borderRadius: "4px", padding: "16px", color: "#315a25", justifyContent: "space-around", marginBottom: "16px", border: "1px solid #9aa294", gap: "16px", flexWrap: "wrap" },
  summaryItem: { textAlign: "center", minWidth: "120px" },
  summaryVal: { fontFamily: "var(--font-stats)", fontSize: "1.6rem", color: "#315a25", lineHeight: 1, marginBottom: "4px" },
  summaryLabel: { fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#65706a", fontWeight: "900" },
  gradeScale: { fontSize: "0.9rem", color: "#111", margin: "18px 0 20px", lineHeight: 1.7 },
  signatures: { display: "flex", justifyContent: "space-between", marginTop: "52px", padding: "0 34px", gap: "18px" },
  sigBox: { textAlign: "center", width: "230px", color: "#111", fontWeight: "700" },
  sigLine: { height: "1px", background: "#111", marginBottom: "8px" },
  softwareCredit: { textAlign: "center", marginTop: "22px", color: "#777", fontSize: "0.76rem", fontWeight: "700" }
};
