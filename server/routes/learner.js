const router = require('express').Router();
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const User = require('../models/User');

// --- HELPER: Get Admin Bank ---
const getAdminBank = async () => {
    let admin = await User.findOne({ role: 'lms-admin' });
    if (!admin) throw new Error("CRITICAL: No Admin user found. Please run 'node seed.js'");

    if (admin.bankAccountId) {
        const linkedBank = await Bank.findById(admin.bankAccountId);
        if (linkedBank) return linkedBank; 
    }

    const existingVault = await Bank.findOne({ accountNumber: "ADMIN-VAULT-999" });
    if (existingVault) {
        admin.bankAccountId = existingVault._id;
        await admin.save();
        return existingVault;
    }

    const newBank = new Bank({ 
        ownerId: admin._id, 
        accountName: "LMS Treasury Vault",
        balance: 10000, 
        accountNumber: "ADMIN-VAULT-999", 
        secret: "admin-secret-key"
    });
    
    await newBank.save();
    admin.bankAccountId = newBank._id;
    await admin.save();
    
    return newBank;
};

// 1. GET all APPROVED courses
router.get('/available-courses', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'approved' }).populate('instructorId', 'name');
    res.json(courses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. GET My Transaction Status
router.get('/my-status/:learnerId', async (req, res) => {
    try {
        const txs = await Transaction.find({ learnerId: req.params.learnerId });
        res.json(txs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. BUY COURSE
router.post('/buy', async (req, res) => {
  const { learnerId, courseId } = req.body; 

  if (!learnerId || !courseId) {
      return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // A. Check Learner
    const learner = await User.findById(learnerId);
    if (!learner) return res.status(404).json({ message: "Learner user not found" });
    
    if (!learner.bankAccountId) {
        return res.status(400).json({ message: "No bank account linked. Please Logout and Login to setup." });
    }

    // B. Get Learner Bank
    const learnerBank = await Bank.findById(learner.bankAccountId);
    if (!learnerBank) {
        return res.status(404).json({ message: "Your Bank Account is corrupted. Please contact support." });
    }

    // C. Get Admin Bank
    const adminBank = await getAdminBank(); 

    // D. Get Course & Use Database Price
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // USE DB PRICE
    const numericPrice = course.price; 

    // E. Validate Balance
    if (learnerBank.balance < numericPrice) {
        return res.status(400).json({ message: `Insufficient Balance! You have $${learnerBank.balance}, Course is $${numericPrice}` });
    }

    // F. EXECUTE TRANSFER (Learner -> Admin)
    learnerBank.balance -= numericPrice;
    adminBank.balance += numericPrice;

    await learnerBank.save();
    await adminBank.save();

    // G. Create Transaction Record
    const newTx = new Transaction({
        learnerId,
        courseId,
        instructorId: course.instructorId,
        amount: numericPrice,
        status: 'pending_admin'
    });

    await newTx.save();

    // TIMER REMOVED HERE - No more auto refunds.

    res.json({ message: "Order Placed! Money deducted. Waiting for Admin Approval." });

  } catch (err) {
    console.error("Buy Route Error:", err); 
    res.status(500).json({ error: "Transaction Failed: " + err.message });
  }
});

module.exports = router;