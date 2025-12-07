const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['learner', 'instructor', 'lms-admin'], 
    default: 'learner' 
  },
  // We link the user to a bank account ID once they set it up
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' }
});

module.exports = mongoose.model('User', UserSchema);