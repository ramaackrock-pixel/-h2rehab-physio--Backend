import mongoose from 'mongoose';
import { Package } from './models/package.model.js';
import dotenv from 'dotenv';

dotenv.config();

const packagesToSeed = [
    {
        name: 'Spine recovery program',
        sessions: ['10 sessions', '20 sessions', '30 sessions'],
        defaultPrice: 35000
    },
    {
        name: 'Knee recovery program',
        sessions: ['10 sessions', '20 sessions', '30 sessions'],
        defaultPrice: 35000
    },
    {
        name: 'Rehab package',
        sessions: ['15 sessions', '30 sessions'],
        defaultPrice: 35000
    },
    {
        name: 'Fitness package',
        sessions: ['10 sessions', '20 sessions'],
        defaultPrice: 35000
    },
    {
        name: 'Osteopathy package',
        sessions: ['20 sessions', '40 sessions'],
        defaultPrice: 35000
    }
];

const seedPackages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pysio');
        console.log('Connected to database for seeding packages...');

        for (const p of packagesToSeed) {
            await Package.findOneAndUpdate(
                { name: p.name },
                p,
                { upsert: true, new: true }
            );
            console.log(`Seeded/Updated package: ${p.name}`);
        }

        console.log('Packages seeding completed.');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding packages:', error);
    }
};

seedPackages();
