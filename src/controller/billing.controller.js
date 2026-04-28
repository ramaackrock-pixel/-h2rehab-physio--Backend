import { Billing } from '../models/billing.model.js';
import { Patient } from '../models/patient.model.js';

// Create a new invoice
export const createInvoice = async (req, res) => {
    try {
        const { patientId, totalAmount, paidAmount, status } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        const dueAmount = totalAmount - (paidAmount || 0);

        const billing = new Billing({
            patientId,
            patientName: patient.name,
            totalAmount,
            paidAmount: paidAmount || 0,
            dueAmount,
            status: status || 'PENDING',
            initials: patient.initials,
            initialsBg: patient.initialsBg
        });

        await billing.save();

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            billing
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error creating invoice",
            error: error.message
        });
    }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
    try {
        const { status, patientId } = req.query;
        let query = {};

        if (status) query.status = status;
        if (patientId) query.patientId = patientId;

        const invoices = await Billing.find(query).sort({ date: -1 });

        return res.status(200).json({
            success: true,
            count: invoices.length,
            invoices
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching invoices",
            error: error.message
        });
    }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }
        return res.status(200).json({
            success: true,
            invoice
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching invoice details",
            error: error.message
        });
    }
};

// Update invoice status/payment
export const updateInvoice = async (req, res) => {
    try {
        const { paidAmount, status } = req.body;
        const invoice = await Billing.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        if (paidAmount !== undefined) {
            invoice.paidAmount = paidAmount;
            invoice.dueAmount = invoice.totalAmount - paidAmount;
        }

        if (status) invoice.status = status;

        await invoice.save();

        return res.status(200).json({
            success: true,
            message: "Invoice updated successfully",
            invoice
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating invoice",
            error: error.message
        });
    }
};
