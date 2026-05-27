import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import SectionTitle from "../../components/SectionTitle";

export default function AddStudent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "", dob: "", fatherName: "", motherName: "", mobile: "", alternateMobile: "", email: "", address: "",
    satCode: "", penCode: "", class: searchParams.get("classId") || ""
  });
  const [loading, setLoading] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [allowTeacherStudentCreation, setAllowTeacherStudentCreation] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    const classFromUrl = searchParams.get("classId");
    if (classFromUrl) setForm(prev => ({ ...prev, class: classFromUrl }));
  }, [searchParams]);

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const { data } = await api.get("/settings/student-registration");
        setAllowTeacherStudentCreation(Boolean(data.allowTeacherStudentCreation));
      } catch (e) {
        alert(e.response?.data?.message || "Unable to check student registration permission");
      } finally {
        setPermissionLoading(false);
      }
    };

    fetchPermission();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setPhotoError("");

    if (!file) {
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoError("");
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: student } = await api.post("/students", form);

      if (photoFile && student?._id) {
        const photoPayload = new FormData();
        photoPayload.append("photo", photoFile);
        try {
          await api.post(`/students/${student._id}/photo`, photoPayload, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          alert("Student registered successfully with profile photo!");
        } catch (photoErr) {
          alert(photoErr.response?.data?.message || "Student registered, but photo upload failed.");
        }
      } else {
        alert("Student registered successfully!");
      }

      navigate("/teacher/students");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <SectionTitle 
        title="Student Registration" 
        subtitle="Enroll a new student into your assigned classes." 
      />

      {!permissionLoading && !allowTeacherStudentCreation && (
        <div style={s.blockedBox}>
          <i className="fa-solid fa-lock"></i>
          <div>
            <strong>Student registration is disabled.</strong>
            <span>Ask the admin to allow teachers to add students.</span>
          </div>
        </div>
      )}

      {allowTeacherStudentCreation && (
      <form style={s.form} onSubmit={handleSubmit}>
        <div style={s.grid}>
          {/* Section 1: Personal */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <i className="fa-solid fa-user-graduate" style={s.cardIcon}></i>
              <h3 style={s.cardTitle}>Personal Information</h3>
            </div>
            <div style={s.cardBody}>
              <div style={s.photoPanel}>
                <div style={s.photoPreview}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Selected student" style={s.photoImg} />
                  ) : (
                    <div style={s.photoAvatar}>
                      <i className="fa-solid fa-user-graduate"></i>
                    </div>
                  )}
                </div>
                <div style={s.photoMeta}>
                  <label style={s.label}>Profile Photo (Optional)</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={s.fileInput} />
                  <div style={s.photoHint}>JPG, PNG, or WebP up to 2 MB.</div>
                  {photoFile && (
                    <button type="button" style={s.removePhotoBtn} onClick={handleRemovePhoto}>
                      <i className="fa-solid fa-xmark"></i> Remove selected photo
                    </button>
                  )}
                  {photoError && <div style={s.photoError}>{photoError}</div>}
                </div>
              </div>

              <div style={s.inputGroup}>
                <label style={s.label}>Student Name *</label>
                <input style={s.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full legal name" required />
              </div>
              <div style={s.row}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Date of Birth (Optional)</label>
                  <input style={s.input} value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} placeholder="ddmmyyyy" />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Gender</label>
                  <select style={s.input}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Email Address (Optional)</label>
                  <input style={s.input} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="student@email.com" />
                </div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Residential Address (Optional)</label>
                <textarea style={s.textarea} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full residential address..." />
              </div>
            </div>
          </div>

          {/* Section 2: Academic */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <i className="fa-solid fa-school" style={s.cardIcon}></i>
              <h3 style={s.cardTitle}>Academic & Identifiers</h3>
            </div>
            <div style={s.cardBody}>
              <div style={s.inputGroup}>
                <label style={s.label}>Class Assignment</label>
                <select style={s.input} value={form.class} onChange={e => setForm({...form, class: e.target.value})} required>
                  <option value="">Select one of your classes...</option>
                  {user?.assignedClasses?.map(c => <option key={c._id} value={c._id}>{c.name}{c.section}</option>)}
                </select>
              </div>
              <div style={s.row}>
                <div style={s.inputGroup}>
                  <label style={s.label}>SATS No. *</label>
                  <input style={s.input} value={form.satCode} onChange={e => setForm({...form, satCode: e.target.value})} placeholder="Unique SATS no." required />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>PEN Code (Optional)</label>
                  <input style={s.input} value={form.penCode} onChange={e => setForm({...form, penCode: e.target.value})} placeholder="Permanent Education Number" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Parent */}
          <div style={{...s.card, gridColumn: "span 2"}}>
            <div style={s.cardHeader}>
              <i className="fa-solid fa-users-viewfinder" style={s.cardIcon}></i>
              <h3 style={s.cardTitle}>Guardian & Contact Details</h3>
            </div>
            <div style={{...s.cardBody, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'}}>
              <div style={s.inputGroup}>
                <label style={s.label}>Father's Name *</label>
                <input style={s.input} value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} required />
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Mother's Name *</label>
                <input style={s.input} value={form.motherName} onChange={e => setForm({...form, motherName: e.target.value})} required />
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Primary Mobile Number *</label>
                <input style={s.input} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="+91" required />
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Second Mobile Number (Optional)</label>
                <input style={s.input} value={form.alternateMobile} onChange={e => setForm({...form, alternateMobile: e.target.value})} placeholder="+91" />
              </div>
            </div>
          </div>
        </div>

        <div style={s.footer}>
           <button type="button" onClick={() => navigate(-1)} style={s.cancelBtn}>Cancel</button>
           <button type="submit" style={s.submitBtn} disabled={loading}>
             {loading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Saving...</> : <><i className="fa-solid fa-floppy-disk"></i> Save & Register Student</>}
           </button>
        </div>
      </form>
      )}
    </div>
  );
}

const s = {
  page: { width: "100%" },
  form: { marginTop: "24px" },
  blockedBox: { marginTop: "24px", background: "var(--danger-bg)", color: "var(--danger-text)", border: "1px solid var(--danger-text)", borderRadius: "12px", padding: "18px", display: "flex", alignItems: "center", gap: "14px", fontWeight: "700" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  
  card: { background: "var(--white)", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" },
  cardHeader: { background: "var(--light-bg)", padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" },
  cardIcon: { color: "var(--navy)", fontSize: "1.2rem" },
  cardTitle: { margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--navy)", fontFamily: "var(--font-heading)" },
  cardBody: { padding: "24px" },

  photoPanel: { display: "flex", alignItems: "center", gap: "16px", background: "var(--light-bg)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px", marginBottom: "20px" },
  photoPreview: { width: "82px", height: "82px", borderRadius: "50%", border: "3px solid var(--gold)", background: "var(--white)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoAvatar: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", fontSize: "1.6rem" },
  photoMeta: { flex: 1, minWidth: 0 },
  fileInput: { width: "100%", color: "var(--text-muted)", fontSize: "0.84rem", fontWeight: "700" },
  photoHint: { marginTop: "6px", color: "var(--text-muted)", fontSize: "0.76rem", fontWeight: "700" },
  removePhotoBtn: { marginTop: "10px", padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--danger-text)", background: "var(--danger-bg)", color: "var(--danger-text)", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px" },
  photoError: { marginTop: "10px", background: "var(--danger-bg)", color: "var(--danger-text)", padding: "6px 10px", borderRadius: "8px", fontSize: "0.76rem", fontWeight: "800" },
  inputGroup: { marginBottom: "20px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  label: { display: "block", fontSize: "0.7rem", fontWeight: "800", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", boxSizing: "border-box", background: 'var(--white)', fontFamily: 'var(--font-body)', transition: 'var(--transition)' },
  textarea: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", boxSizing: "border-box", background: 'var(--white)', fontFamily: 'var(--font-body)', minHeight: "100px", resize: "none" },

  footer: { marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "16px", background: "var(--white)", padding: "20px", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" },
  cancelBtn: { padding: "12px 24px", background: "var(--light-bg)", border: "none", color: "var(--text-muted)", fontWeight: "700", cursor: "pointer", borderRadius: "10px" },
  submitBtn: { padding: "12px 32px", background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "var(--white)", borderRadius: "10px", border: "none", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(14,107,107,0.2)", display: 'flex', alignItems: 'center', gap: '8px' }
};
