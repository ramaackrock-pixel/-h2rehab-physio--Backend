import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true
  },
  pid: {
    type: String,
    required: true
  },
  recordType: {
    type: String,
    enum: ['X-RAY', 'MRI', 'PRESCRIPTION', 'REPORT', 'OTHER'],
    default: 'REPORT'
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String
  },
  uploadedDate: {
    type: String,
    default: () => new Date().toLocaleDateString('en-IN')
  },
  doctor: {
    type: String,
    required: true
  },
  branch: {
    type: String
  },
  notes: {
    type: String
  }
}, { timestamps: true });

export const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
