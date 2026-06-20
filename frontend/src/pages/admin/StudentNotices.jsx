import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function StudentNotices() {
  const [mode, setMode] = useState("students"); // "students" or "class"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Search students when query changes (debounced)
  useEffect(() => {
    if (mode === "students" && searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        searchStudents(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, mode]);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get("/student-notices/classes");
      setClasses(data);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setFeedback({ type: "error", message: "Failed to load classes. Please refresh the page." });
    }
  };

  const searchStudents = async (query) => {
    setSearching(true);
    try {
      const { data } = await api.get("/student-notices/search", {
        params: { query }
      });
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
      setFeedback({ type: "error", message: "Search failed. Please try again." });
    } finally {
      setSearching(false);
    }
  };

  const addStudent = (student) => {
    if (!selectedStudents.find(s => s._id === student._id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeStudent = (studentId) => {
    setSelectedStudents(selectedStudents.filter(s => s._id !== studentId));
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: "error", message: "Title and message are required" });
      return;
    }

    if (mode === "students" && selectedStudents.length === 0) {
      setFeedback({ type: "error", message: "Please select at least one student" });
      return;
    }

    if (mode === "class" && !selectedClass) {
      setFeedback({ type: "error", message: "Please select a class" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      let response;
      if (mode === "students") {
        const studentIds = selectedStudents.map(s => s._id);
        response = await api.post("/student-notices/send-to-students", {
          studentIds,
          title: title.trim(),
          message: message.trim()
        });
      } else {
        response = await api.post("/student-notices/send-to-class", {
          classId: selectedClass,
          title: title.trim(),
          message: message.trim()
        });
      }

      setFeedback({ type: "success", message: response.data.message });
      
      // Reset form
      setTitle("");
      setMessage("");
      setSelectedStudents([]);
      setSelectedClass("");
      setSearchQuery("");
    } catch (err) {
      setFeedback({ 
        type: "error", 
        message: err.response?.data?.message || "Failed to send notice" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h2 style={s.title}>
          <i className="fa-solid fa-paper-plane" style={{ marginRight: "12px", color: "var(--gold)" }}></i>
          Send Student Notice
        </h2>

        {/* Mode Selection */}
        <div style={s.modeSelector}>
          <button
            onClick={() => setMode("students")}
            style={{
              ...s.modeBtn,
              ...(mode === "students" ? s.modeBtnActive : {})
            }}
          >
            <i className="fa-solid fa-user-graduate" style={{ marginRight: "8px" }}></i>
            Individual Students
          </button>
          <button
            onClick={() => setMode("class")}
            style={{
              ...s.modeBtn,
              ...(mode === "class" ? s.modeBtnActive : {})
            }}
          >
            <i className="fa-solid fa-chalkboard" style={{ marginRight: "8px" }}></i>
            Entire Class
          </button>
        </div>

        {/* Student Selection Mode */}
        {mode === "students" && (
          <div style={s.section}>
            <label style={s.label}>Search & Select Students</label>
            <div style={s.searchBox}>
              <i className="fa-solid fa-search" style={s.searchIcon}></i>
              <input
                type="text"
                placeholder="Search by name, SAT code, or mobile number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={s.searchInput}
              />
              {searching && <i className="fa-solid fa-circle-notch fa-spin" style={s.searchSpinner}></i>}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={s.searchResults}>
                {searchResults.map(student => (
                  <div
                    key={student._id}
                    onClick={() => addStudent(student)}
                    style={s.searchResultItem}
                  >
                    <div>
                      <div style={s.studentName}>{student.name}</div>
                      <div style={s.studentMeta}>
                        {student.satCode} • {student.mobile} • {student.className}
                      </div>
                    </div>
                    <i className="fa-solid fa-plus" style={s.addIcon}></i>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Students */}
            {selectedStudents.length > 0 && (
              <div style={s.selectedSection}>
                <div style={s.selectedHeader}>
                  Selected Students ({selectedStudents.length})
                </div>
                <div style={s.selectedList}>
                  {selectedStudents.map(student => (
                    <div key={student._id} style={s.chip}>
                      <span style={s.chipText}>
                        {student.name} ({student.satCode})
                      </span>
                      <button
                        onClick={() => removeStudent(student._id)}
                        style={s.chipRemove}
                      >
                        <i className="fa-solid fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Class Selection Mode */}
        {mode === "class" && (
          <div style={s.section}>
            <label style={s.label}>Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={s.select}
            >
              <option value="">-- Choose a class --</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notice Title */}
        <div style={s.section}>
          <label style={s.label}>Notice Title</label>
          <input
            type="text"
            placeholder="Enter notice title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={s.input}
            maxLength={100}
          />
        </div>

        {/* Notice Message */}
        <div style={s.section}>
          <label style={s.label}>Notice Message</label>
          <textarea
            placeholder="Enter notice message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={s.textarea}
            rows={6}
            maxLength={500}
          />
          <div style={s.charCount}>{message.length}/500</div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            ...s.feedback,
            ...(feedback.type === "success" ? s.feedbackSuccess : s.feedbackError)
          }}>
            <i className={`fa-solid fa-${feedback.type === "success" ? "check-circle" : "exclamation-circle"}`} 
               style={{ marginRight: "8px" }}></i>
            {feedback.message}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            ...s.sendBtn,
            ...(loading ? s.sendBtnDisabled : {})
          }}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "8px" }}></i>
              Sending...
            </>
          ) : (
            <>
              <i className="fa-solid fa-paper-plane" style={{ marginRight: "8px" }}></i>
              Send Notice
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const s = {
  container: {
    maxWidth: "900px",
    margin: "0 auto"
  },
  card: {
    background: "var(--white)",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "var(--shadow-md)"
  },
  title: {
    margin: "0 0 24px",
    fontSize: "1.75rem",
    color: "var(--navy)",
    fontFamily: "var(--font-heading)"
  },
  modeSelector: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px"
  },
  modeBtn: {
    flex: 1,
    padding: "14px 20px",
    border: "2px solid var(--border)",
    borderRadius: "12px",
    background: "var(--white)",
    color: "var(--text)",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "var(--transition)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  modeBtnActive: {
    background: "var(--navy)",
    color: "var(--white)",
    borderColor: "var(--navy)"
  },
  section: {
    marginBottom: "24px"
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "var(--navy)",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  searchBox: {
    position: "relative",
    marginBottom: "12px"
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    fontSize: "1rem"
  },
  searchInput: {
    width: "100%",
    padding: "14px 48px 14px 48px",
    border: "2px solid var(--border)",
    borderRadius: "12px",
    fontSize: "1rem",
    outline: "none",
    transition: "var(--transition)"
  },
  searchSpinner: {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--gold)",
    fontSize: "1rem"
  },
  searchResults: {
    maxHeight: "300px",
    overflowY: "auto",
    border: "2px solid var(--border)",
    borderRadius: "12px",
    background: "var(--white)"
  },
  searchResultItem: {
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    borderBottom: "1px solid var(--border)",
    transition: "var(--transition)"
  },
  studentName: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "var(--navy)",
    marginBottom: "4px"
  },
  studentMeta: {
    fontSize: "0.85rem",
    color: "var(--text-muted)"
  },
  addIcon: {
    color: "var(--gold)",
    fontSize: "1.2rem"
  },
  selectedSection: {
    marginTop: "16px"
  },
  selectedHeader: {
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "var(--navy)",
    marginBottom: "12px"
  },
  selectedList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "var(--gold-pale)",
    borderRadius: "20px",
    fontSize: "0.9rem"
  },
  chipText: {
    color: "var(--navy)",
    fontWeight: "600"
  },
  chipRemove: {
    background: "none",
    border: "none",
    color: "var(--navy)",
    cursor: "pointer",
    padding: "0",
    fontSize: "0.9rem",
    opacity: 0.6,
    transition: "var(--transition)"
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    border: "2px solid var(--border)",
    borderRadius: "12px",
    fontSize: "1rem",
    outline: "none",
    background: "var(--white)",
    cursor: "pointer"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "2px solid var(--border)",
    borderRadius: "12px",
    fontSize: "1rem",
    outline: "none",
    transition: "var(--transition)"
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    border: "2px solid var(--border)",
    borderRadius: "12px",
    fontSize: "1rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    transition: "var(--transition)"
  },
  charCount: {
    textAlign: "right",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginTop: "4px"
  },
  feedback: {
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    fontSize: "0.95rem",
    fontWeight: "600"
  },
  feedbackSuccess: {
    background: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb"
  },
  feedbackError: {
    background: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb"
  },
  sendBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
    color: "var(--white)",
    border: "none",
    borderRadius: "12px",
    fontSize: "1.1rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "var(--transition)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  sendBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  }
};
