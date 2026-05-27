const SchoolSetting = require("../models/SchoolSetting");

const TEACHER_STUDENT_CREATE_KEY = "allowTeacherStudentCreation";

const getSettingValue = async (key, defaultValue) => {
  const setting = await SchoolSetting.findOne({ key });
  return setting ? setting.value : defaultValue;
};

exports.canTeachersCreateStudents = async () => {
  return Boolean(await getSettingValue(TEACHER_STUDENT_CREATE_KEY, true));
};

exports.getStudentRegistrationSettings = async (req, res) => {
  try {
    res.json({
      allowTeacherStudentCreation: await exports.canTeachersCreateStudents()
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStudentRegistrationSettings = async (req, res) => {
  try {
    const allowTeacherStudentCreation = Boolean(req.body.allowTeacherStudentCreation);
    await SchoolSetting.findOneAndUpdate(
      { key: TEACHER_STUDENT_CREATE_KEY },
      { key: TEACHER_STUDENT_CREATE_KEY, value: allowTeacherStudentCreation },
      { upsert: true, new: true }
    );

    res.json({ allowTeacherStudentCreation });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
