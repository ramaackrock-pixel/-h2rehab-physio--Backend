import mongoose from 'mongoose';
import { Service } from './models/service.model.js';
import dotenv from 'dotenv';

dotenv.config();

const servicesToSeed = [
    {
        category: 'CONSULTATION',
        subServices: [
            'Diet Consultation',
            'Physio Consultation',
            'Gynae Consultation',
            'Ortho Consultation',
            'General Consultation'
        ]
    },
    {
        category: 'Osteopathy',
        subServices: [
            'Osteopathy Treatment'
        ]
    },
    {
        category: 'Chiropractic',
        subServices: [
            'General Chiro + Specific Chiro'
        ]
    },
    {
        category: 'Physiotherapy',
        subServices: [
            'Robotic Spinal Decompression',
            'Robotic Knee Decompression',
            'PEMF (HP-EMT)',
            'Shockwave',
            'Laser - Class IV',
            'Laser - Class III',
            'IFC + TENS',
            'Ultrasound + Combo',
            'Rehab',
            'Myofascial Release (MFR)',
            'Myokinetics'
        ]
    },
    {
        category: "Women's Health",
        subServices: [
            'Infertility Treatment',
            'Scar Adhesion Release',
            'Pelvic Floor Assessment',
            'Urinary Incontinence Management',
            'Endometriosis Treatment',
            'PCOS (PCOD Management)',
            'Pelvic Organ Prolapse',
            'Constipation',
            'Vaginismus Treatment',
            'Post Natal Management'
        ]
    },
    {
        category: 'LAB',
        subServices: [
            'General Lab Test'
        ]
    }
];

const seedServices = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pysio');
        console.log('Connected to database for seeding services...');

        for (const s of servicesToSeed) {
            await Service.findOneAndUpdate(
                { category: s.category },
                s,
                { upsert: true, new: true }
            );
            console.log(`Seeded/Updated category: ${s.category}`);
        }

        console.log('Services seeding completed.');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding services:', error);
    }
};

seedServices();
