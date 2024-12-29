var express = require("express");
var router = express.Router();
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const fs = require("fs");

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ msg: "Work from pictures" });
});

/* GET home page. */
router.post("/", async (req, res, next) => {
  const bucketName = req.body.bucketName;
  const localFilePath = req.body.localFilePath;
  const destFileName = req.body.destFileName;

  const storage = new Storage();
  try {
    // Upload the file to the bucket
    await storage.bucket(bucketName).upload(localFilePath, {
      destination: destFileName,
      public: true, // Makes the file publicly accessible
    });

    console.log(`${localFilePath} uploaded to ${bucketName}`);

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destFileName}`;
    console.log(`Public URL: ${publicUrl}`);

    return res.json(publicUrl);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
});

// /**
//  * Uploads a photo to GCP and generates a public URL.
//  * @param {string} bucketName - The name of your GCP bucket.
//  * @param {string} localFilePath - The path to the local file to upload.
//  * @param {string} destFileName - The name for the file in the bucket.
//  * @returns {string} - The public URL of the uploaded file.
//  */

// (async () => {
//   const bucketName = "your-bucket-name"; // Replace with your bucket name
//   const localFilePath = "./path-to-your-photo.jpg"; // Replace with the file path
//   const destFileName = "photos/photo.jpg"; // Replace with the desired destination path

//   try {
//     const publicUrl = await uploadPhotoToGCP(
//       bucketName,
//       localFilePath,
//       destFileName
//     );
//     console.log("Uploaded successfully! Access it here:", publicUrl);
//   } catch (error) {
//     console.error("Failed to upload photo:", error);
//   }
// })();

module.exports = router;
