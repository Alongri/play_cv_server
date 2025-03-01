const express = require("express");
const {
  VideoModel,
  ChildModel,
  validateVideo,
  validateChild,
} = require("../models/videoModel");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { auth, authAdmin } = require("../middlewares/auth");
const { determineJobPreference } = require("../middlewares/res_gpt");
const path = require("path");
const multer = require("multer");
const ffmpeg = require("ffmpeg");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");

const TEMP_FOLDER = "./uploads";
if (!fs.existsSync(TEMP_FOLDER)) fs.mkdirSync(TEMP_FOLDER);

// Create a new parent video object
router.post("/video", auth, async (req, res) => {
  let token = req.header("x-api-key");
  let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
  let token_id = decodeToken._id;
  const { error } = validateVideo(req.body);
  const _dataBody = req.body;
  _dataBody.id_user = token_id;
  if (error) return res.status(400).json(error.ValidationError);
  try {
    const video = new VideoModel(req.body);
    const savedVideo = await video.save();
    res.status(201).json(savedVideo);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Add a new child object to a parent video
router.post("/child", async (req, res) => {
  try {
    const video = await VideoModel.findById(req.body.id_video);
    if (!video) return res.status(404).json({ message: "Video not found" });
    const newChild = new ChildModel(req.body);
    let dataChild = await newChild.save();
    video.childObjects.push(dataChild._id);
    if (req.body.index == 11) {
      const questionsAndAnswers = video.childObjects.map((obj) => ({
        question: obj.question,
        answer: obj.answer,
      }));
      const gptRecommend = await determineJobPreference(questionsAndAnswers);
      video.recommend = gptRecommend;
    }
    let dataVideo = await VideoModel.updateOne(
      { _id: dataChild.id_video },
      video
    );
    res.status(201).json(dataChild);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Determine the path of your gcp.json key file dynamically
const dirPath = __dirname.split("\\routes")[0];
const apiStorage = new Storage({
  keyFilename: path.join(dirPath, "gcp.json"), // path to the service account key file
  projectId: "refined-ensign-450411-p2", // Specify your project ID
});

const bucketName = "play_cv_bucket";
const bucket = apiStorage.bucket(bucketName);

const upload = multer({ storage: multer.memoryStorage() });

router.post("/uploadimage", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  console.log("Original filename:", req.file.originalname);

  const sanitizedFileName = req.file.originalname
    .replace(/[{}<>:"/\|?*\s]+/g, "")
    .replace(/\.+$/, "");

  console.log("Sanitized filename:", sanitizedFileName);
  const destination = `uploads/${Date.now()}_${sanitizedFileName}`;
  console.log("Destination Path:", destination);
  try {
    const blob = bucket.file(destination);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: req.file.mimetype,
      },
    });
    blobStream.on("error", (err) => {
      console.error("Upload error:", err);
      return res.status(500).send("Upload error: " + err.message);
    });
    blobStream.on("finish", () => {
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
      return res.json({ url: fileUrl });
    });
    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send("Error uploading file: " + error.message);
  }
});

// Get a parent child object by id_user and index
router.patch("/child", async (req, res) => {
  const id_video = req.body.id_video;
  const index = req.body.index;
  console.log(req.body);
  console.log(id_video);
  console.log(index);
  try {
    const child = await ChildModel.findOne({ id_video, index });
    console.log(child);

    if (!child) return res.status(404).json({ message: "child not found" });
    res.json(child);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Update a specific child object by ID
router.patch("/updatedchild", async (req, res) => {
  try {
    console.log(req.body);
    let child = await ChildModel.findOne({ _id: req.body._id });
    console.log(child);
    if (!child) return res.status(404).json({ message: "Child not found!" });
    child.answer = req.body.answer;
    child.imageLink = req.body.imageLink;
    console.log(child);

    const updatedChild = await ChildModel.findByIdAndUpdate(
      req.body._id,
      child
    );
    console.log(updatedChild);
    res.status(200).json(updatedChild);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Check for information on the next index
router.patch("/nextIndex", async (req, res) => {
  const id_video = req.body.id_video;
  const index = req.body.index;
  console.log(index);
  console.log(id_video);

  try {
    const child = await ChildModel.findOne({
      id_video: id_video,
      index: index,
    });
    console.log(child);

    if (!child) {
      return res.json({ message: "child not found" });
    }
    res.status(200).json(child);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get all User Videos by ID for user
router.get("/allUserVideos", auth, async (req, res) => {
  try {
    let token = req.header("x-api-key");
    let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    let token_id = decodeToken._id;
    const video = await VideoModel.find({ id_user: token_id });
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.status(200).json(video);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get all User Videos by ID for admin
router.get("/allUserVideosAdmin/:id", authAdmin, async (req, res) => {
  try {
    const video = await VideoModel.find({ id_user: req.params.id });
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.status(200).json(video);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get a parent video object by ID
router.get("/:id", async (req, res) => {
  try {
    const video = await VideoModel.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.status(200).json(video);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

/// Get all child objects for a specific video
router.get("/childobjects/:id", auth, async (req, res) => {
  try {
    const childObjects = await ChildModel.find({ id_video: req.params.id });
    console.log("Fetching child objects for video ID:", req.params.id);
    if (!childObjects || childObjects.length === 0) {
      return res
        .status(404)
        .json({ message: "No child objects found for this video" });
    }
    res.status(200).json(childObjects);
    console.log("Child objects fetched:", childObjects);
  } catch (err) {
    console.error("Error fetching child objects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a parent video object
router.patch("/:id", async (req, res) => {
  const { error } = validateVideo(req.body);
  if (error) return res.status(400).json(error.details);
  try {
    const updatedVideo = await VideoModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedVideo)
      return res.status(404).json({ message: "Video not found" });
    res.status(200).json(updatedVideo);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
