const ExcelJS = require("exceljs");
const Student = require("../models/Student");
const router = require("express").Router();
const auth = require("../middleware/auth");

router.get("/students", auth, async (req, res) => {
  const students = await Student.find().populate("class");
  
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");

  sheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "SATS No.", key: "satCode", width: 15 },
    { header: "Class", key: "class", width: 10 },
    { header: "Mobile No.", key: "mobile", width: 15 },
    { header: "Mobile No. 2", key: "alternateMobile", width: 15 },
    { header: "Father Name", key: "fatherName", width: 25 }
  ];

  students.forEach(s => {
    sheet.addRow({
      name: s.name,
      satCode: s.satCode,
      class: `${s.class?.name || ""}${s.class?.section || ""}`,
      mobile: s.mobile,
      alternateMobile: s.alternateMobile,
      fatherName: s.fatherName
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
