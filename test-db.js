require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: 'salimkhandev12@gmail.com' });
  console.log("USER:", user);
  const payments = await db.collection('payments').find({ email: 'salimkhandev12@gmail.com' }).toArray();
  console.log("PAYMENTS:", payments);
  process.exit(0);
}

test();
