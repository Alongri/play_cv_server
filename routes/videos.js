const express = require("express");
const {
  VideoModel,
  ChildModel,
  validateVideo,
  validateChild,
} = require("../models/videoModel");
const router = express.Router();

// Create a new parent video object
router.post("/video", async (req, res) => {
  const { error } = validateVideo(req.body);
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
  const { error } = validateChild(req.body);
  if (error) return res.status(400).json(error.details);
  try {
    const video = await VideoModel.findById(req.body.id_video);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const newChild = new ChildModel(req.body);
    let dataChild = await newChild.save();
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
router.get("/child", async (req, res) => {
  try {
    const child = await VideoModel.findOne({
      id_video: req.body.id_video,
      index: req.body.index,
    });
    if (!child) return res.status(404).json({ message: "child not found" });
    res.json(child);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Update a specific child object by ID
router.patch("/child", async (req, res) => {
  const { error } = validateChild(req.body);
  if (error) return res.status(400).json(error.details);
  try {
    const child = ChildModel.findById(req.body._id);
    if (!child) return res.status(404).json({ message: "Child not found" });
    const newChild = new ChildModel(req.body);
    let dataChild = await ChildModel.updateOne({ _id: child._id }, newChild);
    res.json(dataChild);
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
    res.json(video);
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

    res.json(video);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
