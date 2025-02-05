const mongoose = require('mongoose');

const DetectionSchema = new mongoose.Schema({
    class: Object,
    confidence: Number,
    bbox: {
      x_min: Number,
      y_min: Number,
      x_max: Number,
      y_max: Number,
    },
    ontologyDetails: Object,
});

  const frameSchema = new mongoose.Schema({
    framePath: String,
    detections: [DetectionSchema]
});

const videoSchema = new mongoose.Schema({
    videoId: String,
    videoPath: String,
    frameCount: Number,
    frames: [frameSchema]
});

module.exports = mongoose.model('Video', videoSchema);
