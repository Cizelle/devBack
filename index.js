const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const userRoutes = require("./routes/userRoutes.js");
const roadmapRoutes = require("./routes/roadmapRoutes.js");
const resourceRoutes = require("./routes/resourceRoutes.js");
const resumeRoutes = require("./routes/resumeRoutes.js");
const uploadRoutes = require("./routes/uploadRoutes.js"); // Import uploadRoutes

app.use("/users", userRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/resources", resourceRoutes);
app.use("/api/resumes", require("./routes/resumeRoutes"));
app.use("/api", uploadRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
