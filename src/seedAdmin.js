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
                name: 'Hariharan',
                email: 'hariharan188@gmail.com',
                password: 'password123',
                role: 'superadmin'
            },
            {
                name: 'Sangeetha',
                email: 'sangeephysio08@gmail.com',
                password: 'password123',
                role: 'superadmin'
            },
            {
                name: 'Samy',
                email: 'mr.samyrvs@gmail.com',
                password: 'samy123',
                role: 'admin'
            },
            {
                name: 'Princy',
                email: 'princyprincyprincy879@gmail.com',
                password: 'princy134',
                role: 'admin'
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
