const router = require('express').Router();
const Course = require('../models/Course');
const Bank = require('../models/Bank');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
// 1. Get Pending Courses
router.get('/pending-courses', async (req, res) => {
  try {
    // We look for courses where status is exactly 'pending'
    const courses = await Course.find({ status: 'pending' }).populate('instructorId', 'name email');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Approve Course & Pay Instructor
router.put('/approve/:courseId', async (req, res) => {
  const LUMP_SUM_PAYMENT = 500;

  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.status = 'approved';
    await course.save();

    const user = await User.findById(course.instructorId);
    if (user && user.bankAccountId) {
      const bank = await Bank.findById(user.bankAccountId);
      bank.balance += LUMP_SUM_PAYMENT;
      await bank.save();
    }

    res.json({ message: "Course Approved! Payment Transferred." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find()
        .populate('learnerId', 'name')
        .populate('courseId', 'title');
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;