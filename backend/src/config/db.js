import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    console.warn(
      "⚠️ Tip: Make sure your current IP address (or 0.0.0.0/0) is allowed in your MongoDB Atlas Network Access whitelist."
    );
    // Retry connection after 5 seconds instead of terminating the server
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
