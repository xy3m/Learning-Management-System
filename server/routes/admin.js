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
    res.json({ message: "Content Approved! Visible to Learners." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Get All Transactions
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

// 4. ADMIN ACTION on Transaction
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

// 5. ADMIN CLEAR HISTORY
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

// 6. NEW: GET ALL INSTRUCTORS (With Course Info)
router.get('/instructors', async (req, res) => {
    try {
        const instructors = await User.find({ role: 'instructor' }).select('-password');
        
        // Attach courses for each instructor
        const data = await Promise.all(instructors.map(async (inst) => {
            const courses = await Course.find({ instructorId: inst._id }, 'title status price');
            return {
                ...inst._doc,
                courses
            };
        }));
        
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. NEW: DELETE INSTRUCTOR
router.delete('/instructor/:id', async (req, res) => {
    try {
        // Delete the User
        await User.findByIdAndDelete(req.params.id);
        // Delete their Courses (Optional but recommended to avoid data issues)
        await Course.deleteMany({ instructorId: req.params.id });
        
        res.json({ message: "Instructor and their courses deleted." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;