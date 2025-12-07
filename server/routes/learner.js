const router = require('express').Router();
const Course = require('../models/Course');
const Transaction = require('../models/Transaction'); // <--- Likely missing
const Bank = require('../models/Bank');               // <--- Likely missing
const User = require('../models/User');               // <--- Likely missing

// 1. GET all APPROVED courses
router.get('/available-courses', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'approved' })
                                .populate('instructorId', 'name'); 
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. BUY COURSE (Initiate Transaction)
router.post('/buy', async (req, res) => {
  const { learnerId, courseId, price } = req.body;

  // Validate Inputs
  if (!learnerId || !courseId || !price) {
      return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // A. Check Learner's Bank Balance
    const user = await User.findById(learnerId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.bankAccountId) {
        return res.status(400).json({ message: "Please setup your bank account first." });
    }

    const bank = await Bank.findById(user.bankAccountId);
    if (!bank) return res.status(404).json({ message: "Bank account not found" });

    if (bank.balance < price) {
        return res.status(400).json({ message: "Insufficient Balance!" });
    }

    // B. Deduct Money (Hold it in "LMS" escrow)
    bank.balance -= parseInt(price); // Ensure price is a number
    await bank.save();

    // C. Create Transaction Record
    const newTx = new Transaction({
        learnerId,
        courseId,
        amount: price,
        status: 'pending_admin' 
    });

    await newTx.save();

    res.json({ message: "Purchase successful! Waiting for Admin Approval." });

  } catch (err) {
    console.error("Buy Route Error:", err); // Log error to terminal for debugging
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;