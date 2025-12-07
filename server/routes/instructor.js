const router = require('express').Router();
const Course = require('../models/Course');
const Bank = require('../models/Bank');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({
  cloud_name: 'dlzzvvz08', 
  api_key: '588968161895387', 
  api_secret: 'uF2qMtUHQ3WPpwffX2-YACE8l7A'
});

// --- IMPROVED PUBLIC ID HELPER ---
// Correctly extracts "folder/filename" from the URL
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    try {
        // This Regex looks for the part after "/upload/" and ignores the version number (e.g., v12345/)
        // It captures everything until the file extension (.mp4, .jpg)
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
        const match = url.match(regex);
        
        if (match && match[1]) {
            console.log(`Extracted Public ID: ${match[1]}`); // Debug log
            return match[1];
        }
        return null;
    } catch (err) {
        console.error("Error parsing public ID", err);
        return null;
    }
};

// 1. Upload/Update Course (Step 2: Final Submission)
router.post('/upload', async (req, res) => {
  const { title, description, price, instructorId, classes } = req.body;

  try {
    // If updating, we might want to find existing and update, 
    // but for this "Wizard" style, creating new or overwriting is fine for the simulation.
    // Ideally, check if course ID exists to update, otherwise create new.
    
    const newCourse = new Course({
      title,
      description,
      price,
      instructorId,
      status: 'pending',
      classes: classes 
    });
    
    await newCourse.save();

    res.status(201).json({ 
      message: "Course submitted successfully! Pending Admin Approval.", 
      course: newCourse 
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get My Courses
router.get('/my-courses/:instructorId', async (req, res) => {
  try {
    const courses = await Course.find({ instructorId: req.params.instructorId });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE MEDIA (Used during Edit/Replace)
router.post('/delete-media', async (req, res) => {
  const { url, resourceType } = req.body; 

  if (!url) return res.status(400).json({ message: "No URL provided" });

  try {
    const publicId = getPublicIdFromUrl(url);
    if (publicId) {
      console.log(`ATTEMPTING DELETE: ${publicId}`); // Log what we are trying to delete
      
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType || 'video' });
      
      console.log("Cloudinary Result:", result); // Log the result (should be 'ok')
      
      if (result.result === 'ok') {
          return res.json({ message: "Old media deleted successfully" });
      } else {
          return res.status(500).json({ message: "Cloudinary failed to delete", result });
      }
    }
    res.status(400).json({ message: "Could not extract Public ID" });
  } catch (err) {
    console.error("Delete Media Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE ENTIRE COURSE
router.delete('/delete/:courseId', async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });
  
      console.log(`Deleting course: ${course.title}`);

      // Loop through classes and clean up files
      for (const cls of course.classes) {
          if (cls.video) {
              const publicId = getPublicIdFromUrl(cls.video);
              if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
          }
          if (cls.audio) {
              const publicId = getPublicIdFromUrl(cls.audio);
              if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
          }
      }
  
      await Course.findByIdAndDelete(req.params.courseId);
  
      res.json({ message: "Course and media deleted successfully" });
    } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).json({ error: err.message });
    }
});

module.exports = router;