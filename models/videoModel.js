const mongoose = require("mongoose");
const Joi = require("joi");
const { getMaxListeners } = require("nodemailer/lib/xoauth2");

// Child Schema
const childSchema = new mongoose.Schema({
  id_video: String,
  question: String,
  answer: String,
  imageLink: String,
  index: Number,
});
exports.ChildModel = mongoose.model("childvideos", childSchema);

// Parent Schema
const videoSchema = new mongoose.Schema({
  id_user: String,
  title: String,
  childObjects: Array,
  recommend: String,
  createdAt: { type: Date, default: Date.now },
});

exports.VideoModel = mongoose.model("videos", videoSchema);

// Joi Validation for Child Object
exports.validateChild = (child) => {
  const schema = Joi.object({
    id_video: Joi.string(),
    question: Joi.string(),
    index: Joi.number(),
    answer: Joi.string().min(1).max(50).required(),
    // imageLink: Joi.string().uri().required(),
    imageLink: Joi.string().required(),
  });
  return schema.validate(child);
};

// Joi Validation for Parent Object
exports.validateVideo = (video) => {
  const schema = Joi.object({
    title: Joi.string().min(2).required(),
  });
  return schema.validate(video);
};
