const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true },
  
  // The complex approval flow status
  status: { 
    type: String, 
    enum: ['pending_admin', 'pending_instructor', 'completed', 'refunded'], 
    default: 'pending_admin' 
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);