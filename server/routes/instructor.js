const router = require('express').Router();
const Course = require('../models/Course');
const Bank = require('../models/Bank');
const User = require('../models/User');
const Transaction = require('../models/Transaction'); 
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dlzzvvz08', 
  api_key: '588968161895387', 
  api_secret: 'uF2qMtUHQ3WPpwffX2-YACE8l7A'
});

const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
        const match = url.match(regex);
        if (match && match[1]) return match[1];
        return null;
    } catch (err) { return null; }
};

// 1. Upload NEW Course
router.post('/upload', async (req, res) => {
  const { title, description, price, instructorId, classes } = req.body;
  try {
    const newCourse = new Course({ title, description, price, instructorId, status: 'pending', classes });
    await newCourse.save();
    res.status(201).json({ message: "Course submitted successfully!", course: newCourse });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. UPDATE Existing Course (Protected)
router.put('/update/:courseId', async (req, res) => {
    try {
        const courseToCheck = await Course.findById(req.params.courseId);
        if (!courseToCheck) return res.status(404).json({ message: "Course not found" });
        
        // --- PROTECTION ---
        if (courseToCheck.status === 'approved') {
            return res.status(403).json({ message: "Cannot edit an approved course." });
        }

        const { title, description, price, classes } = req.body;
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.courseId, 
            { 
                title, 
                description, 
                price, 
                classes,
                status: 'pending' // Re-set to pending after edit
            }, 
            { new: true }
        );
        res.json({ message: "Course updated successfully!", course: updatedCourse });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-courses/:instructorId', async (req, res) => {
  try {
    const courses = await Course.find({ instructorId: req.params.instructorId });
    res.json(courses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/delete-media', async (req, res) => {
  const { url, resourceType } = req.body; 
  if (!url) return res.status(400).json({ message: "No URL" });
  try {
    const publicId = getPublicIdFromUrl(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType || 'video' });
      return res.json({ message: "Deleted" });
    }
    res.status(400).json({ message: "Bad ID" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. DELETE Course (Protected)
router.delete('/delete/:courseId', async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ message: "Not found" });

      // --- PROTECTION ---
      if (course.status === 'approved') {
          return res.status(403).json({ message: "Cannot delete an approved course." });
      }

      for (const cls of course.classes) {
          if (cls.video) {
              const pid = getPublicIdFromUrl(cls.video);
              if (pid) await cloudinary.uploader.destroy(pid, { resource_type: 'video' });
          }
      }
      await Course.findByIdAndDelete(req.params.courseId);
      res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSACTION HISTORY ---
router.get('/my-history/:instructorId', async (req, res) => {
    try {
        const txs = await Transaction.find({ 
            instructorId: req.params.instructorId,
            status: { $nin: ['pending_admin', 'declined_admin', 'refunded'] },
            hiddenByInstructor: { $ne: true }
        })
        .populate('learnerId', 'name email') 
        .populate('courseId', 'title')
        .sort({ createdAt: -1 }); 

        res.json(txs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/transaction-action', async (req, res) => {
    const { transactionId, action } = req.body; 
    try {
        const tx = await Transaction.findById(transactionId);
        if(!tx) return res.status(404).json({ message: "Tx not found" });

        const admin = await User.findOne({ role: 'lms-admin' });
        const instructor = await User.findById(tx.instructorId);
        const learner = await User.findById(tx.learnerId);

        const adminBank = await Bank.findById(admin.bankAccountId);
        const instructorBank = await Bank.findById(instructor.bankAccountId);
        const learnerBank = await Bank.findById(learner.bankAccountId);

        if (action === 'approve') {
            const instructorShare = tx.amount * 0.60;
            adminBank.balance -= instructorShare;
            instructorBank.balance += instructorShare;
            tx.status = 'completed'; 
            tx.adminApprovedAt = tx.adminApprovedAt || new Date(); 
            await adminBank.save();
            await instructorBank.save();
            await tx.save();
            return res.json({ message: `Approved! You received $${instructorShare}.` });
        } 
        else {
            adminBank.balance -= tx.amount;
            learnerBank.balance += tx.amount;
            tx.status = 'declined_instructor'; 
            await adminBank.save();
            await learnerBank.save();
            await tx.save();
            return res.json({ message: "Declined. Learner refunded." });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/clear-history/:instructorId', async (req, res) => {
    try {
        await Transaction.updateMany(
            {
                instructorId: req.params.instructorId,
                status: { $in: ['completed', 'declined_instructor', 'declined'] }
            },
            { $set: { hiddenByInstructor: true } }
        );
        res.json({ message: "History cleared." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;