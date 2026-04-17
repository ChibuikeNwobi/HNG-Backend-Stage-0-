require("dotenv").config();
const mongoose = require('mongoose');
const generateUUID = require("./uuid_generator");

const databaseConnection = async (callback) => {
  try {
    console.log("Connecting to MongoDB...");
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");
    callback();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = databaseConnection;
