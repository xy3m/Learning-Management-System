const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Changed to bcryptjs to match package.json dependencies
const User = require('./models/User');
const Bank = require('./models/Bank');

dotenv.config();

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms_shadow_db')
  .then(() => console.log("DB Connected for Seeding..."))
  .catch(err => console.log(err));

const seedAdmin = async () => {
  try {
    // 1. Check if Admin Exists
    let admin = await User.findOne({ role: 'lms-admin' });

    if (!admin) {
      console.log("Creating new Admin...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      admin = new User({
        name: "Super Admin",
        email: "admin@lms.com",
        password: hashedPassword,
        role: "lms-admin"
      });
      await admin.save();
      console.log("✅ Admin User Created.");
    } else {
      console.log("ℹ️  Admin User already exists.");
    }

    // 2. Check if Admin has a Bank Account
    if (!admin.bankAccountId) {
      console.log("⚠️  Admin has no bank account. Creating one...");
      
      const newBank = new Bank({
        ownerId: admin._id,
        accountName: "LMS Treasury Vault", // <--- ADDED REQUIRED FIELD
        balance: 10000, 
        accountNumber: "ADMIN-VAULT-001",
        secret: "admin-secret"
      });
      
      const savedBank = await newBank.save();
      
      // Link it back to Admin
      admin.bankAccountId = savedBank._id;
      await admin.save();
      
      console.log("✅ Admin Bank Account Created & Linked.");
    } else {
      console.log("ℹ️  Admin Bank Account already exists.");
    }

    process.exit();
    
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seedAdmin();