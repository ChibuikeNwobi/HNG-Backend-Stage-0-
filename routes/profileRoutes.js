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

    const genderResponse = await axios.get(
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

    const ageResponse = await axios.get(
      `${Agify_URL}?name=${encodeURIComponent(name)}`,
    );
    const { age } = ageResponse.data;
    const age_group = ageClassifier(age);

    if (!age) {
      throw new AppError("Agify returned an invalid response", 502);
    }

    const nationalityResponse = await axios.get(
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
      await UserProfile.create({
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
    } else {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existingProfile,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User profile created successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await UserProfile.findById(id);

    if (!profile) {
      throw new AppError("User profile not found", 404);
    }

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { gender, country_id, age_group } = req.query;

    const profiles = await UserProfile.find({
      ...(gender && { gender: { $regex: gender, $options: "i" } }),
      ...(country_id && { country_id: { $regex: country_id, $options: "i" } }),
      ...(age_group && { age_group: { $regex: age_group, $options: "i" } }),
    });

    if (!profiles) {
      throw new AppError("No profiles found matching the criteria", 404);
    }

    return res.status(200).json({
      status: "success",
      count: profiles.length,
      data: profiles,
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

    return res.status(204).json({
      status: "success",
      message: "User profile deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
