const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String, // required: true, // Commented out the required validation
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Resume", ResumeSchema);
