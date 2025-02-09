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


// Uploading an image to GCP

// const { determineJobPreference } = require("../middlewares/res_gpt");
// const multer = require("multer");
// const { Storage } = require("@google-cloud/storage");
// const path = require("path");
// const apiStorage = new Storage({ keyFilename: process.env.GCP_API_KEY, });
// const bucketName = "test_play_cv";
// const bucket = apiStorage.bucket(bucketName);
// const uploadStorage = multer.memoryStorage(); 
// const upload = multer({ storage: uploadStorage });
// router.post("/uploadimage", upload.single("image"), async (req, res) => {
//   if (!req.file) return res.status(400).send("No file uploaded.");
//   const sanitizedFileName = req.file.originalname.replace(/[{}<>:"/\|?*]/g, ''); 
//   const destination = `uploads/${Date.now()}_${sanitizedFileName}`;
//   try {
//     const blob = bucket.file(destination);
//     const blobStream = blob.createWriteStream({
//       resumable: false,
//       public: true,
//       metadata: { contentType: req.file.mimetype },
//     });

//     blobStream.on("error", (err) => {
//       res.status(500).send("Upload error: " + err.message);
//     });

//     blobStream.on("finish", () => {
//       const fileUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
//       res.json({ url: fileUrl });
//     });

//     blobStream.end(req.file.buffer);
//   } catch (error) {
//     res.status(500).send("Error uploading file: " + error.message);
//   }
// });


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
    console.log(video);
    const newChild = new ChildModel(req.body);
    // ////
    newChild.imageLink = "https://w.wallhaven.cc/full/o5/wallhaven-o5ov3l.jpg";
    let dataChild = await newChild.save();
    console.log(dataChild);

    video.childObjects.push(dataChild._id);
    let dataVideo = await VideoModel.updateOne(
      { _id: dataChild.id_video },
      video
    );
    // if(req.body.index == 11){
    // let ar = {};
    //    gpt(ar)
    // }
    res.status(201).json(dataChild);
  } catch (err) {
    res.status(500).json(err.message);
  }
});




router.get("/gpt", async (req, res) => {
  try {
    const video = await VideoModel.findById("67a4e5dca41825d1daae9749");

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Fetch child objects directly
    const childObjects = await ChildModel.find({ id_video: video._id });

    if (!childObjects || childObjects.length === 0) {
      return res.status(404).json({ message: "No child objects found for this video" });
    }

    // Map the child objects to questions and answers
    const questionsAndAnswers = childObjects.map(obj => ({
      question: obj.question,
      answer: obj.answer
    }));

    // Pass questions and answers to the next middleware
    req.body.questionsAndAnswers = questionsAndAnswers;

    // Use the job preference middleware
    determineJobPreference(req, res, () => {
      res.status(200).json({
        video: {
          ...video._doc,
        },
        questionsAndAnswers,
        jobPreference: req.jobPreference,
      });
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: err.message });
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
    if (!child) return res.status(404).json({ message: "Child not found!" });
    child.answer = req.body.answer;
    // child.imageLink = req.body.imageLink;
    ////
    child.imageLink = "https://w.wallhaven.cc/full/o5/wallhaven-o5ov3l.jpg";
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

// Get all Childs by ID video
// router.get("/allchilds/:id", auth, async (req, res) => {
//   try {
//     const allChilds = await ChildModel.find({ id_video: req.params.id });
//     if (!allChilds) return res.status(404).json({ message: "Video not found" });
//     res.status(200).json(allChilds);
//   } catch (err) {
//     res.status(500).json(err.message);
//   }
// });

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
// router.delete("/:videoId/child/:childId", async (req, res) => {
//   try {
//     const video = await VideoModel.findById(req.params.videoId);
//     if (!video) return res.status(404).json({ message: "Video not found" });

//     const child = video.childObjects.id(req.params.childId);
//     if (!child) return res.status(404).json({ message: "Child not found" });

//     child.remove();
//     await video.save();

//     res.status(200).json(video);
//   } catch (err) {
//     res.status(500).json(err.message);
//   }
// });

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

module.exports = router;
