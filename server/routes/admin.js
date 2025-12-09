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

// 2. APPROVE COURSE (Secure: Requires Secret PIN & Pays Bonus)
router.put('/approve/:courseId', async (req, res) => {
  const { adminSecret } = req.body; 

  if (!adminSecret) {
      return res.status(400).json({ message: "Admin Secret PIN is required to authorize payment." });
  }

  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    if (course.status === 'approved') {
        return res.status(400).json({ message: "Course is already approved." });
    }

    const admin = await User.findOne({ role: 'lms-admin' });
    const instructor = await User.findById(course.instructorId);

    if (!admin || !instructor) return res.status(404).json({ message: "User data missing." });

    const adminBank = await Bank.findById(admin.bankAccountId);
    const instructorBank = await Bank.findById(instructor.bankAccountId);

    if (!adminBank || !instructorBank) {
        return res.status(404).json({ message: "Bank accounts not linked." });
    }

    // --- SECURITY CHECK ---
    if (adminBank.secret !== adminSecret) {
        return res.status(401).json({ message: "Invalid Secret PIN! Authorization failed." });
    }

    // --- BONUS PAYMENT (৳1000) ---
    const BONUS_AMOUNT = 1000;
    if (adminBank.balance < BONUS_AMOUNT) {
        return res.status(400).json({ message: "Admin Vault has insufficient funds to pay approval bonus." });
    }

    adminBank.balance -= BONUS_AMOUNT;
    instructorBank.balance += BONUS_AMOUNT;

    // Approve Course
    course.status = 'approved';

    await adminBank.save();
    await instructorBank.save();
    await course.save();

    res.json({ message: "Success! Verified PIN, Sent ৳1000, and Approved Course." });

  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. DECLINE COURSE CONTENT
router.put('/decline/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.status = 'declined';
    await course.save();
    res.json({ message: "Course Declined. Sent back to Instructor." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. GET ALL TRANSACTIONS (Filtered for Soft Delete)
router.get('/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find({
        hiddenByAdmin: { $ne: true }
    })
    .populate('learnerId', 'name')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. ADMIN ACTION on Transaction (Approve Purchase or Refund)
router.post('/transaction-action', async (req, res) => {
    const { transactionId, action } = req.body; 

    try {
        const tx = await Transaction.findById(transactionId);
        if (!tx) return res.status(404).json({ message: "Transaction not found" });

        if (action === 'approve') {
            tx.status = 'pending_instructor';
            tx.adminApprovedAt = new Date();
            await tx.save();
            return res.json({ message: "Approved! Forwarded to Instructor." });
        } 
        else if (action === 'decline') {
            const learner = await User.findById(tx.learnerId);
            const admin = await User.findOne({ role: 'lms-admin' });
            
            const learnerBank = await Bank.findById(learner.bankAccountId);
            const adminBank = await Bank.findById(admin.bankAccountId);

            // Refund Logic
            adminBank.balance -= tx.amount;
            learnerBank.balance += tx.amount;

            await adminBank.save();
            await learnerBank.save();

            tx.status = 'declined_admin';
            await tx.save();
            return res.json({ message: "Transaction Declined. Money Refunded." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. ADMIN CLEAR HISTORY (Soft Delete)
router.delete('/clear-history', async (req, res) => {
    try {
        await Transaction.updateMany(
            {
                status: { 
                    $in: ['completed', 'declined', 'declined_admin', 'declined_instructor', 'refunded'] 
                }
            },
            { $set: { hiddenByAdmin: true } }
        );
        res.json({ message: "Admin history cleared." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. GET ALL INSTRUCTORS
router.get('/instructors', async (req, res) => {
    try {
        const instructors = await User.find({ role: 'instructor' }).select('-password');
        const data = await Promise.all(instructors.map(async (inst) => {
            const courses = await Course.find({ instructorId: inst._id }, 'title status price');
            return { ...inst._doc, courses };
        }));
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. DELETE INSTRUCTOR
router.delete('/instructor/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Course.deleteMany({ instructorId: req.params.id });
        res.json({ message: "Instructor and their courses deleted." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;