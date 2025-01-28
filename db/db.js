const { MongoClient } = require("mongodb");
require("dotenv").config();

const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI);

let database;

const connectDB = async () => {
  try {
    if (!database) {
      await client.connect();
      database = client.db("customerSupport");
      console.log("Connected to MongoDB");
    }
    return database;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

const saveSession = async (sessionData) => {
  try {
    const db = await connectDB();
    const collection = db.collection("userSessions");
    await collection.insertOne(sessionData);
    console.log("User session saved to database:", sessionData);
  } catch (error) {
    console.error("Failed to save session to database:", error);
  }
};

module.exports = {
  connectDB,
  saveSession,
};
