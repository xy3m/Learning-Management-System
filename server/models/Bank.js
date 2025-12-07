const mongoose = require('mongoose');

const BankSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  secret: { type: String, required: true }, // Used for transaction validation
  balance: { type: Number, default: 10000 } // Default balance for simulation
});

module.exports = mongoose.model('Bank', BankSchema);