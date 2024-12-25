const mongoose = require("mongoose");
const Joi = require("joi");

// Child Schema
const childSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Unique ID for child
  question: { type: String, required: true },
  answer: { type: String, required: true },
  imageLink: { type: String, required: false },
  video: { type: String, required: true }, // Link to the video file
  index: { type: Number, required: true }, // Order of the question
});

// Parent Schema
const videoSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Unique ID for parent
  title: { type: String, required: true }, // Video title or identifier
  childObjects: [childSchema], // Array of child objects
  createdAt: { type: Date, default: Date.now },
});

exports.VideoModel = mongoose.model("videos", videoSchema);

// Joi Validation for Child Object
exports.validateChild = (child) => {
  const schema = Joi.object({
    question: Joi.string().min(5).required(),
    answer: Joi.string().min(1).required(),
    imageLink: Joi.string().uri().optional(),
    video: Joi.string().uri().required(),
    index: Joi.number().integer().min(0).required(),
  });
  return schema.validate(child);
};

// Joi Validation for Parent Object
exports.validateVideo = (video) => {
  const schema = Joi.object({
    title: Joi.string().min(3).required(),
    childObjects: Joi.array().items(
      Joi.object({
        _id: Joi.string().optional(), // ID for child (auto-generated)
        question: Joi.string().min(5).required(),
        answer: Joi.string().min(1).required(),
        imageLink: Joi.string().uri().optional(),
        video: Joi.string().uri().required(),
        index: Joi.number().integer().min(0).required(),
      })
    ).required(),
  });
  return schema.validate(video);
};
