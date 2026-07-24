const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not defined');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const targetEmail = 'alamdar0000@gmail.com';
  const targetPassword = 'alamdar0000';

  const existing = await mongoose.connection.collection('users').findOne({ email: targetEmail });
  if (existing) {
    console.log(`Admin ${targetEmail} already exists — skipping.`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(targetPassword, 10);
  await mongoose.connection.collection('users').insertOne({
    name: 'alamdar0000',
    email: targetEmail,
    passwordHash: hash,
    role: 'admin',
    status: 'paid',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Admin user created!');
  console.log(`  Email:    ${targetEmail}`);
  console.log(`  Password: ${targetPassword}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
