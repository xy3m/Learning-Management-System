const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Transaction = require('./models/Transaction');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms_shadow_db')
  .then(async () => {
    console.log("🔌 Connected to DB...");

    // The IDs from your screenshot
    const idsToDelete = [
        '69359fd81504a46068a2cebb', // The one with missing learner
        '69366a13f425364fbf90d095'  // The refunded 'pranto' one
    ];

    try {
        const result = await Transaction.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`✅ Successfully deleted ${result.deletedCount} transaction(s).`);
    } catch (err) {
        console.error("❌ Error deleting:", err);
    }

    process.exit();
  })
  .catch(err => {
      console.log("❌ DB Connection Error:", err);
      process.exit(1);
  });