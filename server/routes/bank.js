const router = require('express').Router();
const Bank = require('../models/Bank');
const User = require('../models/User');

// Create Bank Account (Setup)
router.post('/setup', async (req, res) => {
  const { userId, accountNumber, secret } = req.body;
  try {
    // Check if account already exists
    const existing = await Bank.findOne({ accountNumber });
    if (existing) return res.status(400).json({ message: "Account number already exists" });

    const newBank = new Bank({
      ownerId: userId,
      accountName: "User Account",
      accountNumber,
      secret,
      balance: 5000 // Give them dummy money to start
    });

    const savedBank = await newBank.save();
    
    // Link to user
    await User.findByIdAndUpdate(userId, { bankAccountId: savedBank._id });

    res.status(201).json(savedBank);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Balance
router.get('/balance/:userId', async (req, res) => {
  try {
    const bank = await Bank.findOne({ ownerId: req.params.userId });
    if (!bank) return res.status(404).json({ message: "No bank account linked" });
    res.json({ balance: bank.balance, accountNumber: bank.accountNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;