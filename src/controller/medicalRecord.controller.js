import { MedicalRecord } from '../models/medicalRecord.model.js';

export const createRecord = async (req, res) => {
  try {
    const recordData = { ...req.body };
    
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      recordData.fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      if (!recordData.fileName) {
        recordData.fileName = req.file.originalname;
      }
    }

    const record = await MedicalRecord.create(recordData);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
