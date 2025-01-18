var express = require("express");
var router = express.Router();
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");

// Setup multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GCP bucket name
const bucketName = "your-gcp-bucket-name";

/* POST to upload a file. */
router.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileName = `uploads/${Date.now()}-${file.originalname}`;
  const storageClient = new Storage();

  try {
    // Upload file to GCP
    const bucket = storageClient.bucket(bucketName);
    const fileUpload = bucket.file(fileName);
    await fileUpload.save(file.buffer, {
      contentType: file.mimetype,
      public: true, // Make the file public
    });

    // Generate the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log(`File uploaded successfully: ${publicUrl}`);
    res.json(publicUrl); // Send the public URL back to the client
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = router;
