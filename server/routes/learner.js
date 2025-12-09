const router = require('express').Router();
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const User = require('../models/User');
const PDFDocument = require('pdfkit'); 

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

// 2. GET SINGLE COURSE + USER PROGRESS
router.get('/course/:courseId/:learnerId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate('instructorId', 'name');
    const user = await User.findById(req.params.learnerId);
    
    if (!course || !user) return res.status(404).json({ message: "Not found" });

    const progress = user.enrolledCourses.find(c => c.courseId.toString() === req.params.courseId) || {
        completedClassIndices: [],
        quizResults: []
    };

    res.json({ course, progress });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. UPDATE PROGRESS
router.post('/progress', async (req, res) => {
    const { learnerId, courseId, classIndex } = req.body;
    try {
        const user = await User.findById(learnerId);
        
        let enrollment = user.enrolledCourses.find(c => c.courseId.toString() === courseId);
        if (!enrollment) {
            user.enrolledCourses.push({ courseId, completedClassIndices: [classIndex] });
        } else {
            if (!enrollment.completedClassIndices.includes(classIndex)) {
                enrollment.completedClassIndices.push(classIndex);
            }
        }
        
        await user.save();
        res.json({ message: "Progress updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. SUBMIT QUIZ SCORE
router.post('/submit-quiz', async (req, res) => {
    const { learnerId, courseId, classIndex, score, passed } = req.body;
    try {
        const user = await User.findById(learnerId);
        let enrollment = user.enrolledCourses.find(c => c.courseId.toString() === courseId);
        
        if (!enrollment) {
            enrollment = { courseId, completedClassIndices: [], quizResults: [] };
            user.enrolledCourses.push(enrollment);
        }

        enrollment.quizResults = enrollment.quizResults.filter(q => q.classIndex !== classIndex);
        enrollment.quizResults.push({ classIndex, score, passed });
        
        await user.save();
        res.json({ message: "Quiz result saved" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. GENERATE CERTIFICATE (Dark Theme & Stylish)
router.get('/certificate/:courseId/:learnerId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).populate('instructorId', 'name');
        const user = await User.findById(req.params.learnerId);
        
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
            margin: 0 // Full bleed for background
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate-${course.title}.pdf`);
        doc.pipe(res);

        // --- 1. BACKGROUND (Dark Theme) ---
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#121212'); // Main Dark BG

        // --- 2. ABSTRACT SHAPES (Top Right Corner) ---
        doc.save(); // Save state
        
        // Shape 1 (Yellow)
        doc.path('M 600 0 Q 750 100 842 0') 
           .lineTo(doc.page.width, 0)
           .lineTo(doc.page.width, 300)
           .bezierCurveTo(750, 350, 650, 100, 600, 0)
           .fill('#FCD34D'); // Yellow-400

        // Shape 2 (Green)
        doc.circle(doc.page.width, 150, 180)
           .fillOpacity(0.9)
           .fill('#10B981'); // Green-500

        // Shape 3 (Blue/Accent)
        doc.circle(doc.page.width - 50, 300, 120)
           .fillOpacity(0.9)
           .fill('#6366F1'); // Indigo-500 (Accent)

        doc.restore(); // Restore state so text isn't clipped/colored

        // --- 3. BORDER FRAME ---
        const margin = 30;
        doc.rect(margin, margin, doc.page.width - (margin*2), doc.page.height - (margin*2))
           .strokeColor('#333333')
           .lineWidth(3)
           .stroke();

        // --- 4. CONTENT (Left Aligned) ---
        const startX = 80; // Left padding for text

        // LOGO
        doc.fontSize(30).fillColor('#6366F1').font('Helvetica-Bold')
           .text('LMS.SIM', startX, 70);

        // Header Title
        doc.fontSize(10).fillColor('#9CA3AF').font('Helvetica') // Gray-400
           .text('CERTIFICATE OF COMPLETION', startX, 120, { letterSpacing: 2 });

        // Learner Name (Huge)
        doc.fontSize(45).fillColor('#FFFFFF').font('Helvetica-Bold')
           .text(user.name, startX, 140);

        // Subtext
        doc.fontSize(12).fillColor('#9CA3AF').font('Helvetica')
           .text('SUCCESSFULLY COMPLETED THE COURSE', startX, 210, { letterSpacing: 1 });

        // Course Title (Large)
        doc.fontSize(30).fillColor('#FFFFFF').font('Helvetica-Bold')
           .text(course.title, startX, 235, { width: 500 }); // Limit width to avoid hitting shapes

        // Line Separator
        doc.moveTo(startX, 350).lineTo(startX + 300, 350).strokeColor('#4B5563').lineWidth(1).stroke();

        // Footer Info (Instructor & Date)
        doc.fontSize(10).fillColor('#D1D5DB').font('Helvetica-Bold') // Gray-300
           .text('INSTRUCTOR', startX, 370);
        
        doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica')
           .text(course.instructorId.name, startX, 385);

        doc.fontSize(10).fillColor('#D1D5DB').font('Helvetica-Bold')
           .text('DATE ISSUED', startX + 200, 370); // Offset to the right
        
        doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica')
           .text(new Date().toLocaleDateString(), startX + 200, 385);

        // ID (Bottom Left, small)
        doc.fontSize(8).fillColor('#374151') // Gray-700 (Very dark gray)
           .text(`Certificate ID: ${course._id}-${user._id}`, startX, doc.page.height - 60);

        doc.end();

    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. BUY COURSE
router.post('/buy', async (req, res) => {
  const { learnerId, courseId, learnerSecret } = req.body; 

  if (!learnerId || !courseId || !learnerSecret) {
      return res.status(400).json({ message: "Missing required fields or Secret PIN." });
  }

  try {
    const learner = await User.findById(learnerId);
    if (!learner) return res.status(404).json({ message: "Learner user not found" });
    if (!learner.bankAccountId) return res.status(400).json({ message: "No bank account linked." });

    const learnerBank = await Bank.findById(learner.bankAccountId);
    if (!learnerBank) return res.status(404).json({ message: "Bank Account corrupted." });

    if (learnerBank.secret !== learnerSecret) {
        return res.status(401).json({ message: "Invalid Bank PIN!" });
    }

    const adminBank = await getAdminBank(); 
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const numericPrice = course.price; 

    if (learnerBank.balance < numericPrice) {
        return res.status(400).json({ message: `Insufficient Balance! You have ৳${learnerBank.balance}` });
    }

    learnerBank.balance -= numericPrice;
    adminBank.balance += numericPrice;

    await learnerBank.save();
    await adminBank.save();

    const newTx = new Transaction({
        learnerId,
        courseId,
        instructorId: course.instructorId,
        amount: numericPrice,
        status: 'pending_admin'
    });

    await newTx.save();
    res.json({ message: "Order Placed! Money deducted. Waiting for Admin Approval." });

  } catch (err) {
    res.status(500).json({ error: "Transaction Failed: " + err.message });
  }
});

// 7. GET My Status
router.get('/my-status/:learnerId', async (req, res) => {
    try {
        const txs = await Transaction.find({ learnerId: req.params.learnerId }).sort({ createdAt: -1 });
        res.json(txs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;