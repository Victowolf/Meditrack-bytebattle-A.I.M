const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// ✅ Replace with your new MongoDB Atlas connection string
const uri = 'mongodb+srv://murariprayas60:BfpFK8ket2igCWAG@cluster0.4eqagfl.mongodb.net/Cluster0?retryWrites=true&w=majority';

const dbName = 'Cluster0';
const collectionName = 'patients';

// ✅ Connect to DB and return both collection and client for safe closing
async function connectDB() {
  const localClient = new MongoClient(uri);
  await localClient.connect();
  const db = localClient.db(dbName);
  const collection = db.collection(collectionName);
  return { collection, localClient };
}

async function saveVitals(vitalsData) {
  const { localClient } = await connectDB();
  try {
    const db = localClient.db(dbName);
    const vitalsCollection = db.collection('vitals');
    const dataToSave = {
      ...vitalsData,
      submittedAt: new Date()
    };
    await vitalsCollection.insertOne(dataToSave);
  } finally {
    await localClient.close();
  }
}


// ✅ Register patient with file uploads
async function registerPatient(data, files) {
  const { collection, localClient } = await connectDB();

  const patientBlock = {
    PUD: data.PUD,
    password: data.password,
    name: data.name,
    gender: data.gender,
    contactInfo: data.contactInfo,
    birthDate: data.birthDate,
    bloodGroup: data.bloodGroup,
    address: data.address,
    emergencyNumber: data.emergencyNumber,
    email: data.email,
   MedHis: Array.isArray(files) ? files.map(file => ({
  originalname: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  buffer: file.buffer,
})) : []

  };

  await collection.insertOne(patientBlock);
  await localClient.close();
}


// new updated code ror above 
/*async function registerPatient(data, files) {
  const { collection, localClient } = await connectDB();

  // Ensure PUD is always unique, fallback to UUID
  const PUD = data.PUD || `PAT${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 14)}`;

  const patientBlock = {
    PUD,
    password: data.password,
    name: data.name,
    gender: data.gender,
    contactInfo: data.contactInfo,
    birthDate: data.birthDate,
    bloodGroup: data.bloodGroup,
    address: data.address,
    emergencyNumber: data.emergencyNumber,
    email: data.email,
    MedHis: files.map(file => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    }))
  };

  const result = await collection.insertOne(patientBlock);
  console.log('✅ Inserted Patient ID:', result.insertedId);

  await localClient.close();
}
*/

// ✅ Login authentication
async function authenticatePatient(pud, password) {
  const { collection, localClient } = await connectDB();
  const patient = await collection.findOne({ PUD: pud });
  await localClient.close();

  if (!patient) throw new Error('Patient not found');
  if (patient.password !== password) throw new Error('Invalid password');

  return patient;
}

// ✅ Get all patients
async function getAllPatients() {
  const { collection, localClient } = await connectDB();
  const patients = await collection.find({}).toArray();
  await localClient.close();
  return patients;
}

// Save report file in separate 'reports' collection
async function savePatientReport(pud, name, files) {
  const { localClient } = await connectDB();
  const db = localClient.db(dbName);
  const reportsCollection = db.collection('reports');

  const now = new Date();

 const reportDocs = Array.isArray(files) ? files.map(file => ({
  PUD: pud,
  name: name,
  uploadedAt: now,
  originalname: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  buffer: file.buffer
})) : [];

if (reportDocs.length > 0) {
  await reportsCollection.insertMany(reportDocs);
}

  await localClient.close();
}

async function getPatientReports(pud) {
  const { localClient } = await connectDB();
  const db = localClient.db(dbName);
  const reportsCollection = db.collection('reports');

  const reports = await reportsCollection.find({ PUD: pud }).toArray();
  await localClient.close();
  return reports;
}

// --- NEW FUNCTIONS START HERE ---

// ✅ Get the most recent vitals for a patient
async function getLatestVitals(pud) {
    const { localClient } = await connectDB();
    try {
        const db = localClient.db(dbName);
        const vitalsCollection = db.collection('vitals');
        // Find vitals for the patient, sort by date descending, and get the first one
        const latest = await vitalsCollection.find({ pud: pud }).sort({ submittedAt: -1 }).limit(1).toArray();
        return latest[0]; // Returns the document or undefined
    } finally {
        await localClient.close();
    }
}

// ✅ Save the generated prescription PDF to the database
async function savePrescription(prescriptionData) {
    const { localClient } = await connectDB();
    try {
        const db = localClient.db(dbName);
        const prescriptionsCollection = db.collection('prescriptions');
        const dataToSave = {
            pud: prescriptionData.pud,
            doctorName: prescriptionData.doctorName,
             patientName: prescriptionData.patientName,
            generatedAt: new Date(),
            pdfBuffer: Buffer.from(prescriptionData.pdfBase64, 'base64') // Store as a binary buffer
        };
        await prescriptionsCollection.insertOne(dataToSave);
    } finally {
        await localClient.close();
    }
}

// --- NEW FUNCTIONS END HERE ---

// ✅ Save Appointment
async function saveAppointment(data) {
  const { localClient } = await connectDB();
  try {
    const db = localClient.db(dbName);
    const appointmentCollection = db.collection('appointments');

    const appointmentData = {
      ...data,
      bookedAt: new Date()
    };

    await appointmentCollection.insertOne(appointmentData);
  } finally {
    await localClient.close();
  }
}



// ✅ Export functions
module.exports = {
  connectDB, // ✅ This is the one that’s missing!
  registerPatient,
  authenticatePatient,
  getAllPatients,
  dbName,
  savePatientReport,
  collectionName,
  saveVitals,
  getLatestVitals,    // 
  savePrescription, // 
  saveAppointment // 
};



