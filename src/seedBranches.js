import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Branch } from './models/branch.model.js';

dotenv.config({ path: './.env' });

const seedBranches = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pysio');
        console.log('Connected to MongoDB');

        const branchesToSeed = [
            {
                name: 'Kilpauk (Main) Branch',
                address: 'No 15/4b kellys road ,Kilpauk ,Chennai 10',
                manager: 'Dr Sangeetha Hariharan',
                phone: '8056174167',
                branchCode: '01'
            },
            {
                name: 'T.Nagar branch',
                address: 'No 52/83 Bazulaah road,T nagar,Chennai 17',
                manager: 'Dr.C.Hariharan',
                phone: '9566244747',
                branchCode: '02'
            },

            {
                name: 'Pallikaranai branch',
                address: 'No 16 , Syndicate Bank Colony,Pallikaranai,Chennai 100',
                manager: 'Dr.C.Hariharan',
                phone: '9566244747',
                branchCode: '03'
            }

        ];

        for (const branch of branchesToSeed) {
            const existingBranch = await Branch.findOne({ name: branch.name });
            if (!existingBranch) {
                await Branch.create(branch);
                console.log(`Branch ${branch.name} seeded.`);
            } else {
                await Branch.findOneAndUpdate({ name: branch.name }, { branchCode: branch.branchCode });
                console.log(`Branch ${branch.name} updated with code ${branch.branchCode}.`);
            }
        }

        console.log('Seeding completed.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding branches:', err);
        process.exit(1);
    }
};

seedBranches();
