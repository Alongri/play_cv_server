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

// Create a new parent video object
router.post("/video", auth, async (req, res) => {
  let token = req.header("x-api-key");
  let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
  let token_id = decodeToken._id;
  const { error } = validateVideo(req.body);
  const _dataBody = req.body;
  _dataBody.id_user = token_id
  if (error) return res.status(400).json(error.details);
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
  // const error = validateChild(req.body);
  // if (error) {
  //   console.log(error);
  //   return res.status(400).json(error.details);
  // }
  try {
    const video = await VideoModel.findById(req.body.id_video);
    if (!video) return res.status(404).json({ message: "Video not found" });
    console.log(video);
    const newChild = new ChildModel(req.body);
    let dataChild = await newChild.save();
    console.log(dataChild);

    video.childObjects.push(dataChild._id);
    let dataVideo = await VideoModel.updateOne(
      { _id: dataChild.id_video },
      video
    );
    res.status(201).json(dataChild);
  } catch (err) {
    res.status(500).json(err.message);
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
  // const { error } = validateChild(req.body);
  // if (error) return res.status(400).json(error.details);
  try {
    console.log(req.body);
    let child = await ChildModel.findOne({ _id: req.body._id });
    console.log(child);
    console.log(child.answer);
    if (!child) return res.status(404).json({ message: "Child not found" });
    child.answer = req.body.answer;
    child.imageLink = req.body.imageLink;
    console.log(child);

    const updatedChild = await ChildModel.findByIdAndUpdate(req.body._id, child);
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

  try {
    const child = await ChildModel.findOne({ id_video: id_video, index: index });
    if (!child) {
      return res.json({ message: "child not found" });
    }
    res.status(200).json(child);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get all User Videos by ID
router.get("/allUserVideos/:id", authAdmin, async (req, res) => {
  try {
    const video = await VideoModel.find({id_user:req.params.id});
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.status(200).json(video);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

//
//
//
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

// Delete a specific child object by ID
router.delete("/:videoId/child/:childId", async (req, res) => {
  try {
    const video = await VideoModel.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const child = video.childObjects.id(req.params.childId);
    if (!child) return res.status(404).json({ message: "Child not found" });

    child.remove();
    await video.save();

    res.status(200).json(video);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

/// Get all child objects for a specific video
router.get("/childobjects/:id", authAdmin, async (req, res) => {
  try {
    const childObjects = await ChildModel.find({ id_video: req.params.id });
    console.log("Fetching child objects for video ID:", req.params.id);
    if (!childObjects || childObjects.length === 0) {
      return res.status(404).json({ message: "No child objects found for this video" });
    }
    res.status(200).json(childObjects);
    console.log('Child objects fetched:', childObjects);
  } catch (err) {
    console.error("Error fetching child objects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




module.exports = router;
