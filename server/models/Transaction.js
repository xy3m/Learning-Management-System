const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  amount: { type: Number, required: true },
  
  // New field to track exactly when Admin said "Yes"
  adminApprovedAt: { type: Date },

  status: { 
    type: String, 
    enum: ['pending_admin', 'pending_instructor', 'completed', 'refunded', 'declined_admin', 'declined_instructor'], 
    default: 'pending_admin' 
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Transaction', TransactionSchema);