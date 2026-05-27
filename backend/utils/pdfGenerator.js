const PDFDocument = require("pdfkit");

exports.generateReportCard = (student, marks, res) => {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=report-${student.satCode}.pdf`);
  
  doc.pipe(res);

  // Header
  doc.fontSize(20).text("LORETTO CBSE SCHOOL", { align: "center" });
  doc.fontSize(14).text("Student Report Card", { align: "center" });
  doc.moveDown();

  // Student Info
  doc.fontSize(10).text(`Name: ${student.name}`);
  doc.text(`SATS No.: ${student.satCode}`);
  doc.text(`Class: ${student.class?.name}${student.class?.section}`);
  doc.moveDown();

  // Table Header
  doc.fontSize(12).text("Subject | Marks | Grade", { underline: true });
  doc.moveDown(0.5);

  // Marks Rows
  Object.keys(marks.subjects).forEach(subName => {
    const results = marks.subjects[subName];
    results.forEach(r => {
      doc.fontSize(10).text(`${subName} | ${r.marksObtained}/${r.maxMarks} | ${r.grade}`);
    });
  });

  doc.end();
};
