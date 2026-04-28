import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Admin } from './models/admin.model.js';

dotenv.config({ path: './.env' });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        const users = [
            {
                name: 'Super Admin',
                email: 'superadmin@gmail.com',
                password: 'superadmin123',
                role: 'superadmin'
            },
            {
                name: 'Admin',
                email: 'admin@gmail.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                name: 'Staff',
                email: 'staff@gmail.com',
                password: 'staff123',
                role: 'staff'
            }
        ];

        for (const userData of users) {
            const existingUser = await Admin.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`User ${userData.email} already exists. Updating...`);
                existingUser.password = userData.password;
                existingUser.role = userData.role;
                existingUser.name = userData.name;
                await existingUser.save();
            } else {
                const newUser = new Admin(userData);
                await newUser.save();
                console.log(`User ${userData.email} created successfully.`);
            }
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
