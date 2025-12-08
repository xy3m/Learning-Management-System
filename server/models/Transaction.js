const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // NEW FIELD
  amount: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['pending_admin', 'pending_instructor', 'completed', 'refunded', 'declined'], 
    default: 'pending_admin' 
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);