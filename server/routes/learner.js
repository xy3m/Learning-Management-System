const router = require('express').Router();
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const User = require('../models/User');
const PDFDocument = require('pdfkit'); // Requires 'npm install pdfkit'

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

    // Find progress for this course
    const progress = user.enrolledCourses.find(c => c.courseId.toString() === req.params.courseId) || {
        completedClassIndices: [],
        quizResults: []
    };

    res.json({ course, progress });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. UPDATE PROGRESS (Mark Class as Visited)
router.post('/progress', async (req, res) => {
    const { learnerId, courseId, classIndex } = req.body;
    try {
        const user = await User.findById(learnerId);
        
        // Find or Init Course Progress
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
            // Should theoretically exist if they are viewing the course
            enrollment = { courseId, completedClassIndices: [], quizResults: [] };
            user.enrolledCourses.push(enrollment);
        }

        // Remove old score for this class if exists
        enrollment.quizResults = enrollment.quizResults.filter(q => q.classIndex !== classIndex);
        
        // Add new score
        enrollment.quizResults.push({ classIndex, score, passed });
        
        await user.save();
        res.json({ message: "Quiz result saved" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. GENERATE CERTIFICATE (PDF)
router.get('/certificate/:courseId/:learnerId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).populate('instructorId', 'name');
        const user = await User.findById(req.params.learnerId);
        
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
        });

        // Helper to center text
        const centerText = (text, y, fontSize, font = 'Helvetica') => {
            doc.font(font).fontSize(fontSize).text(text, 0, y, { align: 'center', width: doc.page.width });
        };

        // Stream PDF to client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate-${course.title}.pdf`);
        doc.pipe(res);

        // --- DESIGN ---
        // Border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor('#6366f1').lineWidth(5).stroke();

        // Content
        doc.moveDown(2);
        centerText('CERTIFICATE OF COMPLETION', 100, 30, 'Helvetica-Bold');
        
        centerText('This is to certify that', 160, 15);
        
        doc.fillColor('#6366f1');
        centerText(user.name, 190, 40, 'Helvetica-Bold');
        doc.fillColor('black');

        centerText('has successfully completed the course', 250, 15);
        
        doc.fillColor('#121212');
        centerText(course.title, 280, 25, 'Helvetica-Bold');
        
        centerText(`Instructor: ${course.instructorId.name}`, 330, 15);
        
        centerText(`Date: ${new Date().toLocaleDateString()}`, 450, 12);
        
        doc.end();

    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ... (Existing Buy Route logic remains here) ...
// 6. BUY COURSE (Existing Code)
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

// ... (Existing My Status Route) ...
router.get('/my-status/:learnerId', async (req, res) => {
    try {
        const txs = await Transaction.find({ learnerId: req.params.learnerId }).sort({ createdAt: -1 });
        res.json(txs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;