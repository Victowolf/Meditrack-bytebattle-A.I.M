document.addEventListener('DOMContentLoaded', async () => {
    const pud = localStorage.getItem('pud');
    const welcomePatientName = document.getElementById('welcome-patient-name');
    const logoutBtn = document.getElementById('logout-btn');
    const detailPud = document.getElementById('detail-pud');
    const detailName = document.getElementById('detail-name');
    const detailGender = document.getElementById('detail-gender');
    const detailDOB = document.getElementById('detail-DOB');
    const detailEmail = document.getElementById('detail-email');
    const fileList = document.getElementById('file-list');
    const prescriptionList = document.getElementById('prescription-list');
    const reportList = document.getElementById('report-list');
    const billList = document.getElementById('bill-list');
    const currentYearSpan = document.getElementById('current-year');

    // Chatbot elements
    const chatbotToggleBtn = document.getElementById('chatbot-toggle-btn');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeChatbotBtn = document.getElementById('close-chatbot-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatbotHeader = document.getElementById('chatbot-header');

    // EHR Summary Modal elements
    const downloadEHRSummaryBtn = document.getElementById('download-ehr-summary-btn');
    const ehrSummaryModal = document.getElementById('ehr-summary-modal');
    const closeEHRSummaryModal = document.getElementById('close-ehr-summary-modal');
    const ehrSummaryContent = document.getElementById('ehr-summary-content');
    const printEHRSummaryBtn = document.getElementById('print-ehr-summary-btn');

    // Upload form
    const uploadForm = document.getElementById('upload-form');
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('health-report-file');
        const files = fileInput.files;
if (!files || files.length === 0) {
    alert('Please select at least one report to upload.');
    return;
}

const name = detailName.textContent;
const dob = detailDOB.textContent;
const birthYear = new Date(dob).getFullYear();
const age = new Date().getFullYear() - birthYear;

const formData = new FormData();
formData.append('pud', pud);
formData.append('name', `${name} (Age ${age})`);

for (const file of files) {
    formData.append('report', file); // Append each selected file
}


        try {
            const res = await fetch('http://localhost:3000/api/upload-report', {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (res.ok) {
                alert('Report uploaded successfully.');
                fileInput.value = '';
                location.reload(); // Refresh to show updated report
            } else {
                alert(result.error || 'Failed to upload.');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('An error occurred during the upload.');
        }
    });

    // Set current year in footer
    currentYearSpan.textContent = new Date().getFullYear();

    if (!pud) {
        alert('You are not logged in!');
        window.location.href = 'patlog.html'; // Redirect to login if not found
        return;
    }

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('pud');
        window.location.href = 'patlog.html';
    });

    // Main try block for essential patient data. If this fails, the page can't load.
    try {
        const res = await fetch(`http://localhost:3000/api/patient/${pud}`);
        if (!res.ok) throw new Error(`Failed to fetch patient data. Status: ${res.status}`);

        const data = await res.json();

        // Display patient details
        detailPud.textContent = data.PUD || 'N/A';
        detailName.textContent = data.name || 'N/A';
        detailGender.textContent = data.gender || 'N/A';
        detailDOB.textContent = data.birthDate || 'N/A';
        detailEmail.textContent = data.email || 'N/A';
        welcomePatientName.textContent = data.name ? data.name.split(' ')[0] : 'Patient';

        // Original Medical History
        if (fileList) {
            fileList.innerHTML = '';
            if (Array.isArray(data.MedHis) && data.MedHis.length > 0) {
                data.MedHis.forEach(path => {
                    const div = document.createElement('div');
                    div.className = 'file-item';
                    div.textContent = path.originalname;
                    fileList.appendChild(div);
                });
            } else {
                fileList.innerHTML = '<p>No general medical history available.</p>';
            }
        }

        // --- Start Prescriptions Section ---
        // This 'try' handles only prescriptions. If it fails, the other sections will still try to load.
        try {
            const prescriptionsRes = await fetch(`http://localhost:3000/api/prescriptions/${pud}`);
            const prescriptions = await prescriptionsRes.json();

            prescriptionList.innerHTML = '';
            if (prescriptions.length > 0) {
                prescriptions.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'card-item prescription-card';
                    card.innerHTML = `
                      <h4>Prescription</h4>
                      <p><strong>Doctor:</strong> ${p.doctorName}</p>
                      <p><strong>Date:</strong> ${new Date(p.generatedAt).toLocaleDateString()}</p>
                      <div class="card-actions">
                        <a href="http://localhost:3000/api/prescriptions/${pud}/file/${p._id}" class="btn primary-btn" target="_blank">
                          <i class="ri-download-line"></i> Download PDF
                        </a>
                      </div>
                    `;
                    prescriptionList.appendChild(card);
                });
            } else {
                prescriptionList.innerHTML = '<p>No prescriptions found.</p>';
            }
        } catch (err) {
            console.error("Failed to load prescriptions:", err);
            prescriptionList.innerHTML = '<p class="error-text">Could not load prescriptions.</p>';
        }
        // --- End Prescriptions Section ---


        // --- Start Reports Section ---
        // This 'try' handles only reports.
        try {
            const reportsRes = await fetch(`http://localhost:3000/api/reports/${pud}`);
            const reports = await reportsRes.json();

            reportList.innerHTML = '';
            if (reports.length > 0) {
                reports.forEach(r => {
                    const fileExtension = r.originalname.split('.').pop().toLowerCase();
                    const downloadIcon = fileExtension === 'pdf' ? 'ri-file-pdf-line' : 'ri-image-line';
                    const downloadText = fileExtension === 'pdf' ? 'Download PDF' : 'Download Image';

                    const card = document.createElement('div');
                    card.className = 'card-item report-card';
                    card.innerHTML = `
                      <h4>${r.originalname}</h4>
                      <p><strong>Date:</strong> ${new Date(r.uploadedAt).toLocaleDateString()}</p>
                      <div class="card-actions">
                        <a href="http://localhost:3000/api/reports/${pud}/file/${r._id}" class="btn outline-btn" target="_blank">
                          <i class="${downloadIcon}"></i> ${downloadText}
                        </a>
                      </div>
                    `;
                    reportList.appendChild(card);
                });
            } else {
                reportList.innerHTML = '<p>No reports found.</p>';
            }
        } catch (err) {
            console.error("Failed to load reports:", err);
            reportList.innerHTML = '<p class="error-text">Could not load reports.</p>';
        }
        // --- End Reports Section ---


        // --- Start Bills Section ---
        // This 'try' handles only bills.
        try {
            const billsRes = await fetch(`http://localhost:3000/api/bills/${pud}`);
            const bills = await billsRes.json();

            billList.innerHTML = '';
            if (bills.length > 0) {
                bills.forEach(b => {
                    const card = document.createElement('div');
                    card.className = 'card-item bill-card';
                    card.innerHTML = `
                      <h4>Invoice #${b.invoiceNo || 'N/A'}</h4>
                      <p><strong>Date:</strong> ${new Date(b.date).toLocaleDateString()}</p>
                      <p><strong>Amount:</strong> $${parseFloat(b.finalAmount).toFixed(2)}</p>
                      <div class="card-actions">
                        <a href="http://localhost:3000/api/bills/${pud}/file/${b._id}" class="btn primary-btn" target="_blank">
                          <i class="ri-download-line"></i> Download PDF
                        </a>
                      </div>
                    `;
                    billList.appendChild(card);
                });
            } else {
                billList.innerHTML = '<p>No bills available.</p>';
            }
        } catch (err) {
            console.error("Failed to load bills:", err);
            billList.innerHTML = '<p class="error-text">Could not load bills.</p>';
        }
        // --- End Bills Section ---

    } catch (error) {
        // This catch block only runs if the main patient data fails to load.
        console.error('Error fetching patient data:', error);
        alert('Failed to load patient information. Please try again later.');
        document.getElementById('welcome-patient-name').textContent = 'Patient';
        document.querySelector('.container').innerHTML = '<h2>Could not load patient data.</h2><p>Please check your connection and try logging in again.</p>';
    }

    // --- AI Chatbot Assistant Functionality (no changes here) ---
    let isDragging = false;
    let offsetX, offsetY;

    chatbotToggleBtn.addEventListener('click', () => {
        chatbotContainer.classList.toggle('show');
    });

    closeChatbotBtn.addEventListener('click', () => {
        chatbotContainer.classList.remove('show');
    });

    chatbotHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - chatbotContainer.getBoundingClientRect().left;
        offsetY = e.clientY - chatbotContainer.getBoundingClientRect().top;
        chatbotHeader.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        chatbotContainer.style.left = `${e.clientX - offsetX}px`;
        chatbotContainer.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        chatbotHeader.classList.remove('dragging');
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            appendMessage('user', message);
            chatInput.value = '';
            simulateBotResponse(message);
        }
    });

    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender} message`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
    }

    function appendMessageHTML(sender, html) {
    const chatBox = document.getElementById('chat-messages');
    const messageElem = document.createElement('div');
    messageElem.className = `${sender} message`;
    messageElem.innerHTML = html; // Be cautious of XSS if user-generated input is ever allowed
    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function fetchPatientReportsText(pud) {
    try {
        const res = await fetch(`http://localhost:3000/api/reports/${pud}`);
        if (!res.ok) throw new Error('Failed to fetch report metadata');
        const files = await res.json();

        const texts = [];
        for (const file of files) {
            const docxRes = await fetch(`http://localhost:3000/api/reports/${pud}/file/${file._id}`);
            if (!docxRes.ok) continue;
            const blob = await docxRes.blob();

            const arrayBuffer = await blob.arrayBuffer();
            const zip = new JSZip();
            const content = await zip.loadAsync(arrayBuffer);
            const xml = await content.file("word/document.xml").async("string");

            // Extract plain text from XML content
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, "application/xml");
            const paragraphs = xmlDoc.getElementsByTagName("w:t");
            const reportText = Array.from(paragraphs).map(p => p.textContent).join(" ");
            texts.push(reportText);
        }

        return texts.join("\n\n---\n\n"); // Join all reports with dividers
    } catch (err) {
        console.error("Error reading patient reports:", err);
        return ""; // Fallback to no context
    }
}

   async function simulateBotResponse(userMessage) {
    appendMessage('bot', 'Typing...');

    const pud = localStorage.getItem('pud'); // Or however you’re storing patient ID
    const reportContext = await fetchPatientReportsText(pud);

    const prompt = `You are a health diagonstic assistant. help the patient to analyze his health\n\n` + `=== PATIENT REPORTS ===\n${reportContext}\n\n` +
                   `=== USER QUESTION ===\n${userMessage}`;

    fetch('http://localhost:3000/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: prompt })
    })
    .then(response => response.json())
    .then(data => {
        const messages = document.querySelectorAll('.bot.message');
        if (messages[messages.length - 1].textContent === 'Typing...') {
            messages[messages.length - 1].remove();
        }

        const htmlReply = marked.parse(data.reply || "Sorry, I couldn't understand that.");
        appendMessageHTML('bot', htmlReply);
    })
    .catch(err => {
        console.error('Error contacting Gemini:', err);
        appendMessage('bot', 'Oops! Something went wrong. Try again later.');
    });
}




    // --- Download Portable EHR Summary Functionality (no changes here) ---
    downloadEHRSummaryBtn.addEventListener('click', () => {
        populateEHRSummary();
        ehrSummaryModal.classList.add('active');
    });

    closeEHRSummaryModal.addEventListener('click', () => {
        ehrSummaryModal.classList.remove('active');
    });

    printEHRSummaryBtn.addEventListener('click', () => {
        const content = ehrSummaryContent.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>EHR Summary</title>');
        printWindow.document.write('<link rel="stylesheet" href="css/patient.css">');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="prescription-paper" style="box-shadow: none; border: none;">');
        printWindow.document.write(content);
        printWindow.document.write('</div></body></html>');
        printWindow.document.close();
        printWindow.print();
    });

    function populateEHRSummary() {
        const patientName = detailName.textContent || 'N/A';
        const birthDate = detailDOB.textContent;
        let patientAge = 'N/A';
        if (birthDate && birthDate !== 'N/A') {
            patientAge = new Date().getFullYear() - new Date(birthDate).getFullYear();
        }

        const patientGender = detailGender.textContent || 'N/A';

        const lastVisits = [{
            date: '2024-05-28',
            doctor: 'Dr. Emily White',
            diagnosis: 'Hypertension',
            medications: ['Lisinopril']
        }, {
            date: '2024-03-15',
            doctor: 'Dr. John Smith',
            diagnosis: 'Seasonal Allergies',
            medications: ['Antihistamine']
        }, ];

        const lastLabReports = [{
            date: '2024-04-10',
            test: 'Complete Blood Count',
            summary: 'All parameters within normal range.'
        }, {
            date: '2024-01-20',
            test: 'Lipid Panel',
            summary: 'Cholesterol slightly elevated, recommended dietary changes.'
        }, ];

        const currentMedications = ['Lisinopril 10mg daily', 'Vitamin D supplements'];
        const emergencyContact = 'Jane Doe (Sister) - 555-123-4567';
        const notes = 'Patient is generally healthy, manages stress well. No known drug allergies.';

        ehrSummaryContent.innerHTML = `
      <div class="prescription-header">
          <h2 class="prescription-hospital">Portable EHR Summary</h2>
          <p class="prescription-address">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="summary-section">
          <h4>Patient Demographics</h4>
          <p><strong>Name:</strong> ${patientName}</p>
          <p><strong>Age:</strong> ${patientAge}</p>
          <p><strong>Gender:</strong> ${patientGender}</p>
      </div>

      <div class="summary-section">
          <h4>Last Visits</h4>
          <ul class="summary-list">
              ${lastVisits.map(visit => `
                  <li>
                      <strong>Date:</strong> ${visit.date}<br>
                      <strong>Doctor:</strong> ${visit.doctor}<br>
                      <strong>Diagnosis:</strong> ${visit.diagnosis}<br>
                      <strong>Medications:</strong> ${visit.medications.join(', ')}
                  </li>
              `).join('')}
          </ul>
      </div>

      <div class="summary-section">
          <h4>Last Lab Report Summaries</h4>
          <ul class="summary-list">
              ${lastLabReports.map(report => `
                  <li>
                      <strong>Date:</strong> ${report.date}<br>
                      <strong>Test:</strong> ${report.test}<br>
                      <strong>Summary:</strong> ${report.summary}
                  </li>
              `).join('')}
          </ul>
      </div>

      <div class="summary-section">
          <h4>Current Medications</h4>
          <ul class="summary-list">
              ${currentMedications.map(med => `<li>${med}</li>`).join('')}
          </ul>
      </div>

      <div class="summary-section">
          <h4>Emergency Contact</h4>
          <p>${emergencyContact}</p>
      </div>

      <div class="summary-section">
          <h4>Notes</h4>
          <p>${notes}</p>
      </div>
    `;
    }

// === Appointment Booking ===
document.getElementById('appt-name').textContent = detailName.textContent;
document.getElementById('appt-pud').textContent = detailPud.textContent;

const appointmentForm = document.getElementById('appointment-form');
appointmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('appt-date').value;
  const time = document.getElementById('appt-time').value;

  if (!date || !time) {
    alert('Please select both date and time.');
    return;
  }

  const appointmentData = {
    name: detailName.textContent,
    pud: detailPud.textContent,
    date,
    time,
  };

  try {
    const res = await fetch('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });

    const result = await res.json();
    if (res.ok) {
      alert('Appointment booked successfully!');
      appointmentForm.reset();
    } else {
      alert(result.error || 'Failed to book appointment.');
    }
  } catch (err) {
    console.error('Appointment booking error:', err);
    alert('Error booking appointment. Please try again.');
  }
});

// ✅ Initialize Flatpickr on appointment date input
flatpickr("#appt-date", {
  dateFormat: "d-m-Y",
  minDate: "today",
  defaultDate: null,
  altInput: true,
  altFormat: "F j, Y", // e.g., "June 13, 2025"
  allowInput: true,
});





});