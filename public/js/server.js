const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const PDFDocument = require('pdfkit'); // Import pdfkit
const { ObjectId } = require('mongodb');
const app = express();
app.use(cors());
app.use(express.json()); // <--- ADD THIS: Required to parse JSON request body
app.use(express.urlencoded({ extended: true })); // Optional: For form data

// chatbot.
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyBoo494rQMJdthjGYAQDz-H4JWTYqA2jxc'); // Replace with your API key

app.post('/gemini', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(userMessage);
        const response = result.response.text();

        res.json({ reply: response });
    } catch (err) {
        console.error('Gemini API error:', err);
        res.status(500).json({ error: 'Failed to fetch Gemini response' });
    }
});


const {
    registerPatient,
    authenticatePatient,
    getAllPatients,
    connectDB,
    dbName,
    savePatientReport,
    saveVitals,
    getLatestVitals,
    savePrescription,
} = require('./mongodb');


const PORT = 3000;

// Middleware
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// ✅ Register a new patient and store files
app.post('/api/register', upload.array('files'), async (req, res) => {
    try {
        const patientData = JSON.parse(req.body.data);
        const files = req.files;

        await registerPatient(patientData, files);
        await savePatientReport(patientData.PUD, patientData.name, files);

        res.status(200).json({ message: 'Patient registered successfully' });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to register patient' });
    }
});

// ✅ Patient login
app.post('/api/patient-login', async (req, res) => {
    try {
        const { pud, password } = req.body;
        const patient = await authenticatePatient(pud, password);

        res.status(200).json({
            message: 'Login successful',
            name: patient.name,
            PUD: patient.PUD
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(401).json({ error: err.message });
    }
});

// ✅ Get all registered patients
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await getAllPatients();
        console.log('📥 Patients fetched:', patients.map(p => p.PUD));
        res.status(200).json({ patients });
    } catch (err) {
        console.error('Error fetching patients:', err.message);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// ✅ Get patient details by PUD
app.get('/api/patient/:pud', async (req, res) => {
    const { pud } = req.params;

    try {
        const { collection, localClient } = await connectDB();
        const patient = await collection.findOne({
            $or: [
                { PUD: pud },
                { name: { $regex: new RegExp(`^${pud}$`, 'i') } }
            ]
        });


        if (!patient) {
            await localClient.close();
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Sanitize MedHis file buffer before sending
        if (patient.MedHis && Array.isArray(patient.MedHis)) {
            patient.MedHis = patient.MedHis.map(file => ({
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            }));
        }

        await localClient.close();
        res.status(200).json(patient);
    } catch (err) {
        console.error('❌ Error fetching patient by PUD:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ✅ Get metadata of all reports for a patient
app.get('/api/reports/:pud', async (req, res) => {
    const { pud } = req.params;

    try {
        const { localClient } = await connectDB();
        const db = localClient.db(dbName);
        const reportsCollection = db.collection('reports');

        const reports = await reportsCollection
            .find({ PUD: pud })
            .sort({ uploadedAt: -1 })
            .toArray();

        const sanitized = reports.map(file => ({
            _id: file._id, // Include the ID for download links
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: file.uploadedAt
        }));

        await localClient.close();
        res.status(200).json(sanitized);
    } catch (err) {
        console.error('Error fetching reports:', err.message);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// ✅ Download a specific report file by its ID
app.get('/api/reports/:pud/file/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { localClient } = await connectDB();
        const db = localClient.db(dbName);
        const report = await db.collection('reports').findOne({ _id: new ObjectId(id) });

        if (!report || !report.buffer) {
            await localClient.close();
            return res.status(404).json({ error: 'Report file not found' });
        }

        const binaryBuffer = report.buffer.buffer || report.buffer;

        res.setHeader('Content-Type', report.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${report.originalname}"`);
        res.send(binaryBuffer);

        await localClient.close();
    } catch (err) {
        console.error('Report download error:', err.message);
        res.status(500).json({ error: 'Server error during report download' });
    }
});


// ✅ Download a specific prescription PDF
app.get('/api/prescriptions/:pud/file/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { localClient } = await connectDB();
        const db = localClient.db(dbName);

        // Find the prescription by its unique _id
        const prescription = await db.collection('prescriptions').findOne({ _id: new ObjectId(id) });
        await localClient.close();

        if (!prescription || !prescription.pdfBase64) {
            return res.status(404).json({ error: 'Prescription PDF not found' });
        }

        // Decode the base64 string into a binary buffer
        const pdfBuffer = Buffer.from(prescription.pdfBase64, 'base64');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="prescription-${id}.pdf"`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error('Prescription download error:', err.message);
        res.status(500).json({ error: 'Server error while downloading prescription' });
    }
});


// ✅ Get all bills for a patient
app.get('/api/bills/:pud', async (req, res) => {
    const { pud } = req.params;
    try {
        const { localClient } = await connectDB();
        const db = localClient.db(dbName);
        const bills = await db.collection('bills').find({ pud }).sort({ date: -1 }).toArray();
        await localClient.close();
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bills' });
    }
});

// ----------------- NEW BILL DOWNLOAD ROUTE (GENERATES PDF ON-DEMAND) -----------------
// ✅ Download a specific bill as a PDF
app.get('/api/bills/:pud/file/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { localClient } = await connectDB();
        const db = localClient.db(dbName);

        // Find the bill by its unique _id
        const bill = await db.collection('bills').findOne({ _id: new ObjectId(id) });
        await localClient.close();

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // --- PDF Generation using PDFKit ---
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set headers to stream the PDF to the client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice-${bill.invoiceNo || id}.pdf"`);

        // Pipe the PDF document directly to the response
        doc.pipe(res);

        // --- Add Content to the PDF ---
        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Invoice', { align: 'center' });
        doc.moveDown();

        // Patient Details
        doc.fontSize(12).font('Helvetica').text(`Invoice No: ${bill.invoiceNo || 'N/A'}`);
        doc.text(`Date: ${new Date(bill.date).toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Patient Name: ${bill.name}`);
        doc.text(`Patient ID: ${bill.pud}`);
        doc.moveDown(2);

        // --- Services Table ---
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Service / Item', 50, tableTop);
        doc.text('Qty', 280, tableTop, { width: 50, align: 'right' });
        doc.text('Unit Price', 350, tableTop, { width: 80, align: 'right' });
        doc.text('Total', 450, tableTop, { width: 90, align: 'right' });
        doc.moveDown();

        // Table Body
        doc.font('Helvetica');
        bill.services.forEach(item => {
            const y = doc.y;
            doc.text(item.description, 50, y, { width: 220 });
            doc.text(item.quantity, 280, y, { width: 50, align: 'right' });
            doc.text(parseFloat(item.unitPrice).toFixed(2), 350, y, { width: 80, align: 'right' });
            doc.text(parseFloat(item.total).toFixed(2), 450, y, { width: 90, align: 'right' });
            doc.moveDown(0.7);
        });

        // --- Totals Section ---
        const totalsY = doc.y > 650 ? 50 : doc.y + 20; // Check if new page is needed
        if (doc.y > 650) doc.addPage();

        doc.font('Helvetica');
        doc.text('Subtotal:', 350, totalsY, { width: 80, align: 'right' });
        doc.font('Helvetica-Bold').text(parseFloat(bill.subtotal).toFixed(2), 450, totalsY, { width: 90, align: 'right' });

        doc.moveDown(0.5);
        doc.font('Helvetica').text(`GST (${bill.gstPercentage || 0}%):`, 350, doc.y, { width: 80, align: 'right' });
        doc.font('Helvetica-Bold').text(parseFloat(bill.gstAmount).toFixed(2), 450, doc.y, { width: 90, align: 'right' });

        doc.moveDown(0.5);
        doc.font('Helvetica').text('Total Amount:', 350, doc.y, { width: 80, align: 'right' });
        doc.font('Helvetica-Bold').text(parseFloat(bill.finalAmount).toFixed(2), 450, doc.y, { width: 90, align: 'right' });
        
        doc.moveDown(0.5);
        doc.font('Helvetica').text('Amount Paid:', 350, doc.y, { width: 80, align: 'right' });
        doc.font('Helvetica-Bold').text(parseFloat(bill.amountPaid).toFixed(2), 450, doc.y, { width: 90, align: 'right' });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Balance Due:', 350, doc.y, { width: 80, align: 'right' });
        doc.text(parseFloat(bill.balanceDue).toFixed(2), 450, doc.y, { width: 90, align: 'right' });


        // Finalize the PDF and end the stream
        doc.end();

    } catch (err) {
        console.error('Bill download/generation error:', err.message);
        res.status(500).json({ error: 'Server error while generating bill PDF' });
    }
});
// ----------------- END OF NEW BILL DOWNLOAD ROUTE -----------------

app.post('/api/upload-report', upload.array('report'), async (req, res) => {
    try {
        const { pud, name } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No report files uploaded.' });
        }

        await savePatientReport(pud, name, files);
        res.status(200).json({ message: 'Report uploaded successfully.' });
    } catch (err) {
        console.error('Upload report error:', err.message);
        res.status(500).json({ error: 'Report upload failed' });
    }
});





// ✅ Upload a new report for an existing patient
/*app.post('/api/upload-report', upload.array('report'), async (req, res) => {
    try {
        const { pud, name } = req.body;
        await savePatientReport(pud, name, req.file);
        res.status(200).json({ message: 'Report uploaded successfully.' });
    } catch (err) {
        console.error('Upload report error:', err.message);
        res.status(500).json({ error: 'Report upload failed' });
    }
});
*/
// ✅ Save a new bill
app.post('/api/save-bill', async (req, res) => {
    try {
        const { localClient } = await connectDB();
        const db = localClient.db(dbName);
        const billsCollection = db.collection('bills');

        await billsCollection.insertOne(req.body);
        await localClient.close();
        res.status(200).json({ message: 'Bill saved to database.' });
    } catch (err) {
        console.error('Save bill error:', err.message);
        res.status(500).json({ error: 'Failed to save bill' });
    }
});

// ✅ Save patient vitals
app.post('/api/save-vitals', async (req, res) => {
    try {
        await saveVitals(req.body);
        res.status(200).json({ message: 'Vitals saved successfully' });
    } catch (err) {
        console.error('Save vitals error:', err.message);
        res.status(500).json({ error: 'Failed to save vitals' });
    }
});

// ✅ Get latest vitals for a specific patient
app.get('/api/vitals/:pud/latest', async (req, res) => {
    try {
        const { pud } = req.params;
        const vitals = await getLatestVitals(pud);
        if (vitals) {
            res.status(200).json(vitals);
        } else {
            res.status(404).json({ message: 'No vitals found for this patient.' });
        }
    } catch (err) {
        console.error('Get latest vitals error:', err.message);
        res.status(500).json({ error: 'Failed to get vitals' });
    }
});

// ✅ Save a generated prescription
app.post('/api/save-prescription', async (req, res) => {
    try {
        await savePrescription(req.body); // Body should contain { pud, doctorName, pdfBase64 }
        res.status(200).json({ message: 'Prescription saved successfully' });
    } catch (err) {
        console.error('Save prescription error:', err.message);
        res.status(500).json({ error: 'Failed to save prescription' });
    }
});



// ✅ Book an appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const appointmentData = req.body;
    if (!appointmentData.name || !appointmentData.pud || !appointmentData.date || !appointmentData.time) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    await saveAppointment(appointmentData);
    res.status(200).json({ message: 'Appointment booked successfully' });
  } catch (err) {
    console.error('Appointment booking error:', err.message);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});




// ✅ Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});