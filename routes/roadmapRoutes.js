const express = require("express");
const router = express.Router();
const Roadmap = require("../models/Roadmap");
const fetch = require("node-fetch").default;
const mongoose = require("mongoose");

const generateRoadmap = async (data) => {
  try {
    const request = await fetch(
      "https://mention.com/wp-json/openai-proxy/v1/generate",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          Referer: "https://mention.com/en/linkedin-post-generator/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body:
          '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"' +
          encodeURIComponent(data) +
          '"}],"temperature":0.7,"max_tokens":256,"top_p":1,"frequency_penalty":0,"presence_penalty":0}',
        method: "POST",
      }
    );

    if (!request.ok) {
      console.error("AI API Error:", request.status, request.statusText);
      return { error: `AI API Error: ${request.status} ${request.statusText}` };
    }

    const response = await request.json();
    console.log(`AI API Response: ${JSON.stringify(response, null, 4)}`);
    return response;
  } catch (error) {
    console.error("Error in generateRoadmap:", error);
    return { error: error.message };
  }
};

router.post("/", async (req, res) => {
  const { goals, skills, title, userId } = req.body;

  if (!goals || !skills || !userId) {
    return res
      .status(400)
      .json({ message: "Goals, skills, and userId are required." });
  }

  if (goals.length > 6 || skills.length > 6) {
    return res
      .status(400)
      .json({ message: "You can select up to 6 goals and 6 skills." });
  }

  try {
    const prompt = `Generate a personalized learning roadmap based on the following goals: ${goals.join(
      ", "
    )} and current skills: ${skills.join(
      ", "
    )}. The roadmap should include specific topics, potential resources, and a suggested learning order.`;

    const roadmapAi = await generateRoadmap(prompt);

    if (roadmapAi.error) {
      console.error("Error from generateRoadmap:", roadmapAi.error);
      return res.status(500).json({
        message: "Failed to generate roadmap from AI.",
        error: roadmapAi.error,
      });
    }

    const aiResponse = roadmapAi.bio || roadmapAi.content;
    if (!aiResponse) {
      console.error("Unexpected AI API response:", roadmapAi);
      return res.status(500).json({
        message: "Unexpected response format from AI API.",
        error: "Invalid AI response format",
      });
    }

    let objectId;
    try {
      console.log("Attempting to convert userId:", userId);
      objectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      console.error("Invalid userId format:", error);
      return res.status(400).json({ message: "Invalid userId format." });
    }

    const roadmap = new Roadmap({
      title: title || "Personalized Roadmap",
      userId: objectId,
      userInput: { goals, skills },
      description: aiResponse,
      aiRoadmapId: roadmapAi.id,
    });

    await roadmap.save();
    res.status(201).json({
      message: "Roadmap generated and saved successfully.",
      roadmap: roadmap,
    });
  } catch (error) {
    console.error("Error generating and saving roadmap:", error);
    res.status(500).json({
      message: "Failed to generate and save roadmap.",
      error: error.message,
    });
  }
});

router.get("/:roadmapId", async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.roadmapId).populate(
      "resources"
    );
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }
    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
