const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body; // Removed 'role' from input
    
    // Check existing
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // FORCE ROLE TO LEARNER
    const user = new User({ 
        name, 
        email, 
        password: hashedPassword, 
        role: 'learner' 
    });
    
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, bankAccountId: user.bankAccountId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin creates Instructor
router.post('/create-instructor', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newInstructor = new User({
    name,
    email,
    password: hashedPassword,
    role: 'instructor'
  });

  try {
    await newInstructor.save();
    res.status(201).json({ message: "Instructor created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;