

document.addEventListener('DOMContentLoaded', () => {
   const patientSelector = document.getElementById('patientSelector');

let patientList = [];

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

/*function populatePatientDropdown(patients) {
    patients.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.PUD;
        opt.textContent = `${p.name} (${p.PUD})`;
        patientSelector.appendChild(opt);
    });
}

fetch('http://localhost:3000/api/patients')
    .then(res => res.json())
    .then(data => {
        patientList = data.patients;
        populatePatientDropdown(patientList);
    });

    // new code 

if (patientSelector) {
    patientSelector.addEventListener('change', () => {
        const selectedPUD = patientSelector.value;
        if (!selectedPUD) return;

        fetch(`http://localhost:3000/api/patient/${selectedPUD}`)
            .then(res => res.json())
            .then(patient => {
                const age = getAgeFromDOB(patient.birthDate);

                patientNameDisplay.textContent = patient.name;
                patientAgeDisplay.textContent = age;
                patientIdDisplay.textContent = patient.PUD;
                patientGenderDisplay.textContent = patient.gender;

                billPatientId.value = patient.PUD;
                billPatientName.value = patient.name;
                billPatientAgeGender.value = `${age} / ${patient.gender}`;
                billPatientPhone.value = patient.contactInfo || '';
                billPatientAddress.value = patient.address || '';
            })
            .catch(() => {
                showToast("Failed to load selected patient.", "error");
            });
    });
}*/

    // Element Selectors
    const logoutButton = document.getElementById('logoutButton');

    // Patient Search
    const patientSearchInput = document.getElementById('patientSearchInput');
    const searchPatientButton = document.getElementById('searchPatientButton');
    const patientNameDisplay = document.getElementById('patientNameDisplay');
    const patientAgeDisplay = document.getElementById('patientAgeDisplay');
    const patientIdDisplay = document.getElementById('patientIdDisplay');
    const patientGenderDisplay = document.getElementById('patientGenderDisplay');
    const billPatientId = document.getElementById('billPatientId');
    const billPatientName = document.getElementById('billPatientName');
    const billPatientAgeGender = document.getElementById('billPatientAgeGender');


    // Vitals Entry
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const bmiInput = document.getElementById('bmi');
    const bloodPressureInput = document.getElementById('bloodPressure');
    const pulseInput = document.getElementById('pulse');
    const temperatureInput = document.getElementById('temperature');
    const submitVitalsButton = document.getElementById('submitVitalsButton');

    // Upload Reports
    const reportFileInput = document.getElementById('reportFile');
    const fileNamePreview = document.getElementById('fileNamePreview');
    const uploadReportButton = document.getElementById('uploadReportButton');

    // Billing
    const generateInvoiceButton = document.getElementById('generateInvoiceButton');
    const invoiceContainer = document.getElementById('invoiceContainer');
    const invoiceDateInput = document.getElementById('invoiceDate');
    const addServiceButton = document.getElementById('addServiceButton');
    const servicesTableBody = document.getElementById('servicesTableBody');
    const subtotalInput = document.getElementById('subtotal');
    const gstPercentageInput = document.getElementById('gstPercentage');
    const gstAmountInput = document.getElementById('gstAmount');
    const finalAmountInput = document.getElementById('finalAmount');
    const amountPaidInput = document.getElementById('amountPaid');
    const balanceDueInput = document.getElementById('balanceDue');
    const printInvoiceButton = document.getElementById('printInvoiceButton');
    const downloadJpegButton = document.getElementById('downloadJpegButton');


    // Toast Notification
    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    let toastTimeout;

    // --- Utility Functions ---
    function showToast(message, type = 'info', duration = 3000) {
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toastNotification.className = 'toast show'; // Remove previous type classes
        if (type === 'success') {
            toastNotification.classList.add('success');
        } else if (type === 'error') {
            toastNotification.classList.add('error');
        }
        // Else, it's default 'info' styling (dark background)

        toastTimeout = setTimeout(() => {
            toastNotification.className = 'toast hidden';
        }, duration);
    }

    // --- Event Listeners ---

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            showToast('Logged out successfully!', 'info');
            // In a real app, redirect to login page or clear session
        });
    }

    // Patient Search
  if (searchPatientButton) {
    searchPatientButton.addEventListener('click', () => {
        const searchTerm = patientSearchInput.value.trim();
        if (!searchTerm) {
            showToast('Please enter a patient name or ID.', 'error');
            return;
        }

        fetch(`http://localhost:3000/api/patient/${searchTerm}`)

            .then(res => {
                if (!res.ok) throw new Error('Patient not found');
                return res.json();
            })
            .then(patient => {
                const age = getAgeFromDOB(patient.birthDate);

                patientNameDisplay.textContent = patient.name;
                patientAgeDisplay.textContent = age;
                patientIdDisplay.textContent = patient.PUD;
                patientGenderDisplay.textContent = patient.gender;

                if (!invoiceContainer.classList.contains('hidden')) {
                    billPatientId.value = patient.PUD;
                    billPatientName.value = patient.name;
                    billPatientAgeGender.value = `${age} / ${patient.gender}`;
                    billPatientPhone.value = patient.contactInfo || '';
                    billPatientAddress.value = patient.address || '';
                }

                showToast(`Patient details loaded successfully.`, 'success');
            })
            .catch(err => {
                showToast(err.message || 'Patient not found', 'error');
            });
    });
}



    // Vitals: BMI Calculation
    function calculateBMI() {
        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);

        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            bmiInput.value = bmi.toFixed(2);
        } else {
            bmiInput.value = '';
        }
    }
    if (weightInput) weightInput.addEventListener('input', calculateBMI);
    if (heightInput) heightInput.addEventListener('input', calculateBMI);

    // Vitals: Submit
     if (submitVitalsButton) {
        // ⬇️ REPLACE THE ENTIRE 'submitVitalsButton' EVENT LISTENER WITH THIS CODE
        submitVitalsButton.addEventListener('click', () => {
            if (!patientIdDisplay.textContent || patientIdDisplay.textContent === '-') {
                 showToast('Please search and select a patient first.', 'error');
                 return;
            }

            const vitalsData = {
                pud: patientIdDisplay.textContent,
                name: patientNameDisplay.textContent,
                bp: bloodPressureInput.value,
                pulse: pulseInput.value,
                temp: temperatureInput.value,
                weight: weightInput.value,
                height: heightInput.value,
                bmi: bmiInput.value,
            };

            if (!vitalsData.bp || !vitalsData.pulse || !vitalsData.temp || !vitalsData.weight || !vitalsData.height) {
                showToast('Please fill all vital fields.', 'error');
                return;
            }

            fetch('http://localhost:3000/api/save-vitals', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(vitalsData)
            })
            .then(res => {
              if (!res.ok) {
                throw new Error('Server error');
              }
              return res.json();
            })
            .then(data => {
              showToast(data.message, 'success');
              // Clear form after successful submission
              bloodPressureInput.value = '';
              pulseInput.value = '';
              temperatureInput.value = '';
              weightInput.value = '';
              heightInput.value = '';
              bmiInput.value = '';
            })
            .catch(err => {
              showToast('Failed to submit vitals. Please try again.', 'error');
              console.error('Vitals submission error:', err);
            });
        });
    }

    

    // Upload Reports: File Name Preview
    if (reportFileInput) {
        reportFileInput.addEventListener('change', () => {
            if (reportFileInput.files.length > 0) {
                fileNamePreview.textContent = `Selected: ${reportFileInput.files[0].name}`;
            } else {
                fileNamePreview.textContent = 'No file selected.';
            }
        });
    }

    // Upload Reports: Upload Button
    if (uploadReportButton) {
        uploadReportButton.addEventListener('click', () => {
            if (!patientIdDisplay.textContent || patientIdDisplay.textContent === '-') {
                 showToast('Please search and select a patient first.', 'error');
                 return;
            }
            if (reportFileInput.files.length > 0) {
                const fileName = reportFileInput.files[0].name;
                const formData = new FormData();
formData.append('pud', patientIdDisplay.textContent);
formData.append('name', patientNameDisplay.textContent);
formData.append('report', reportFileInput.files[0]);

fetch('http://localhost:3000/api/upload-report', 
 {
    method: 'POST',
    body: formData
})
.then(res => res.json())
.then(data => {
    showToast(data.message, 'success');
    reportFileInput.value = '';
    fileNamePreview.textContent = 'No file selected.';
})
.catch(err => {
    showToast('Report upload failed', 'error');
});

                // Reset file input and preview
                reportFileInput.value = '';
                fileNamePreview.textContent = 'No file selected.';
            } else {
                showToast('Please select a file to upload.', 'error');
            }
        });
    }

    // Billing Section
    let serviceItemCount = 0;

    function updateBillingTotals() {
        let currentSubtotal = 0;
        servicesTableBody.querySelectorAll('tr').forEach(row => {
            const totalCell = row.querySelector('input[name="serviceTotal"]');
            if (totalCell && totalCell.value) {
                currentSubtotal += parseFloat(totalCell.value);
            }
        });
        subtotalInput.value = currentSubtotal.toFixed(2);

        const gstPercent = parseFloat(gstPercentageInput.value) || 0;
        const gstVal = (currentSubtotal * gstPercent) / 100;
        gstAmountInput.value = gstVal.toFixed(2);

        const finalTotal = currentSubtotal + gstVal;
        finalAmountInput.value = finalTotal.toFixed(2);

        updateBalanceDue();
    }

    function updateBalanceDue() {
        const finalTotal = parseFloat(finalAmountInput.value) || 0;
        const paid = parseFloat(amountPaidInput.value) || 0;
        const balance = finalTotal - paid;
        balanceDueInput.value = balance.toFixed(2);
    }


    if (addServiceButton) {
        addServiceButton.addEventListener('click', () => {
            serviceItemCount++;
            const newRow = servicesTableBody.insertRow();
            newRow.innerHTML = `
                <td>${serviceItemCount}</td>
                <td><input type="text" name="serviceDescription" class="input-field" placeholder="e.g., Consultation"></td>
                <td><input type="number" name="serviceQuantity" class="input-field" value="1" min="1"></td>
                <td><input type="number" name="serviceUnitPrice" class="input-field" placeholder="0.00" step="0.01"></td>
                <td><input type="text" name="serviceTotal" class="input-field" readonly></td>
                <td class="action-cell"><button class="btn btn-danger btn-sm remove-service-btn">Remove</button></td>
            `;

            newRow.querySelectorAll('input[name="serviceQuantity"], input[name="serviceUnitPrice"]').forEach(input => {
                input.addEventListener('input', () => {
                    const row = input.closest('tr');
                    const quantity = parseFloat(row.querySelector('input[name="serviceQuantity"]').value) || 0;
                    const unitPrice = parseFloat(row.querySelector('input[name="serviceUnitPrice"]').value) || 0;
                    row.querySelector('input[name="serviceTotal"]').value = (quantity * unitPrice).toFixed(2);
                    updateBillingTotals();
                });
            });

            newRow.querySelector('.remove-service-btn').addEventListener('click', function() {
                this.closest('tr').remove();
                // Renumber S.No if needed, or simply let them be non-sequential after removal for simplicity
                updateBillingTotals();
            });
        });
    }

    if (gstPercentageInput) gstPercentageInput.addEventListener('input', updateBillingTotals);
    if (amountPaidInput) amountPaidInput.addEventListener('input', updateBalanceDue);


    if (generateInvoiceButton) {
        generateInvoiceButton.addEventListener('click', () => {
            invoiceContainer.classList.toggle('hidden');
            generateInvoiceButton.textContent = invoiceContainer.classList.contains('hidden') ? 'Generate Invoice' : 'Hide Invoice';
            if (!invoiceContainer.classList.contains('hidden')) {
                invoiceDateInput.value = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
                // Add a default service item if table is empty
                if (servicesTableBody.rows.length === 0) {
                    addServiceButton.click(); // Simulate click to add one item
                }
                // Populate patient details from search if available
                if (patientIdDisplay.textContent && patientIdDisplay.textContent !== '-') {
                    billPatientId.value = patientIdDisplay.textContent;
                    billPatientName.value = patientNameDisplay.textContent;
                    billPatientAgeGender.value = `${patientAgeDisplay.textContent} / ${patientGenderDisplay.textContent}`;
                }
                updateBillingTotals();
                  // 🔄 Remove existing Save Bill button if already present
const existingSaveBtn = document.getElementById('saveBillButton');
if (existingSaveBtn) existingSaveBtn.remove();

// ✅ Add Save Bill button dynamically
const saveBillButton = document.createElement('button');
saveBillButton.id = 'saveBillButton';
saveBillButton.textContent = 'Save Bill';
saveBillButton.className = 'btn btn-success';
invoiceContainer.appendChild(saveBillButton);

saveBillButton.addEventListener('click', () => {
    const bill = {
        pud: billPatientId.value,
        name: billPatientName.value,
        date: invoiceDateInput.value,
        services: [],
        subtotal: subtotalInput.value,
        gstPercentage: gstPercentageInput.value,
        gstAmount: gstAmountInput.value,
        finalAmount: finalAmountInput.value,
        amountPaid: amountPaidInput.value,
        balanceDue: balanceDueInput.value,
        paymentMethod: document.getElementById('paymentMethod').value,
        transactionId: document.getElementById('transactionId').value,
        remarks: document.getElementById('remarks').value,
        generatedBy: document.getElementById('generatedBy').value,
        invoiceNo: document.getElementById('invoiceNo').value,
    };

    servicesTableBody.querySelectorAll('tr').forEach(row => {
        const service = {
            description: row.querySelector('input[name="serviceDescription"]').value,
            quantity: row.querySelector('input[name="serviceQuantity"]').value,
            unitPrice: row.querySelector('input[name="serviceUnitPrice"]').value,
            total: row.querySelector('input[name="serviceTotal"]').value,
        };
        bill.services.push(service);
    });

   // 🔴 FIX: Changed relative URL to absolute URL
    fetch('http://localhost:3000/api/save-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill)
    })
    .then(res => res.json())
    .then(data => showToast(data.message, 'success'))
    .catch(() => showToast('Failed to save bill', 'error'));
});


            }
        });
    }

    if (printInvoiceButton) {
        printInvoiceButton.addEventListener('click', () => {
            if (invoiceContainer.classList.contains('hidden')) {
                showToast('Please generate the invoice first.', 'error');
                return;
            }
            // Temporarily make readonly fields look like text for printing
            const readonlyInputs = invoiceContainer.querySelectorAll('input[readonly]');
            readonlyInputs.forEach(input => input.classList.add('print-text'));

            window.print();

            readonlyInputs.forEach(input => input.classList.remove('print-text')); //Revert style after print dialog
            showToast('Print dialog initiated for PDF generation.', 'info');
        });
    }

    if (downloadJpegButton) {
        downloadJpegButton.addEventListener('click', () => {
             if (invoiceContainer.classList.contains('hidden')) {
                showToast('Please generate the invoice first.', 'error');
                return;
            }
            showToast('JPEG download is simulated. In a real app, server-side or library assistance would be needed.', 'info');
        });
    }

    // Initial setup
    if (invoiceDateInput && !invoiceContainer.classList.contains('hidden')) {
        invoiceDateInput.value = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    }
     // Trigger a search for default patient to populate initially
    if (searchPatientButton) searchPatientButton.click();

});