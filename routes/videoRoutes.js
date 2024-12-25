const express = require("express");
const { VideoModel, validateVideo, validateChild } = require("../models/videoModel");
const router = express.Router();

// Create a new parent video object
router.post("/", async (req, res) => {
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

// Update a parent video object
router.put("/:id", async (req, res) => {
  const { error } = validateVideo(req.body);
  if (error) return res.status(400).json(error.details);

  try {
    const updatedVideo = await VideoModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedVideo) return res.status(404).json({ message: "Video not found" });
    res.json(updatedVideo);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Add a new child object to a parent video
router.post("/:id/child", async (req, res) => {
  const { error } = validateChild(req.body);
  if (error) return res.status(400).json(error.details);

  try {
    const video = await VideoModel.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const newChild = req.body;
    video.childObjects.push(newChild);
    await video.save();

    res.status(201).json(video);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Update a specific child object by ID
router.put("/:videoId/child/:childId", async (req, res) => {
  const { error } = validateChild(req.body);
  if (error) return res.status(400).json(error.details);

  try {
    const video = await VideoModel.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const child = video.childObjects.id(req.params.childId);
    if (!child) return res.status(404).json({ message: "Child not found" });

    Object.assign(child, req.body);
    await video.save();

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
