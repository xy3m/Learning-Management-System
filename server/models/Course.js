const mongoose = require('mongoose');

// Schema for a Single Class Content
const ClassContentSchema = new mongoose.Schema({
  video: { type: String, required: true }, // Mandatory
  audio: { type: String }, // Optional
  text: { type: String }, // Optional
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
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // NEW: Array of Classes
  classes: [ClassContentSchema],

  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);