const mongoose = require("mongoose");
require("../models/Student");
require("../models/PushSubscription");

mongoose.set("strictQuery", true);

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

const ensurePushSubscriptionIndexes = async () => {
  const collection = mongoose.connection.db.collection("pushsubscriptions");
  const indexes = await collection.indexes();
  const mobileIndex = indexes.find(index => index.name === "mobile_1");
  const endpointIndex = indexes.find(index => index.name === "endpoint_1");
  const missingEndpointDocs = await collection
    .find({
      $or: [
        { endpoint: { $exists: false } },
        { endpoint: "" }
      ]
    })
    .toArray();

  for (const doc of missingEndpointDocs) {
    const endpoint = doc?.subscription?.endpoint;
    if (!endpoint) continue;
    await collection.updateOne(
      { _id: doc._id },
      { $set: { endpoint: String(endpoint).trim() } }
    );
  }

  if (mobileIndex?.unique) {
    await collection.dropIndex("mobile_1");
  }

  if (!endpointIndex || endpointIndex.unique !== true) {
    if (endpointIndex) {
      await collection.dropIndex("endpoint_1");
    }

    await collection.createIndex(
      { endpoint: 1 },
      {
        name: "endpoint_1",
        unique: true
      }
    );
  }

  if (!indexes.find(index => index.name === "mobile_1" && !index.unique)) {
    await collection.createIndex(
      { mobile: 1 },
      {
        name: "mobile_1"
      }
    );
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      compressors: ['zlib'],
    });
    await ensureStudentIndexes();
    await ensurePushSubscriptionIndexes();
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    return false;
  }
};

module.exports = connectDB;
