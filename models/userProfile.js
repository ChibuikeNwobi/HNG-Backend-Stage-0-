const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    gender_probability: { type: Number, required: true },
    sample_size: { type: Number, required: true },
    age: { type: Number, required: true },
    age_group: { type: String, required: true },
    country_id: { type: String, required: true },
    country_probability: { type: Number, required: true },
  },
  { timestamps: true },
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

module.exports = UserProfile;
