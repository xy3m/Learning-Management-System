const router = require('express').Router();
const Course = require('../models/Course');
const Bank = require('../models/Bank');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// 1. Get Pending Courses
router.get('/pending-courses', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' }).populate('instructorId', 'name email');
    res.json(courses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Approve Course Content
router.put('/approve/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.status = 'approved';
    await course.save();
    res.json({ message: "Course Content Approved! Now visible to Learners." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Get All Transactions
router.get('/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find()
        .populate('learnerId', 'name')
        .populate('courseId', 'title');
    res.json(txs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. ADMIN ACTION on Transaction (Approve or Decline Purchase)
router.post('/transaction-action', async (req, res) => {
    const { transactionId, action } = req.body; // action: 'approve' or 'decline'

    try {
        const tx = await Transaction.findById(transactionId);
        if (!tx) return res.status(404).json({ message: "Transaction not found" });

        if (action === 'approve') {
            // Forward to Instructor for final approval
            tx.status = 'pending_instructor';
            await tx.save();
            return res.json({ message: "Approved! Forwarded to Instructor." });
        } 
        else if (action === 'decline') {
            // REFUND LOGIC: Admin -> Learner
            const learner = await User.findById(tx.learnerId);
            const admin = await User.findOne({ role: 'lms-admin' });
            
            const learnerBank = await Bank.findById(learner.bankAccountId);
            const adminBank = await Bank.findById(admin.bankAccountId);

            adminBank.balance -= tx.amount;
            learnerBank.balance += tx.amount;

            await adminBank.save();
            await learnerBank.save();

            tx.status = 'declined';
            await tx.save();
            return res.json({ message: "Transaction Declined. Money Refunded." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;