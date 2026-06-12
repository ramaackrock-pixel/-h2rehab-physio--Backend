import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Patient } from './models/patient.model.js';

dotenv.config({ path: './.env' });

const undoMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for Rollback...');

        // We uniquely identify the migrated records using the hardcoded values we just used
        const result = await Patient.deleteMany({
            branch: 'Kilpauk (Main) Branch',
            consultedBy: 'Dr.C.Hariharan'
        });

        console.log(`Successfully reversed the migration! Deleted ${result.deletedCount} patient records.`);
        process.exit(0);
    } catch (error) {
        console.error('Error during rollback:', error);
        process.exit(1);
    }
};

undoMigration();
