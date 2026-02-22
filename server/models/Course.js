const mongoose = require('mongoose');

// Schema for a Single Class Content
const ClassContentSchema = new mongoose.Schema({
  video: { type: String, required: true },
  audio: { type: String },
  text: { type: String },
  mcq: [{
    question: { type: String },
    options: { type: [String], default: [] },
    answer: { type: String }
  }]
}, { _id: false });

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  thumbnail: { type: String, default: '' },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  classes: [ClassContentSchema],

  // UPDATED ENUM to include 'declined'
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);