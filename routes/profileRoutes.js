const express = require("express");
const router = express.Router();
const axios = require("axios");
const UserProfile = require("../models/userProfile");
const {
  Genderize_URL,
  Agify_URL,
  Nationalize_URL,
} = require("../constants/urls");
const ageClassifier = require("../utility/age_classifier");
const generateUUID_v7 = require("../utility/uuid_generator");
const AppError = require("../utility/appError");

const axiosWithRetry = async (url, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      return response;
    } catch (error) {
      lastError = error;

      // If 429 (Too Many Requests), wait before retrying
      if (error.response?.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error; // Don't retry other errors
      }
    }
  }

  throw lastError;
};

// Then replace axios.get calls:
// const genderResponse = await axiosWithRetry(
//   `${Genderize_URL}?name=${encodeURIComponent(name)}`
// );

router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message:
          "Bad Request: name query parameter is required and cannot be empty",
      });
    }

    if (typeof name !== "string") {
      return res.status(422).json({
        status: "error",
        message: "Unprocessable entity: name must be a string",
      });
    }

    /**
     * ---------------------- Fetch data from the three external APIs -----------------------
     */

    const genderResponse = await axiosWithRetry(
      `${Genderize_URL}?name=${encodeURIComponent(name)}`,
    );
    const {
      gender,
      probability: gender_probability,
      count: sample_size,
    } = genderResponse.data;

    if (sample_size === 0 || !gender) {
      throw new AppError("Genderize returned an invalid response", 502);
    }

    const ageResponse = await axiosWithRetry(
      `${Agify_URL}?name=${encodeURIComponent(name)}`,
    );
    const { age } = ageResponse.data;
    const age_group = ageClassifier(age);

    if (!age) {
      throw new AppError("Agify returned an invalid response", 502);
    }

    const nationalityResponse = await axiosWithRetry(
      `${Nationalize_URL}?name=${encodeURIComponent(name)}`,
    );
    const { country } = nationalityResponse.data;
    const { country_id, probability: country_probability } = country[0];

    if (!country || country.length === 0) {
      throw new AppError("Nationalize returned an invalid response", 502);
    }

    // Check if a profile with the same name already exists

    const existingProfile = await UserProfile.findOne({ name: name });

    if (!existingProfile) {
      const newProfile = await UserProfile.create({
        _id: generateUUID_v7(),
        gender: gender.toLowerCase(),
        gender_probability,
        sample_size,
        age,
        age_group: age_group.toLowerCase(),
        country_id: country_id.toLowerCase(),
        name: name.toLowerCase(),
        country_probability,
      });

      return res.status(201).json({
        status: "success",
        message: "Profile Created Successfully",
        data: {
          id: newProfile._id,
          name: newProfile.name,
          gender: newProfile.gender,
          gender_probability: newProfile.gender_probability,
          sample_size: newProfile.sample_size,
          age: newProfile.age,
          age_group: newProfile.age_group,
          country_id: newProfile.country_id,
          country_probability: newProfile.country_probability,
          created_at: newProfile.created_at,
        },
      });
    } else {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existingProfile,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await UserProfile.findById(id);

    if (profiles.length === 0) {
      return res.status(200).json({
        status: "success",
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { gender, country_id, age_group } = req.query;

    const filter = {};
    if (gender) {
      filter.gender = gender.toLowerCase();
    }
    if (country_id) {
      filter.country_id = country_id.toLowerCase();
    }
    if (age_group) {
      filter.age_group = age_group.toLowerCase();
    }

    const profiles = await UserProfile.find(filter);

    return res.status(200).json({
      status: "success",
      count: profiles.length,
      data: profiles.map((p) => ({
        id: p._id,
        name: p.name,
        gender: p.gender,
        age: p.age,
        age_group: p.age_group,
        country_id: p.country_id,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedProfile = await UserProfile.findByIdAndDelete(id);

    if (!deletedProfile) {
      throw new AppError("User profile not found", 404);
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
