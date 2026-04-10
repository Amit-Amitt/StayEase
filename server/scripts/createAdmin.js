const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: './.env' }); // To allow running from server/scripts

const setupAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const adminExists = await User.findOne({ email: 'admin@stayease.com' });

    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit();
    }

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@stayease.com',
      password: 'adminpassword123',
      role: 'admin'
    });

    console.log(`Admin User Created!\nEmail: ${adminUser.email}\nPassword: adminpassword123`);
    process.exit();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

setupAdmin();
