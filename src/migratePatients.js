import mongoose from 'mongoose';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import { Patient } from './models/patient.model.js';
import { Branch } from './models/branch.model.js';

dotenv.config({ path: './.env' });

function excelDateToJSDate(serial) {
    if (!serial) return new Date();
    // Excel dates start from Jan 1, 1900.
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

function getInitials(name) {
    if (!name) return 'UNK';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

const migratePatients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for Migration...');

        // Verify Branch Exists
        const branchName = 'Kilpauk (Main) Branch';
        const branchDoc = await Branch.findOne({ name: branchName });
        if (!branchDoc) {
            console.error(`Branch ${branchName} not found in DB! Please check the name.`);
            process.exit(1);
        }
        
        const branchCode = branchDoc.branchCode;

        // Read Excel
        const workbook = xlsx.readFile('../old patient record.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(`Found ${data.length} records in Excel.`);

        // Find last PID for this branch to continue sequence
        const lastPatient = await Patient.findOne({
            branch: branchName,
            pid: new RegExp(`^H2F-${branchCode}-\\d{4}$`, 'i')
        }).sort({ pid: -1 });

        let nextSeq = 1;
        if (lastPatient) {
            const parts = lastPatient.pid.split('-');
            const lastSeq = parseInt(parts[2], 10);
            if (!isNaN(lastSeq)) {
                nextSeq = lastSeq + 1;
            }
        }

        const newPatients = [];

        for (const row of data) {
            // Generate PID
            const formattedSeq = String(nextSeq).padStart(4, '0');
            const pid = `H2F-${branchCode}-${formattedSeq}`;
            nextSeq++;

            // Handle date
            const visitDate = typeof row['DATE/DAY'] === 'number' ? excelDateToJSDate(row['DATE/DAY']) : new Date();

            const patientData = {
                name: row['NAME'] ? String(row['NAME']).trim() : 'Unknown Patient',
                pid: pid,
                demographics: row['AGE/GENDER'] ? String(row['AGE/GENDER']).trim() : 'Unknown',
                contact: row['PHONE NO.'] ? String(row['PHONE NO.']).trim() : '0000000000',
                address: row['ADDRESS'] ? String(row['ADDRESS']).trim() : '',
                occupation: row['OCCUPATION'] ? String(row['OCCUPATION']).trim() : '',
                source: row['REFERENCE SOURCE'] ? String(row['REFERENCE SOURCE']).trim() : '',
                branch: branchName,
                consultedBy: 'Dr.C.Hariharan',
                assignedDoctor: 'Dr.C.Hariharan',
                status: 'ACTIVE',
                whatsappConsent: true,
                lastVisit: visitDate,
                createdAt: visitDate,
                assessmentType: 'GENERAL',
                assignments: [],
                conditions: [],
                initials: getInitials(row['NAME']),
            };

            // Push pain area into conditions and anatomy map (general assessment)
            if (row['PAIN AREA']) {
                const painArea = String(row['PAIN AREA']).trim();
                patientData.conditions.push(painArea);
                
                // Add to Human Anatomy in General Assessment
                patientData.assessmentData = {
                    physical: {
                        painPoints: [painArea]
                    }
                };
            }

            newPatients.push(patientData);
        }

        // Insert in bulk
        console.log(`Inserting ${newPatients.length} patients...`);
        // Using insertMany for performance
        await Patient.insertMany(newPatients);
        
        console.log('Migration Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
};

migratePatients();
