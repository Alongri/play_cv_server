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
  // Ensure a file is uploaded
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  console.log("Original filename:", req.file.originalname);

  // Sanitize the file name by removing special characters and trimming any trailing dots
  const sanitizedFileName = req.file.originalname
    .replace(/[{}<>:"/\|?*\s]+/g, "") // Remove special characters and spaces
    .replace(/\.+$/, ""); // Remove trailing dots

  console.log("Sanitized filename:", sanitizedFileName);

  const destination = `uploads/${Date.now()}_${sanitizedFileName}`;
  console.log("Destination Path:", destination);

  try {
    // Create a file object in the bucket
    const blob = bucket.file(destination);

    // Create a write stream to upload the file to the bucket
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: req.file.mimetype, // Ensure the correct MIME type is set for the uploaded file
      },
    });

    // Handle stream errors
    blobStream.on("error", (err) => {
      console.error("Upload error:", err);
      return res.status(500).send("Upload error: " + err.message);
    });

    // Handle successful file upload
    blobStream.on("finish", () => {
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
      return res.json({ url: fileUrl });
    });

    // Start the upload by passing the file buffer
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

// router.patch("/generate", async (req, res) => {
//   try {
//     // const childObjects = await ChildModel.find({ id_video: req.params.id });
//     // if (!childObjects || childObjects.length === 0) {
//     //   return res.status(404).json({ message: "Child not found!" });
//     // }
//     const data_check = req.body.ar;
//     console.log(data_check);

//     const filteredData = data_check.map(({ answer, imageLink }) => ({
//       answer,
//       imageLink,
//     }));
//     console.log(filteredData);

//     if (filteredData.length === 0) {
//       return res.status(400).json({ message: "No valid data found!" });
//     }

//     const outputFile = path.join(
//       TEMP_FOLDER,
//       `output_video_${req.body.ar[0]._id}.mp4`
//     );
//     const tempFolder = path.join(TEMP_FOLDER, `images_${req.body.ar[0]._id}`);
//     if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

//     const imagePaths = [];

//     // Process each image: Add answer as overlay text
//     await Promise.all(
//       filteredData.map((item, index) => {
//         return new Promise((resolve, reject) => {
//           const tempImage = path.join(tempFolder, `temp_${index}.jpg`);
//           imagePaths.push(tempImage);

//           ffmpeg(item.imageLink)
//             .outputOptions([
//               `-vf drawtext="text='${item.answer}': fontcolor=white: fontsize=24: x=(w-text_w)/2: y=h-50"`,
//               "-q:v 1",
//             ])
//             .output(tempImage)
//             .on("end", resolve)
//             .on("error", reject)
//             .run();
//         });
//       })
//     );

//     // Create an input file for FFmpeg
//     const inputFile = path.join(tempFolder, "input.txt");
//     const inputContent = imagePaths
//       .map((imgPath) => `file '${imgPath}'\nduration 3`)
//       .join("\n");
//     fs.writeFileSync(inputFile, inputContent);

//     // Generate video from images
//     ffmpeg()
//       .input(inputFile)
//       .inputOptions("-f concat -safe 0")
//       .output(outputFile)
//       .on("end", () => {
//         console.log("Video generated successfully:", outputFile);
//         res.status(200).json({ videoUrl: `/download/${req.params.id}` });
//       })
//       .on("error", (err) => {
//         console.error("FFmpeg Error:", err);
//         res.status(500).json({ error: "Error generating video" });
//       })
//       .run();
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Serve video for download
// router.get("/download/:id", (req, res) => {
//   const outputFile = path.join(
//     TEMP_FOLDER,
//     `output_video_${req.params.id}.mp4`
//   );

//   if (!fs.existsSync(outputFile)) {
//     return res.status(404).json({ message: "Video not found!" });
//   }

//   res.download(outputFile, `generated_video_${req.params.id}.mp4`, (err) => {
//     if (err) console.error("Error sending video:", err);

//     // Optional cleanup
//     setTimeout(() => {
//       fs.unlinkSync(outputFile);
//     }, 60000); // Delete after 1 minute
//   });
// });

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
