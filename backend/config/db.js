const mongoose = require("mongoose");
require("../models/Student");

const ensureStudentIndexes = async () => {
  const collection = mongoose.connection.db.collection("students");
  const indexes = await collection.indexes();
  const penCodeIndex = indexes.find(index => index.name === "penCode_1");
  const hasDesiredPenCodeIndex =
    penCodeIndex?.unique === true &&
    penCodeIndex?.partialFilterExpression?.penCode?.$type === "string" &&
    penCodeIndex?.partialFilterExpression?.penCode?.$gt === "";

  if (!hasDesiredPenCodeIndex && penCodeIndex) {
    await collection.dropIndex("penCode_1");
  }

  if (!hasDesiredPenCodeIndex) {
    await collection.createIndex(
      { penCode: 1 },
      {
        name: "penCode_1",
        unique: true,
        partialFilterExpression: {
          penCode: { $type: "string", $gt: "" }
        }
      }
    );
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await ensureStudentIndexes();
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    return false;
  }
};

module.exports = connectDB;
