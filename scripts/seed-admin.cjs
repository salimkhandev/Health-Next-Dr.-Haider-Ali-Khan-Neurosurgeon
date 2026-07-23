const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://salimkhandev-mydb:EzoVyYElNz203QFT@ac-3rpsnfb-shard-00-00.7js7std.mongodb.net:27017,ac-3rpsnfb-shard-00-01.7js7std.mongodb.net:27017,ac-3rpsnfb-shard-00-02.7js7std.mongodb.net:27017/ilmpath_dev?authSource=admin&tls=true&appName=Cluster0';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await mongoose.connection.collection('users').findOne({ email: 'admin@gmail.com' });
  if (existing) {
    console.log('Admin already exists — skipping.');
    process.exit(0);
  }

  const hash = await bcrypt.hash('Admin@1234', 10);
  await mongoose.connection.collection('users').insertOne({
    name: 'Admin',
    email: 'admin@gmail.com',
    passwordHash: hash,
    role: 'admin',
    status: 'paid',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Admin user created!');
  console.log('  Email:    admin@gmail.com');
  console.log('  Password: Admin@1234');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
