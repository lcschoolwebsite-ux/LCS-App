import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import SectionTitle from "../../components/SectionTitle";
import useActiveAcademicYear from "../../hooks/useActiveAcademicYear";
import { jsPDF } from "jspdf";

const formatReceiptDate = (date) => {
  if (!date) return new Date().toLocaleDateString("en-IN");
  return new Date(date).toLocaleDateString("en-IN");
};

const formatReceiptAmount = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;

const loadReceiptLogo = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `${window.location.origin}/logo.png`;
  });
};

const numberToIndianWords = (amount) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const underHundred = (n) => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
  };

  const underThousand = (n) => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return `${hundred ? `${ones[hundred]} Hundred` : ""}${hundred && rest ? " " : ""}${rest ? underHundred(rest) : ""}`;
  };

  const rupees = Math.round(Number(amount || 0));
  if (rupees === 0) return "Zero Rupees Only";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  const parts = [];
  if (crore) parts.push(`${underThousand(crore)} Crore`);
  if (lakh) parts.push(`${underThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${underThousand(thousand)} Thousand`);
  if (rest) parts.push(underThousand(rest));

  return `${parts.join(" ")} Rupees Only`;
};

export default function StudentFees() {
  const { user } = useAuth();
  const { academicYearLabel } = useActiveAcademicYear(user?.academicYear?.year);
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFeeData = async () => {
    const studentId = user?.id || user?._id;
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/student-fees/student/${studentId}`);
      setFee(data);
    } catch (e) {
      console.error(e);
      setFee(null);
      setError(e.response?.data?.message || "Fee details are not available yet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchFeeData();
  }, [user]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (amount, label) => {
    if (amount > fee.totalDue) {
       amount = fee.totalDue;
    }
    if (amount <= 0) return alert("No balance due!");

    const res = await loadRazorpay();
    if (!res) return alert("Razorpay SDK failed to load");

    try {
      // Create order for specific amount
      const { data: order } = await api.post("/student-fees/create-flexible-order", {
        studentFeeId: fee._id,
        amount: amount
      });

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Loretto Central School",
        description: `Fee Payment - ${label}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post("/student-fees/verify-flexible-payment", {
              studentFeeId: fee._id,
              amount: amount,
              label: label,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert("Payment successful!");
            fetchFeeData();
          } catch (e) { alert("Verification failed"); }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#0e6b6b" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) { alert("Failed to initiate payment"); }
  };

  const generatePDF = async (payment) => {
    const logo = await loadReceiptLogo();
    const student = fee?.student || user || {};
    const receiptClassLabel = [student?.class?.name || user?.class?.name, student?.class?.section || user?.class?.section].filter(Boolean).join("");
    const totalPaid = Number(payment.paidAmount || payment.amount || 0);
    const concession = Math.max(0, Number(payment.amount || 0) - totalPaid);
    const receiptNo = payment.receiptNumber || payment.razorpayPaymentId || payment.razorpayOrderId || `${payment.termName || "PAYMENT"}-${payment.termNumber || "NA"}`;
    const session = academicYearLabel || fee?.academicYear?.year || "Current Session";
    const transactionNo = payment.razorpayPaymentId || payment.razorpayOrderId || receiptNo;

    const doc = new jsPDF();
    const left = 12;
    const top = 10;
    const width = 186;
    const right = left + width;
    const line = (y) => doc.line(left, y, right, y);
    const labelValue = (label, value, x, y) => {
      doc.setFont("times", "bold");
      doc.text(label, x, y);
      doc.setFont("times", "normal");
      doc.text(":", x + 30, y);
      doc.text(String(value || "N/A"), x + 34, y);
    };

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.25);
    doc.rect(left, top, width, 246);

    if (logo) doc.addImage(logo, "PNG", 18, 15, 25, 25);

    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Loretto Central School", 105, 21, { align: "center" });
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Love through service", 105, 30, { align: "center" });
    doc.setFontSize(10);
    doc.text("Official Fee Payment Receipt", 105, 37, { align: "center" });

    doc.setFillColor(218, 218, 218);
    doc.rect(left, 46, width, 8, "F");
    line(46);
    line(54);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("FEE RECEIPT", 105, 51.8, { align: "center" });

    doc.setFontSize(11);
    labelValue("Receipt No", receiptNo, 17, 64);
    labelValue("Adm No", student.satCode || user?.satCode, 17, 72);
    labelValue("Name", student.name || user?.name, 17, 80);
    labelValue("Installment", payment.termName, 17, 88);
    labelValue("Date", formatReceiptDate(payment.paidDate), 132, 64);
    labelValue("Session", session, 132, 72);
    labelValue("Class", receiptClassLabel || "N/A", 132, 80);
    labelValue("CounterNo", "LCS-RECEIPT", 132, 88);

    const tableTop = 94;
    const rowHeight = 9;
    const columns = [left, 30, 132, 154, 176, right];
    doc.setFillColor(218, 218, 218);
    doc.rect(left, tableTop, width, rowHeight, "F");
    doc.setFont("times", "bold");
    doc.text("Sl.No", 17, 100);
    doc.text("Description", 33, 100);
    doc.text("Due", 147, 100, { align: "right" });
    doc.text("Con", 169, 100, { align: "right" });
    doc.text("Paid", 193, 100, { align: "right" });

    const rowY = tableTop + rowHeight;
    doc.setFont("times", "normal");
    doc.text("1", 26, rowY + 6, { align: "right" });
    doc.text(payment.termName || "School Fee Payment", 33, rowY + 6);
    doc.text(String(Number(payment.amount || totalPaid).toLocaleString("en-IN")), 147, rowY + 6, { align: "right" });
    doc.text(String(concession.toLocaleString("en-IN")), 169, rowY + 6, { align: "right" });
    doc.text(String(totalPaid.toLocaleString("en-IN")), 193, rowY + 6, { align: "right" });

    for (const x of columns) doc.line(x, tableTop, x, rowY + rowHeight);
    line(tableTop);
    line(rowY);
    line(rowY + rowHeight);
    doc.line(left, rowY + rowHeight, left, 162);
    doc.line(right, rowY + rowHeight, right, 162);

    doc.setFillColor(218, 218, 218);
    doc.rect(left, 162, width, 8, "F");
    line(162);
    line(170);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("PAY MODE INFORMATION", 105, 167.8, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text("Pay Mode", 14, 181);
    doc.text(payment.method || "Online", 44, 181);
    doc.text("Date", 123, 181);
    doc.text(formatReceiptDate(payment.paidDate), 196, 181, { align: "right" });
    doc.text("Transaction No", 14, 190);
    doc.text(String(transactionNo).slice(0, 32), 44, 190);
    doc.text("Number", 123, 190);
    doc.text(receiptNo, 196, 190, { align: "right" });
    doc.setFillColor(190, 190, 190);
    doc.rect(left, 193, width, 8, "F");
    doc.text("Total", 14, 198.5);
    doc.text(String(totalPaid.toLocaleString("en-IN")), 196, 198.5, { align: "right" });

    line(211);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Total :", 47, 220);
    doc.text(String(totalPaid.toLocaleString("en-IN")), 194, 220, { align: "right" });
    line(224);
    doc.text("Total in Words:", 15, 233);
    doc.setFont("times", "normal");
    doc.text(numberToIndianWords(totalPaid), 50, 233, { maxWidth: 140 });
    line(239);

    doc.setDrawColor(0, 0, 0);
    doc.rect(15, 241, 24, 12);
    doc.setFontSize(8);
    doc.text("Receipt ID", 27, 246, { align: "center" });
    doc.text(receiptNo.slice(-10), 27, 250, { align: "center" });
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.text("This is a computer generated Receipt. Does not require signature.", 105, 251, { align: "center" });
    doc.setFont("times", "bold");
    doc.setTextColor(110, 110, 110);
    doc.text("PARENT COPY", 105, 261, { align: "center" });

    doc.save(`Receipt-${receiptNo}.pdf`);
  };

  if (loading) return <div style={s.loading}>Loading fee data...</div>;
  if (!fee) return <div style={s.empty}>{error || "Fee structure not found. Contact admin."}</div>;

  const percentage = fee.totalAnnualFee > 0 ? Math.min(100, Math.round((fee.totalPaid / fee.totalAnnualFee) * 100)) : 0;
  const classLabel = [user?.class?.name, user?.class?.section].filter(Boolean).join("");

  return (
    <div style={s.container} className="student-fees-page">
      <SectionTitle title="School Fee Portal" subtitle="View your annual balance and pay installments securely." />

      {/* Main Stats Card */}
      <div style={s.mainCard} className="student-fee-main-card">
        <div style={s.cardTop} className="student-fee-card-top">
          <div>
            <h2 style={s.studentName}>{user.name}</h2>
            <p style={s.studentSub}>{user.satCode} • Class {classLabel || "N/A"}</p>
          </div>
          <div style={s.annualBadge}>₹{fee.totalAnnualFee.toLocaleString()} Total Annual Fee</div>
        </div>

        <div style={s.statsGrid} className="student-fee-stats">
          <div style={s.statBox}>
            <label style={s.sLabel}>Total Paid</label>
            <div style={{...s.sValue, color: 'white'}}>₹{fee.totalPaid.toLocaleString()}</div>
          </div>
          <div style={s.statBox}>
            <label style={s.sLabel}>Current Balance Due</label>
            <div style={{...s.sValue, color: 'white'}}>₹{fee.totalDue.toLocaleString()}</div>
          </div>
        </div>

        <div style={s.progressRow} className="student-fee-progress">
          <div style={s.track}><div style={{...s.fill, width: `${percentage}%`}}></div></div>
          <span style={s.pText}>{percentage}% Paid</span>
        </div>
      </div>

      {/* Payment Options */}
      <h3 style={s.sectionTitle}>Select Your Payment Option</h3>
      <div style={s.optionsGrid} className="student-fee-options">
        {/* Full Year */}
        <div style={s.optionCard} className="student-fee-option-card">
          <div style={s.optIcon}><i className="fa-solid fa-crown"></i></div>
          <h4 style={s.optTitle}>Full Year</h4>
          <p style={s.optSub}>Pay the entire remaining balance in one go.</p>
          <div style={s.optAmount}>₹{fee.totalDue.toLocaleString()}</div>
          <button 
            style={s.btnPay} 
            disabled={fee.totalDue <= 0}
            onClick={() => handlePayment(fee.totalDue, "Annual Full Payment")}
          >Pay Full Amount</button>
        </div>

        {/* Half Yearly */}
        <div style={s.optionCard} className="student-fee-option-card">
          <div style={s.optIcon}><i className="fa-solid fa-calendar-days"></i></div>
          <h4 style={s.optTitle}>Half-Yearly</h4>
          <p style={s.optSub}>Pay equivalent to 50% of the annual fee.</p>
          <div style={s.optAmount}>₹{Math.round(fee.totalAnnualFee / 2).toLocaleString()}</div>
          <button 
            style={s.btnPay} 
            disabled={fee.totalDue <= 0}
            onClick={() => handlePayment(fee.totalAnnualFee / 2, "Half-Yearly Installment")}
          >Pay Half-Yearly</button>
        </div>

        {/* Quarterly */}
        <div style={s.optionCard} className="student-fee-option-card">
          <div style={s.optIcon}><i className="fa-solid fa-clock"></i></div>
          <h4 style={s.optTitle}>Quarterly</h4>
          <p style={s.optSub}>Pay equivalent to 25% of the annual fee.</p>
          <div style={s.optAmount}>₹{Math.round(fee.totalAnnualFee / 4).toLocaleString()}</div>
          <button 
            style={s.btnPay} 
            disabled={fee.totalDue <= 0}
            onClick={() => handlePayment(fee.totalAnnualFee / 4, "Quarterly Installment")}
          >Pay Quarterly</button>
        </div>
      </div>

      {/* Payment History */}
      {fee.terms?.filter(t => t.status === "Paid").length > 0 && (
        <div style={s.historySection} className="student-table-card">
          <h3 style={s.sectionTitle}>Payment History & Receipts</h3>
          <table style={s.table} className="student-payment-history-table">
            <thead>
              <tr>
                <th style={s.th}>Description</th>
                <th style={s.th}>Paid Date</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Method</th>
                <th style={s.th}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {fee.terms?.filter(t => t.status === "Paid").reverse().map((pay, idx) => (
                <tr key={idx} className="student-payment-history-row">
                  <td style={s.td} data-label="Description">{pay.termName}</td>
                  <td style={s.td} data-label="Paid Date">{pay.paidDate}</td>
                  <td style={s.td} data-label="Amount">₹{pay.paidAmount.toLocaleString()}</td>
                  <td style={s.td} data-label="Method">{pay.method}</td>
                  <td style={s.td} data-label="Receipt">
                    <button onClick={() => generatePDF(pay)} style={s.btnSmall}>
                      <i className="fa-solid fa-file-pdf"></i> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: '1200px', margin: '0 auto' },
  loading: { padding: '80px', textAlign: 'center', color: 'var(--navy)', fontWeight: '800' },
  empty: { padding: '80px', textAlign: 'center', background: 'white', borderRadius: '20px', color: 'var(--text-muted)' },
  mainCard: { background: 'linear-gradient(135deg, var(--navy), var(--navy-dark))', padding: '40px', borderRadius: '24px', color: 'white', marginBottom: '40px', boxShadow: 'var(--shadow-lg)', borderTop: '4px solid var(--gold)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  studentName: { margin: 0, fontSize: '2.2rem', fontFamily: 'var(--font-heading)', color: 'white' },
  studentSub: { color: 'var(--gold-light)', fontWeight: '600', marginTop: '6px' },
  annualBadge: { background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '30px', fontWeight: '800', color: 'var(--gold-light)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem' },
  statsGrid: { display: 'flex', gap: '50px', marginBottom: '40px' },
  statBox: { flex: 1 },
  sLabel: { fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: '800', marginBottom: '10px', display: 'block' },
  sValue: { fontSize: '2.4rem', fontWeight: '900', fontFamily: 'var(--font-heading)' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '20px' },
  track: { flex: 1, height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' },
  fill: { height: '100%', background: 'var(--gold)', transition: '1s ease-out' },
  pText: { fontWeight: '900', color: 'var(--gold)', fontSize: '1.2rem' },

  sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '24px', borderLeft: '5px solid var(--gold)', paddingLeft: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '50px' },
  optionCard: { background: 'white', padding: '40px 30px', borderRadius: '24px', textAlign: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', transition: '0.3s hover', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  optIcon: { width: '60px', height: '60px', borderRadius: '50%', background: 'var(--gold-pale)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '20px', border: '1px solid var(--gold)' },
  optTitle: { fontSize: '1.4rem', color: 'var(--navy)', fontWeight: '800', marginBottom: '8px' },
  optSub: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4', height: '40px' },
  optAmount: { fontSize: '2rem', fontWeight: '900', color: 'var(--navy)', marginBottom: '30px' },
  btnPay: { width: '100%', padding: '16px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--navy-dark)', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' },

  historySection: { background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid var(--border)', fontWeight: '800' },
  td: { padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--navy)', fontWeight: '600' },
  btnSmall: { padding: '8px 16px', borderRadius: '30px', border: '1.5px solid var(--navy)', background: 'white', color: 'var(--navy)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }
};
