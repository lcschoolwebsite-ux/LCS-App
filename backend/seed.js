require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const AcademicYear = require("./models/AcademicYear");

const ADMIN_USER = {
  username: "admin",
  password: "Admin@1234",
  role: "admin",
  name: "Administrator"
};

const ACTIVE_YEAR = {
  year: "2025-2026",
  startDate: new Date("2025-06-01"),
  endDate: new Date("2026-03-31"),
  isActive: true
};

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);

  const admin = await User.findOneAndUpdate(
    { username: ADMIN_USER.username },
    {
      $set: {
        username: ADMIN_USER.username,
        password: passwordHash,
        role: ADMIN_USER.role,
        name: ADMIN_USER.name,
        isActive: true
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin user ready in users collection: ${admin.username}`);

  const academicYear = await AcademicYear.findOneAndUpdate(
    { year: ACTIVE_YEAR.year },
    {
      $set: {
        year: ACTIVE_YEAR.year,
        startDate: ACTIVE_YEAR.startDate,
        endDate: ACTIVE_YEAR.endDate,
        isActive: true
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Academic year ready in academicyears collection: ${academicYear.year}`);
  console.log("Seed completed successfully");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  });
