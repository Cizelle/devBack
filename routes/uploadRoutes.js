const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Resume = require("../models/Resume");
const mongoose = require("mongoose");
const pdf = require("pdf-parse");
const fs = require("fs").promises;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

router.post(
  "/upload-resume",
  upload.single("submit-resume"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
      const newResume = new Resume({
        userId: new mongoose.Types.ObjectId(userId),
        filename: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        content: "Resume file uploaded",
      });

      await newResume.save();

      if (req.file.mimetype === "application/pdf") {
        try {
          const dataBuffer = await fs.readFile(req.file.path);
          const pdfData = await pdf(dataBuffer);
          const extractedText = pdfData.text;

          await Resume.findByIdAndUpdate(newResume._id, { extractedText });
          console.log("PDF text extracted and saved to database.");
        } catch (error) {
          console.error("Error parsing PDF:", error);
        }
      }

      res
        .status(200)
        .json({ message: "Resume uploaded successfully!", file: req.file });
    } catch (error) {
      console.error("Error saving resume info:", error);
      console.error("Error details:", error.stack);
      res.status(500).json({
        message: "Failed to save resume information.",
        error: error.message,
      });
    }
  }
);

router.get("/test-upload-route", (req, res) => {
  res.json({ message: "Test route works!" });
});

module.exports = router;
