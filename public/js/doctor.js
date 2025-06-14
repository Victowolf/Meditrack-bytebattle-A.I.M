// Initialize jsPDF as a global variable
const { jsPDF } = window.jspdf;
let selectedPatient = null;

function getAgeFromDOB(dobString) {
  if (!dobString) return 'N/A';
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// State
let medications = [];
let labTests = [];
let instructions = '';
let followUp = '3 months';
let patients = [];
let diagnosis = '';
let vitals = null;



// DOM Elements
let saveBtn, previewBtn, downloadBtn, clearBtn, assistantBtn, reportBtn;
let patientListEl, patientDetailsEl, prescriptionContainerEl;
let pdfModal, pdfPreview, closeModalBtn, modalCloseBtn, modalDownloadBtn;
let toast, toastMessage;
let chatbotContainer, chatbotHeader, closeChatbotBtn, chatForm, chatInput, chatMessages;
let reportModal, reportCloseBtn, reportModalCloseBtn, reportFilesContainer;


// Doctor info
const doctor = {
  id: 1,
  name: 'Dr. Jighyanshu Kumar',
  specialty: 'Physician',
  username: 'doctor'
};

document.addEventListener('DOMContentLoaded', function() {
  // Initialize DOM elements
  saveBtn = document.getElementById('save-prescription-btn');
  previewBtn = document.getElementById('preview-btn');
  downloadBtn = document.getElementById('download-btn');
  clearBtn = document.getElementById('clear-prescription-btn');
  assistantBtn = document.getElementById('assistant-btn');
  reportBtn = document.getElementById('report-view-btn');

  // FIX: Assumed patientListEl targets a dedicated list container.
  // Ensure your HTML has an element like <div id="patient-list-area"></div>
  patientListEl = document.getElementById('patient-list-area');
  patientDetailsEl = document.getElementById('patient-details'); // This remains for patient specific details view

  prescriptionContainerEl = document.getElementById('prescription-form');
  pdfModal = document.getElementById('pdf-modal');
  pdfPreview = document.getElementById('pdf-preview');
  closeModalBtn = document.getElementById('close-modal-btn');
  modalCloseBtn = document.getElementById('modal-close-btn');
  modalDownloadBtn = document.getElementById('modal-download-btn');
  toast = document.getElementById('toast');
  toastMessage = document.getElementById('toast-message');
  chatbotContainer = document.getElementById('chatbot-container');
  chatbotHeader = document.getElementById('chatbot-header');
  closeChatbotBtn = document.getElementById('close-chatbot-btn');
  chatForm = document.getElementById('chat-form');
  chatInput = document.getElementById('chat-input');
  chatMessages = document.getElementById('chat-messages');
  reportModal = document.getElementById('report-modal');
  reportCloseBtn = document.getElementById('close-report-btn');
  reportModalCloseBtn = document.getElementById('report-modal-close-btn');
  reportFilesContainer = document.getElementById('report-files-container');

  // Fetch patients data
  fetch('http://localhost:3000/api/patients')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      patients = data.patients;
      console.log('Fetched patients:', patients);
      initialize();
    })
    .catch(error => {
      console.error('Error fetching patients:', error);
      showToast('Error fetching patients. Please check console.', 5000);
      // Initialize with empty state or fallback if patient list is crucial
      initialize(); // Or a specific error state initialization
    });
});

// Function to show toast messages
function showToast(message, duration = 3000) {
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  } else {
    // Fallback if toast elements are not in the DOM
    console.warn('Toast UI elements not found. Message:', message);
    alert(message); // Simple alert as a fallback
  }
}

// Function to enable action buttons
function enableAllActionButtons() {
  if (saveBtn) saveBtn.disabled = false;
  if (previewBtn) previewBtn.disabled = false;
  if (downloadBtn) downloadBtn.disabled = false;
}

// Add this function to refresh patient list
async function refreshPatientList() {
  try {
    const response = await fetch('http://localhost:3000/api/patients');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    patients = data.patients;
    renderPatientList();
  } catch (error) {
    console.error('Failed to refresh patient list:', error);
    showToast('Failed to refresh patient list.', 5000);
  }
}

async function fetchLatestVitals(pud) {
  try {
    const response = await fetch(`http://localhost:3000/api/vitals/${pud}/latest`);
    if (!response.ok) throw new Error('No vitals found');
    return await response.json();
  } catch (err) {
    console.error('Vitals fetch error:', err.message);
    return null;
  }
}




// Initialize the application
function initialize() {
  renderPatientList();
  renderEmptyPatientDetails(); // This will show "Select a patient..." in the details area
  renderEmptyPrescription();

  // Event listeners
  if (clearBtn) clearBtn.addEventListener('click', clearPrescription);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closePdfModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closePdfModal);
  if (modalDownloadBtn) modalDownloadBtn.addEventListener('click', downloadPdf);

  // Assistant Button and Close Logic
  if (assistantBtn) {
    assistantBtn.addEventListener('click', () => {
      if (chatbotContainer) {
        chatbotContainer.classList.add('show');
        chatbotContainer.style.left = 'calc(50% - 250px)'; // Center it initially
        chatbotContainer.style.top = '10%';
        chatbotContainer.style.display = 'flex';
      }
    });
  }

  if (closeChatbotBtn) {
    closeChatbotBtn.addEventListener('click', () => {
      if (chatbotContainer) {
        chatbotContainer.classList.remove('show');
        chatbotContainer.style.display = 'none';
      }
    });
  }

  // Chat form submission
if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMsg = chatInput.value.trim();
  if (!userMsg) return;

  addChatMessage('You', userMsg, 'user');
  chatInput.value = '';

  let reportText = '';

  if (selectedPatient && selectedPatient.PUD) {
    try {
      // Step 1: Fetch all reports
      const res = await fetch(`http://localhost:3000/api/reports/${selectedPatient.PUD}`);
      const reports = await res.json();

      // Step 2: Filter .docx only
      const docxReports = reports.filter(file => file.originalname.endsWith('.docx'));

      // Step 3: Read each .docx file as text using mammoth
      const allTexts = await Promise.all(docxReports.map(async (file) => {
        try {
          const fileRes = await fetch(`http://localhost:3000/api/reports/${selectedPatient.PUD}/file/${file._id}`);
          const blob = await fileRes.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          return result.value.trim();
        } catch (err) {
          console.warn(`Could not extract ${file.originalname}:`, err);
          return '';
        }
      }));

      reportText = allTexts.filter(Boolean).join('\n\n---\n\n');
    } catch (err) {
      console.warn("Error loading patient reports:", err);
    }
  }

  // Step 4: Compose prompt with report content
  const prompt = `
you are a health diagnostic assisatant. assist doctor 
in analayzing patient.
Here are the patient's uploaded medical reports:
${reportText || '[No medical report data available]'}

Now answer the user's question:
User: ${userMsg}
`;

  // Step 5: Send prompt to backend
  try {
    const response = await fetch('http://localhost:3000/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: prompt })
    });

    const data = await response.json();
    const reply = data.reply || '⚠️ No response received.';
    addChatMessage('Assistant', reply, 'bot');
  } catch (error) {
    console.error('Error fetching assistant response:', error);
    addChatMessage('Assistant', `⚠️ Failed to get response: ${error.message}`, 'bot');
  }
});
}

  // Make chatbot draggable
  if (chatbotHeader && chatbotContainer) {
    let isDragging = false;
    let offsetX, offsetY;

    chatbotHeader.addEventListener('mousedown', (e) => {
      // Prevent dragging if clicking on the close button itself
      if (e.target === closeChatbotBtn || closeChatbotBtn.contains(e.target)) {
        return;
      }
      isDragging = true;
      offsetX = e.clientX - chatbotContainer.getBoundingClientRect().left;
      offsetY = e.clientY - chatbotContainer.getBoundingClientRect().top;
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
      chatbotContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        chatbotContainer.style.left = `${e.clientX - offsetX}px`;
        chatbotContainer.style.top = `${e.clientY - offsetY}px`;
        // Ensure position is fixed and not relative to initial drag point if it was auto
        chatbotContainer.style.right = 'auto';
        chatbotContainer.style.bottom = 'auto';
        chatbotContainer.style.position = 'fixed';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = 'auto';
        chatbotContainer.style.cursor = 'grab';
      }
    });
    chatbotHeader.style.cursor = 'grab'; // Initial cursor for header
  }

 if (reportBtn) {
  reportBtn.addEventListener('click', async () => {
    if (!selectedPatient || !selectedPatient.PUD) {
      showToast('Please select a patient first');
      return;
    }

    try {
      // STEP 1: Fetch report metadata
      const response = await fetch(`http://localhost:3000/api/reports/${selectedPatient.PUD}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reports (Status ${response.status})`);
      }

      const reportData = await response.json();

      // STEP 2: Render the report list
      if (reportFilesContainer) {
        if (!reportData || reportData.length === 0) {
          reportFilesContainer.innerHTML = '<p>No reports uploaded for this patient.</p>';
        } else {
          reportFilesContainer.innerHTML = '';
          reportData.forEach((file, index) => {
            const fileBlock = document.createElement('div');
            fileBlock.style.marginBottom = '0.75rem';
            fileBlock.innerHTML = `
              <div>
                <strong>Report ${index + 1}:</strong>
                <a href="http://localhost:3000/api/reports/${selectedPatient.PUD}/file/${file._id}" 
                   target="_blank" 
                   style="color: #2563eb; text-decoration: underline;">
                  ${file.originalname}
                </a>
              </div>
              <div>Type: ${file.mimetype}, Size: ${(file.size / 1024).toFixed(2)} KB</div>
              <div>Uploaded on: ${new Date(file.uploadedAt).toLocaleString()}</div>
            `;
            reportFilesContainer.appendChild(fileBlock);
          });
        }
      }

      if (reportModal) reportModal.classList.add('active');
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast('Failed to load reports');
    }
  });
}



  if (reportCloseBtn) {
    reportCloseBtn.addEventListener('click', () => {
      if (reportModal) reportModal.classList.remove('active');
    });
  }

  if (reportModalCloseBtn) {
    reportModalCloseBtn.addEventListener('click', () => {
      if (reportModal) reportModal.classList.remove('active');
    });
  }
}

// Render patient list
function renderPatientList() {
  if (!patientListEl) {
    console.warn("Patient list element not found. Cannot render patient list.");
    return;
  }

  patientListEl.innerHTML = ''; // Clear previous list

  if (patients.length === 0) {
    patientListEl.innerHTML = '<p class="empty-list-message">No patients found.</p>';
    return;
  }

  patients.forEach(patient => {
    const patientItem = document.createElement('div');
    patientItem.className = `patient-item ${selectedPatient && selectedPatient.PUD === patient.PUD ? 'selected' : ''}`;
    patientItem.dataset.pud = patient.PUD;

    patientItem.innerHTML = `
      <div class="patient-name">${patient.name}</div>
      <div class="patient-meta">
        <span class="patient-pud">PUD: ${patient.PUD}</span>
        <span class="patient-gender">Gender: ${patient.gender}</span>
      </div>
    `;

    patientItem.addEventListener('click', () => {
      selectPatient(patient);
    });

    patientListEl.appendChild(patientItem);
  });
}

// Render empty patient details
function renderEmptyPatientDetails() {
  if (!patientDetailsEl) return;

  patientDetailsEl.innerHTML = `
    <div class="patient-details-empty">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <p>Select a patient to view details</p>
      </div>
    </div>
  `;
}

// Render patient details
function renderPatientDetails(patient) {
  if (!patientDetailsEl) return;

  patientDetailsEl.innerHTML = `
    <div class="patient-header">
      <div class="patient-header-info">
        <div class="patient-full-name">${patient.name}</div>
        <div class="patient-id">Patient ID: ${patient.PUD}</div>
        <div class="status-badge ${
          patient.status === 'Critical' ? 'status-critical' :
          patient.status === 'Warning' ? 'status-warning' : 'status-stable'
        }">${patient.status || 'Stable'}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Blood Type</div>
        <div class="info-value">${patient.bloodGroup || 'N/A'}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Age</div>
        <div class="info-value">${getAgeFromDOB(patient.birthDate)}</div>
      </div>
    </div>

    <div class="contact-info">
      <div class="section-title">Contact Information</div>
      <div class="contact-row">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        <span>${patient.contactInfo || 'N/A'}</span>
      </div>
      <div class="contact-row">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${patient.address || 'N/A'}</span>
      </div>
    </div>

    <div class="appointment-info">
      </div>
  `;
}

// Render empty prescription
function renderEmptyPrescription() {
  if (!prescriptionContainerEl) return;

  prescriptionContainerEl.innerHTML = `
    <div class="prescription-empty">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.42 4.58A5.4 5.4 0 0 0 16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 9.25 9.5 10.5 10 10.5s10-1.25 10-10.5V8.5c0-1.45-.62-2.81-1.58-3.92Z"></path>
        </svg>
        <p>Select a patient to write a prescription</p>
      </div>
    </div>
  `;

  // Disable buttons
  if (saveBtn) saveBtn.disabled = true;
  if (previewBtn) previewBtn.disabled = true;
  if (downloadBtn) downloadBtn.disabled = true;
}




// Render prescription form
async function renderPrescriptionForm(patient) {

  if (!prescriptionContainerEl) return;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  vitals = await fetchLatestVitals(patient.PUD);
const bp = vitals?.bp || 'N/A';
const height = vitals?.height || 'N/A';
const weight = vitals?.weight || 'N/A';
const bmi = vitals?.bmi || 'N/A';



  prescriptionContainerEl.innerHTML = `
    <div class="prescription-paper">
      <div class="prescription-header">
        <div class="prescription-hospital">MediCare Health Center</div>
        <div class="prescription-address">123 Medical Avenue, Healthcity, HC 12345</div>
        <div class="prescription-contact">Phone: (123) 456-7890 | Email: info@medicare.com</div>
      </div>

      <div class="prescription-patient-info">
        <div class="prescription-patient">
          <div><span class="prescription-label">Patient:</span> ${patient.name}</div>
          <div><span class="prescription-label">Age/Gender:</span> ${getAgeFromDOB(patient.birthDate)}/${patient.gender}</div>
          <div><span class="prescription-label">Patient ID:</span> ${patient.PUD}</div>
        </div>
        <div class="prescription-date">
          <div><span class="prescription-label">Date:</span> ${currentDate}</div>
          <div><span class="prescription-label">Doctor:</span> ${doctor.name}</div>
        </div>
      </div>

<div class="prescription-section">
  <h4>Vitals</h4>
  <div style="display: flex; justify-content: space-between;">
    <div><strong>BP:</strong> ${bp}</div>
    <div><strong>Height:</strong> ${height} cm</div>
    <div><strong>Weight:</strong> ${weight} kg</div>
    <div><strong>BMI:</strong> ${bmi}</div>
  </div>
</div>

<div class="prescription-section">
  <h4>Diagnosis</h4>
  <textarea id="diagnosis-input" class="textarea" placeholder="Write the diagnosis here..." rows="2"></textarea>
</div>



      <div class="prescription-section">
        <h4>Medications</h4>
        <div id="medication-list" class="medication-list">
          ${renderMedicationItems()}
        </div>
        <div class="form-group">
          <div class="medication-form">
            <input type="text" id="medication-name" class="input" placeholder="Medication name and strength (e.g. Lisinopril 10mg)">
            <textarea id="medication-instructions" class="textarea" placeholder="Instructions (e.g. Take 1 tablet by mouth once daily)" rows="2"></textarea>
            <div class="input-row">
              <input type="text" id="medication-dispense" class="input" placeholder="Dispense amount">
              <input type="text" id="medication-refills" class="input" placeholder="Refills">
            </div>
            <button id="add-medication-btn" class="form-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14" /><path d="M12 5v14" />
              </svg>
              Add Medication
            </button>
          </div>
        </div>
      </div>

      <div class="prescription-section">
        <h4>Lab Tests</h4>
        <div id="lab-test-list" class="lab-test-list">
          ${renderLabTestItems()}
        </div>
        <div class="form-group">
          <div class="lab-test-form">
            <input type="text" id="lab-test-name" class="input" placeholder="Lab test name (e.g. Complete Blood Count)">
            <button id="add-lab-test-btn" class="form-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14" /><path d="M12 5v14" />
              </svg>
              Add Lab Test
            </button>
          </div>
        </div>
      </div>

      <div class="prescription-section">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
            <path d="M9 9h1" /><path d="M9 13h6" /><path d="M9 17h6" />
          </svg>
          <h4>Instructions & Notes</h4>
        </div>
        <textarea id="instructions-input" class="textarea" placeholder="Additional instructions for the patient..." rows="3">${instructions}</textarea>
      </div>

      <div class="signature-area">
        <div>
          <span class="prescription-label">Follow-up in:</span>
          <input type="text" id="follow-up-input" class="input small-input" value="${followUp}">
        </div>
        <div>
          <div class="signature-line"></div>
          <div class="signature-name">${doctor.name}</div>
          <div class="signature-title">Electronic Signature</div>
        </div>
      </div>
    </div>
  `;

  // Enable buttons
  enableAllActionButtons();

  // Add event listeners for this form's elements
  const addMedicationBtn = document.getElementById('add-medication-btn');
  if (addMedicationBtn) addMedicationBtn.addEventListener('click', addMedication);

  const addLabTestBtn = document.getElementById('add-lab-test-btn');
  if (addLabTestBtn) addLabTestBtn.addEventListener('click', addLabTest);

  const instructionsInputEl = document.getElementById('instructions-input');
  if (instructionsInputEl) {
    instructionsInputEl.addEventListener('input', (e) => {
      instructions = e.target.value;
    });
  }

const diagnosisInputEl = document.getElementById('diagnosis-input');
if (diagnosisInputEl) {
  diagnosisInputEl.addEventListener('input', (e) => {
    diagnosis = e.target.value;
  });
}



  const followUpInputEl = document.getElementById('follow-up-input');
  if (followUpInputEl) {
    followUpInputEl.addEventListener('input', (e) => {
      followUp = e.target.value;
    });
  }

  // Re-attach main action button listeners if they were specific to a form context before,
  // or ensure they are general. Here, they are general.
  if (saveBtn && !saveBtn.hasAttribute('listener-attached')) {
     saveBtn.addEventListener('click', savePrescription);
     saveBtn.setAttribute('listener-attached', 'true');
  }
  if (previewBtn && !previewBtn.hasAttribute('listener-attached')) {
     previewBtn.addEventListener('click', previewPdf);
     previewBtn.setAttribute('listener-attached', 'true');
  }
  if (downloadBtn && !downloadBtn.hasAttribute('listener-attached')) {
      downloadBtn.addEventListener('click', downloadPdf);
      downloadBtn.setAttribute('listener-attached', 'true');
  }
}

// Render medication items
function renderMedicationItems() {
  if (medications.length === 0) {
    return '<div class="empty-list-message">No medications added yet</div>';
  }

  return medications.map((med, index) => `
    <div class="medication-item">
      <span class="rx-symbol">Rx</span>
      <div class="medication-details">
        <div class="medication-name">${med.name}</div>
        <div class="medication-instruction">${med.instructions}</div>
        ${med.dispense ? `<div class="medication-dispense">Dispense: ${med.dispense}</div>` : ''}
        ${med.refills ? `<div class="medication-refills">Refills: ${med.refills}</div>` : ''}
      </div>
      <button class="remove-item-btn" onclick="removeMedication(${index})">&times;</button>
    </div>
  `).join('');
}

// Render lab test items
function renderLabTestItems() {
  if (labTests.length === 0) {
    return '<div class="empty-list-message">No lab tests added yet</div>';
  }
  return labTests.map((test, index) => `
    <div class="lab-test-item">
      <span class="test-symbol">🧪</span>
      <div class="lab-test-details">
        <div class="lab-test-name">${test.name}</div>
        ${test.notes ? `<div class="lab-test-notes">Notes: ${test.notes}</div>` : ''}
      </div>
      <button class="remove-item-btn" onclick="removeLabTest(${index})">&times;</button>
    </div>
  `).join('');
}


// Select a patient
async function selectPatient(patient) {
  selectedPatient = patient;
  medications = []; // Clear previous patient's prescription
  labTests = [];
  instructions = '';
  followUp = '3 months';

async function fetchLatestVitals(pud) {
  try {
    const response = await fetch(`http://localhost:3000/api/vitals/${pud}/latest`);
    if (!response.ok) throw new Error('No vitals found');
    return await response.json();
  } catch (err) {
    console.error('Vitals fetch error:', err.message);
    return null;
  }
}



  renderPatientList(); // Re-render list to highlight selection
  renderPatientDetails(patient);
  renderPrescriptionForm(patient);
  enableAllActionButtons();
  await fetchAndSummarizePatient(patient); // Added await if it's async
}

// Add a medication
function addMedication() {
  const nameInput = document.getElementById('medication-name');
  const instructionsInput = document.getElementById('medication-instructions');
  const dispenseInput = document.getElementById('medication-dispense');
  const refillsInput = document.getElementById('medication-refills');

  if (!nameInput || !instructionsInput || !nameInput.value.trim() || !instructionsInput.value.trim()) {
    showToast('Medication name and instructions are required.');
    return;
  }

  const newMedication = {
    name: nameInput.value.trim(),
    instructions: instructionsInput.value.trim(),
    dispense: dispenseInput ? dispenseInput.value.trim() : '',
    refills: refillsInput ? refillsInput.value.trim() : ''
  };

  medications.push(newMedication);

  nameInput.value = '';
  instructionsInput.value = '';
  if (dispenseInput) dispenseInput.value = '';
  if (refillsInput) refillsInput.value = '';

  const medicationListEl = document.getElementById('medication-list');
  if (medicationListEl) {
    medicationListEl.innerHTML = renderMedicationItems();
  }
  showToast('Medication added');
}

// Remove a medication
function removeMedication(index) {
    if (index >= 0 && index < medications.length) {
        medications.splice(index, 1);
        const medicationListEl = document.getElementById('medication-list');
        if (medicationListEl) {
            medicationListEl.innerHTML = renderMedicationItems();
        }
        showToast('Medication removed');
    }
}


// Add a lab test
function addLabTest() {
  const nameInput = document.getElementById('lab-test-name');
  if (!nameInput || !nameInput.value.trim()) {
    showToast('Please provide a lab test name');
    return;
  }
  const newLabTest = {
    name: nameInput.value.trim(),
    // notes: '' // Add notes input if needed
  };
  labTests.push(newLabTest);
  nameInput.value = '';

  const labTestListEl = document.getElementById('lab-test-list');
  if (labTestListEl) {
    labTestListEl.innerHTML = renderLabTestItems();
  }
  showToast('Lab test added');
}

// Remove a lab test
function removeLabTest(index) {
    if (index >= 0 && index < labTests.length) {
        labTests.splice(index, 1);
        const labTestListEl = document.getElementById('lab-test-list');
        if (labTestListEl) {
            labTestListEl.innerHTML = renderLabTestItems();
        }
        showToast('Lab test removed');
    }
}


// Clear prescription form
function clearPrescription() {
  medications = [];
  labTests = [];
  instructions = '';
  followUp = '3 months';

  if (selectedPatient) {
    renderPrescriptionForm(selectedPatient); // Re-render with empty fields
  } else {
    renderEmptyPrescription(); // If no patient selected, show empty state
  }
  showToast('Prescription cleared');
}

// Save prescription (currently just a toast, implement actual save logic)
function savePrescription() {
  if (!selectedPatient) {
    showToast('Please select a patient first');
    return;
  }

  if (medications.length === 0 && labTests.length === 0 && !instructions.trim()) {
    showToast('Prescription is empty. Add medications, lab tests, or instructions before saving.');
    return;
  }

  // TODO: Implement actual saving logic here (e.g., API call)
  // For now, it just simulates a save.
  const prescriptionData = {
    patientId: selectedPatient.PUD,
    doctorId: doctor.id,
    date: new Date().toISOString(),
    medications: medications,
    labTests: labTests,
    instructions: instructions,
    followUp: followUp
  };
  console.log('Saving prescription:', prescriptionData);
  showToast('Prescription saved successfully (simulated)');
}

// Generate PDF data
function generatePdf() {
  if (!selectedPatient) {
    showToast('Please select a patient first');
    return null;
  }

  if (medications.length === 0 && labTests.length === 0 && !instructions.trim()) {
    showToast('Prescription is empty. Add items before generating PDF.');
    return null;
  }

  const pdf = new jsPDF();

  pdf.setProperties({
    title: `Prescription for ${selectedPatient.name}`,
    subject: 'Medical Prescription',
    author: doctor.name,
    creator: 'MediCare Health Center'
  });

  // Header
  pdf.setFontSize(18);
  pdf.setTextColor(59, 130, 246); // Blue
  pdf.text('MediCare Health Center', 105, 20, { align: 'center' });
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99); // Gray
  pdf.text('123 Medical Avenue, Healthcity, HC 12345', 105, 26, { align: 'center' });
  pdf.text('Phone: (123) 456-7890 | Email: info@medicare.com', 105, 32, { align: 'center' });
  pdf.setDrawColor(209, 213, 219); // Light gray line
  pdf.setLineWidth(0.5);
  pdf.line(20, 38, 190, 38);

  // Patient and Doctor Info
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  pdf.setFontSize(10);
  pdf.setTextColor(31, 41, 55); // Dark gray
  pdf.text(`Patient: ${selectedPatient.name}`, 20, 48);
  pdf.text(`Age/Gender: ${getAgeFromDOB(selectedPatient.birthDate)}/${selectedPatient.gender}`, 20, 54);
  pdf.text(`Patient ID: ${selectedPatient.PUD}`, 20, 60);

  pdf.text(`Date: ${currentDate}`, 150, 48);
  pdf.text(`Doctor: ${doctor.name}`, 150, 54);
  pdf.text(`Specialty: ${doctor.specialty}`, 150, 60);
  pdf.line(20, 66, 190, 66);

  let yPos = 76;

  // Diagnosis
if (diagnosis.trim()) {
  if (yPos > 240) { pdf.addPage(); yPos = 20; }
  pdf.setFontSize(12);
  pdf.setTextColor(59, 130, 246);
  pdf.text('Diagnosis:', 20, yPos);
  yPos += 6;
  pdf.setFontSize(10);
  pdf.setTextColor(31, 41, 55);
  const diagnosisLines = pdf.splitTextToSize(diagnosis, 165);
  pdf.text(diagnosisLines, 25, yPos);
  yPos += (diagnosisLines.length * 5) + 5;
}

// Vitals (horizontal with spacing)
if (vitals) {
  if (yPos > 240) { pdf.addPage(); yPos = 20; }
  pdf.setFontSize(12);
  pdf.setTextColor(59, 130, 246);
  pdf.text('Vitals:', 20, yPos);
  yPos += 6;
  pdf.setFontSize(10);
  pdf.setTextColor(31, 41, 55);

  // Horizontal vitals line with consistent spacing
  const vitalsText = [
    `BP: ${vitals.bp || 'N/A'}`,
    `Height: ${vitals.height || 'N/A'} cm`,
    `Weight: ${vitals.weight || 'N/A'} kg`,
    `BMI: ${vitals.bmi || 'N/A'}`
  ].join('     '); // 5 spaces between items

  pdf.text(vitalsText, 25, yPos);
  yPos += 10;
}




  // Medications
  if (medications.length > 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246);
    pdf.text('Medications (Rx):', 20, yPos);
    yPos += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    medications.forEach((med, index) => {
      if (yPos > 260) { pdf.addPage(); yPos = 20; } // Page break
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${med.name}`, 25, yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`   Instructions: ${med.instructions}`, 25, yPos, { maxWidth: 160 });
      yPos += (pdf.splitTextToSize(med.instructions, 160).length * 4) + 2;
      if (med.dispense) { pdf.text(`   Dispense: ${med.dispense}`, 25, yPos); yPos += 5; }
      if (med.refills) { pdf.text(`   Refills: ${med.refills}`, 25, yPos); yPos += 5; }
      yPos += 3; // Spacing between meds
    });
    yPos += 5;
  }

  // Lab Tests
  if (labTests.length > 0) {
    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246);
    pdf.text('Lab Tests:', 20, yPos);
    yPos += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    labTests.forEach((test, index) => {
      if (yPos > 260) { pdf.addPage(); yPos = 20; }
      pdf.text(`${index + 1}. ${test.name}`, 25, yPos);
      yPos += 5;
      // Add notes for lab tests if available
      // if (test.notes) { pdf.text(`   Notes: ${test.notes}`, 25, yPos, { maxWidth: 160 }); yPos += (pdf.splitTextToSize(test.notes, 160).length * 4) + 2; }
    });
    yPos += 5;
  }

  // Instructions
  if (instructions.trim()) {
    if (yPos > 240) { pdf.addPage(); yPos = 20; }
    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246);
    pdf.text('Instructions & Notes:', 20, yPos);
    yPos += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    const instructionLines = pdf.splitTextToSize(instructions, 165);
    pdf.text(instructionLines, 25, yPos);
    yPos += (instructionLines.length * 5) + 5;
  }

  // Follow-up & Signature (ensure it's at the bottom or on new page if needed)
  if (yPos > 250) { pdf.addPage(); yPos = 20; }
  pdf.setFontSize(10);
  pdf.setTextColor(31, 41, 55);
  pdf.text(`Follow-up in: ${followUp}`, 20, yPos);

  const signatureY = Math.max(yPos + 10, 260); // Place signature towards bottom
  if (signatureY > 270 && yPos < 250) { // If other content is short, signature still lower
     // yPos = 260; // for consistency if needed
  } else if (signatureY > 270) { // If content pushes signature off, new page
    pdf.addPage();
    yPos = 30; // Signature position on new page
  } else {
    yPos = signatureY;
  }

  pdf.line(130, yPos, 190, yPos); // Signature line
  yPos += 5;
  pdf.text(doctor.name, 160, yPos, { align: 'center' });
  yPos += 5;
  pdf.setFontSize(8);
  pdf.text('Electronic Signature', 160, yPos, { align: 'center' });

  return pdf;
}

// Preview PDF
function previewPdf() {
  const pdf = generatePdf();
  if (!pdf) return; // generatePdf handles toasts for errors

  const pdfDataUri = pdf.output('datauristring');

  if (pdfPreview) pdfPreview.src = pdfDataUri;
  if (pdfModal) pdfModal.classList.add('active');
}

// Download PDF
function downloadPdf() {
  const pdf = generatePdf();
  if (!pdf) return; // generatePdf handles toasts for errors

  const filenameBase = selectedPatient ? selectedPatient.name.replace(/\s+/g, '_') : 'Patient';
  const dateStr = new Date().toISOString().slice(0, 10);
  pdf.save(`Prescription-${filenameBase}-${dateStr}.pdf`);

// Send to backend to save
const uint8Array = pdf.output('arraybuffer');
const binaryString = String.fromCharCode(...new Uint8Array(uint8Array));
const pdfBase64 = btoa(binaryString);


fetch('http://localhost:3000/api/save-prescription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pud: selectedPatient.PUD,
    doctorName: doctor.name,
    patientName: selectedPatient.name, 
    pdfBase64
  })
})
.then(res => res.json())
.then(data => {
  console.log('Prescription saved:', data.message);
})
.catch(err => {
  console.error('Failed to save PDF:', err);
});



  showToast('PDF downloaded');
}


// Close PDF modal
function closePdfModal() {
  if (pdfModal) pdfModal.classList.remove('active');
  if (pdfPreview) pdfPreview.src = ''; // Clear preview to free up memory/resources
}

// Add chat message to UI
function addChatMessage(sender, message, type) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;

  const senderSpan = document.createElement('span');
  senderSpan.className = 'sender';
  senderSpan.textContent = sender + ': ';

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  if (type === 'bot') {
    // Convert Markdown to HTML for bot messages
    messageContent.innerHTML = marked.parse(message);
  } else {
    // Keep plain text for user messages
    messageContent.textContent = message;
  }

  messageDiv.appendChild(senderSpan);
  messageDiv.appendChild(messageContent);
  chatMessages.appendChild(messageDiv);

  // Scroll to latest message
  chatMessages.scrollTop = chatMessages.scrollHeight;
}




// 📅 Schedule Button - Appointment Viewer
const scheduleBtn = document.getElementById('schedule-btn');
const appointmentPanel = document.getElementById('appointment-floating-panel');
const appointmentList = document.getElementById('appointment-list');

if (scheduleBtn) {
  scheduleBtn.addEventListener('click', async () => {
    if (!selectedPatient || !selectedPatient.PUD) {
      appointmentList.innerHTML = '<p>Please select a patient first.</p>';
      appointmentPanel.classList.remove('hidden');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${selectedPatient.PUD}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();

      if (!data.length) {
        appointmentList.innerHTML = '<p>No appointments found for this patient.</p>';
      } else {
        appointmentList.innerHTML = data.map(appt => `
          <div class="appointment-card">
            <p><strong>Date:</strong> ${appt.date}</p>
            <p><strong>Time:</strong> ${appt.time}</p>
            <p><strong>Status:</strong> ${appt.status || 'Pending'}</p>
          </div>
        `).join('');
      }

      appointmentPanel.classList.remove('hidden');
    } catch (error) {
      console.error('Appointment fetch error:', error);
      appointmentList.innerHTML = '<p>Error loading appointments.</p>';
      appointmentPanel.classList.remove('hidden');
    }
  });
}
