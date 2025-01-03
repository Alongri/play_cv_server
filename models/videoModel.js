const mongoose = require("mongoose");
const Joi = require("joi");

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
  createdAt: { type: Date, default: Date.now },
});

exports.VideoModel = mongoose.model("videos", videoSchema);

// Joi Validation for Child Object
exports.validateChild = (child) => {
  const schema = Joi.object({
    answer: Joi.string().min(1).required(),
    imageLink: Joi.string().uri().required(),
  });
  return schema.validate(child);
};

// Joi Validation for Parent Object
exports.validateVideo = (video) => {
  const schema = Joi.object({
    title: Joi.string().min(3).required(),
  });
  return schema.validate(video);
};
