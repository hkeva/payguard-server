import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function DatabaseConnect() {
  if (!MONGODB_URI) {
    console.error("MongoDB URI is not defined");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
  }
}

export default DatabaseConnect;
