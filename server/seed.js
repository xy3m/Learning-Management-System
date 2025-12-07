const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("DB Connected. Seeding...");

    // 1. Clear existing users (Optional: Comment out if you want to keep them)
    // await User.deleteMany({}); 

    // 2. Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@lms.com' });
    if (adminExists) {
        console.log("Admin already exists.");
        process.exit();
    }

    // 3. Create Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
        name: 'Super Admin',
        email: 'admin@lms.com',
        password: hashedPassword,
        role: 'lms-admin' 
    });

    await admin.save();
    console.log("Admin Created: admin@lms.com / admin123");
    process.exit();
  })
  .catch(err => console.log(err));