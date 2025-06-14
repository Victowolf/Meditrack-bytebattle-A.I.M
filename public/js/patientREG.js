// DOM Elements
const patientForm = document.getElementById('patient-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');

const fileInput = document.getElementById('file-upload');
const fileDropArea = document.getElementById('file-drop-area');
const fileList = document.getElementById('file-list');

const patientIdDisplay = document.getElementById('patientId');
const patientPasswordDisplay = document.getElementById('patientPassword');
const copyButtons = document.querySelectorAll('.copy-btn');

const proceedToCardBtn = document.getElementById('proceed-to-card-btn');
const printCardBtn = document.getElementById('print-card-btn');
const newRegistrationBtn = document.getElementById('new-registration-btn');

const progressBar = document.querySelector('.progress');
const stepIndicators = {
  registration: document.getElementById('step-registration'),
  credentials: document.getElementById('step-credentials'),
  card: document.getElementById('step-card')
};

const sections = {
  registration: document.getElementById('registration-section'),
  credentials: document.getElementById('credentials-section'),
  card: document.getElementById('patient-card-section')
};

const cardFields = {
  name: document.getElementById('card-name'),
  id: document.getElementById('card-id'),
  blood: document.getElementById('card-blood'),
  dob: document.getElementById('card-dob'),
  contact: document.getElementById('card-contact'),
  emergency: document.getElementById('card-emergency'),
  validDate: document.getElementById('card-valid-date')
};

const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastTitle = document.getElementById('toast-title');
const toastDesc = document.getElementById('toast-desc');

// Global variables
let currentStep = 'registration';
let patientData = null;
let credentials = null;
let selectedFiles = [];

// Initialize the app
function initApp() {
  document.getElementById('current-year').textContent = new Date().getFullYear();

  patientForm.addEventListener('submit', handleFormSubmit);
  fileInput.addEventListener('change', handleFileSelection);
  fileDropArea.addEventListener('click', () => fileInput.click());
  fileDropArea.addEventListener('dragover', handleDragOver);
  fileDropArea.addEventListener('drop', handleFileDrop);

  copyButtons.forEach(btn => {
    btn.addEventListener('click', handleCopyClick);
  });

  proceedToCardBtn.addEventListener('click', goToCardStep);
  printCardBtn.addEventListener('click', printPatientCard);
  newRegistrationBtn.addEventListener('click', startNewRegistration);
}

// Form submission handler (Modified to send data to MongoDB)
async function handleFormSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const formData = new FormData(patientForm);
  const formDataObj = Object.fromEntries(formData.entries());
  /* Patient updated Photo and Age stored in backend Code */

  /*const photoFile = document.getElementById('patientPhoto').files[0];
  const birthDate = new Date(formDataObj.birthDate);
  const age = new Date().getFullYear() - birthDate.getFullYear();*/


  try {
    // Generate credentials locally
    credentials = {
      patientId: generateId(),
      password: generatePassword()
    };

    patientData = formDataObj;

    // Prepare data payload for MongoDB
    const payload = {
      PUD: credentials.patientId,
      password: credentials.password,
      name: formDataObj.name,
      gender: formDataObj.gender,
      contactInfo: formDataObj.contactNumber,
      birthDate: formDataObj.birthDate,
      bloodGroup: formDataObj.bloodGroup,
      address: formDataObj.address,
      emergencyNumber: formDataObj.emergencyContact,
      email: formDataObj.email,
      //MedHis: selectedFiles.map(file => `/uploads/${file.name}`) // file paths only
    };

    // Send to backend
    const formDataToSend = new FormData();
formDataToSend.append('data', JSON.stringify(payload));
selectedFiles.forEach(file => formDataToSend.append('files', file));

// ✅ Optional user feedback if no reports are uploaded
if (selectedFiles.length === 0) {
  showToast('info', 'No Reports Uploaded', 'You are registering without uploading any medical history reports.');
}

// ✅ Console log for debugging
console.log('Files to be sent:', selectedFiles);



const response = await fetch('http://localhost:3000/api/register', {
  method: 'POST',
  body: formDataToSend
});

    if (!response.ok) throw new Error('Failed to register');

    // Display the credentials
    patientIdDisplay.value = credentials.patientId;
    patientPasswordDisplay.value = credentials.password;

    showToast('success', 'Registration Successful', 'Patient has been registered successfully.');
    goToCredentialsStep();
  } catch (error) {
    console.error('Form error:', error);
    showToast('error', 'Registration Failed', error.message || 'An error occurred.');
  } finally {
    setLoading(false);
  }
}

function handleFileSelection(e) {
  if (e.target.files.length) {
    addFiles(Array.from(e.target.files));
  }
}

function handleDragOver(e) {
  e.preventDefault();
  fileDropArea.classList.add('dragover');
}

function handleFileDrop(e) {
  e.preventDefault();
  fileDropArea.classList.remove('dragover');

  if (e.dataTransfer.files.length) {
    addFiles(Array.from(e.dataTransfer.files));
  }
}

function addFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  updateFileList();
}

function updateFileList() {
  fileList.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-item-info';

    const icon = document.createElement('i');
    icon.className = 'fas fa-file';
    fileInfo.appendChild(icon);

    const fileName = document.createElement('span');
    fileName.textContent = file.name;
    fileInfo.appendChild(fileName);

    const fileSize = document.createElement('span');
    fileSize.className = 'file-item-size';
    fileSize.textContent = `(${formatFileSize(file.size)})`;
    fileInfo.appendChild(fileSize);

    fileItem.appendChild(fileInfo);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'file-remove-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', () => removeFile(index));

    fileItem.appendChild(removeBtn);
    fileList.appendChild(fileItem);
  });
}

function removeFile(index) {
  selectedFiles = selectedFiles.filter((_, i) => i !== index);
  updateFileList();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

function handleCopyClick(e) {
  const targetId = e.currentTarget.dataset.target;
  const textToCopy = document.getElementById(targetId).value;

  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      const icon = e.currentTarget.querySelector('i');
      icon.className = 'fas fa-check';
      showToast('success', 'Copied to clipboard', `The ${targetId === 'patientId' ? 'Patient ID' : 'Password'} has been copied.`);
      setTimeout(() => {
        icon.className = 'fas fa-copy';
      }, 2000);
    })
    .catch(() => {
      showToast('error', 'Copy failed', 'Failed to copy to clipboard.');
    });
}

function goToCredentialsStep() {
  currentStep = 'credentials';
  updateStepIndicators();
  sections.registration.classList.add('hidden');
  sections.credentials.classList.remove('hidden');
  sections.card.classList.add('hidden');
}

function goToCardStep() {
  currentStep = 'card';
  updateStepIndicators();
  updatePatientCard();
  sections.registration.classList.add('hidden');
  sections.credentials.classList.add('hidden');
  sections.card.classList.remove('hidden');
}

function updateStepIndicators() {
  Object.values(stepIndicators).forEach(step => step.classList.remove('active'));

  if (currentStep === 'registration') {
    progressBar.style.width = '0%';
  } else if (currentStep === 'credentials') {
    progressBar.style.width = '50%';
    stepIndicators.registration.classList.add('active');
    stepIndicators.credentials.classList.add('active');
  } else if (currentStep === 'card') {
    progressBar.style.width = '100%';
    stepIndicators.registration.classList.add('active');
    stepIndicators.credentials.classList.add('active');
    stepIndicators.card.classList.add('active');
  }
}

function updatePatientCard() {
  if (!patientData || !credentials) return;

  cardFields.name.textContent = patientData.name;
  cardFields.id.textContent = credentials.patientId;
  cardFields.blood.textContent = patientData.bloodGroup;
  cardFields.dob.textContent = formatDate(patientData.birthDate);
  cardFields.contact.textContent = patientData.contactNumber;
  cardFields.emergency.textContent = patientData.emergencyContact;
  cardFields.validDate.textContent = formatDate(new Date());
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function printPatientCard() {
  window.print();
  showToast('success', 'Print prepared', 'Your patient card is ready to print.');
}

function startNewRegistration() {
  patientForm.reset();
  selectedFiles = [];
  updateFileList();
  currentStep = 'registration';
  updateStepIndicators();
  sections.registration.classList.remove('hidden');
  sections.credentials.classList.add('hidden');
  sections.card.classList.add('hidden');
}

function showToast(type, title, message) {
  toastIcon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  toastTitle.textContent = title;
  toastDesc.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 300);
  }, 3000);
}

function setLoading(isLoading) {
  btnText.textContent = isLoading ? 'Registering...' : 'Register Patient';
  btnLoader.classList.toggle('hidden', !isLoading);
  submitBtn.disabled = isLoading;
}

function generateId(prefix = 'PAT') {
  const timestamp = Date.now().toString(36); // Base36 for compactness
  const randomPart = Math.random().toString(36).substring(2, 7); // Random 5 characters
  return `${prefix}${timestamp}${randomPart}`.toUpperCase();
}


function generatePassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

document.addEventListener('DOMContentLoaded', initApp);
