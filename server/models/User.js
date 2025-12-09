const mongoose = require('mongoose');

// Track progress for a specific course
const EnrolledCourseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  
  // Stores indices of classes visited (e.g., [0, 1, 3])
  completedClassIndices: { type: [Number], default: [] }, 
  
  // Stores quiz results per class
  quizResults: [{ 
      classIndex: Number, 
      score: Number, // Percentage
      passed: Boolean 
  }],
  
  certificateGenerated: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['learner', 'instructor', 'lms-admin'], 
    default: 'learner' 
  },
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
  
  // NEW: Track Enrolled Courses
  enrolledCourses: [EnrolledCourseSchema] 
});

module.exports = mongoose.model('User', UserSchema);