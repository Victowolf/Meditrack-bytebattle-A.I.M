# Meditrack: Multi-Role Healthcare Management Dashboard

Meditrack is a blockchain secured, scalable, and modular web-based Enterprise Resource Management (ERM) system designed for modern healthcare institutions. It supports role-based access control and provides specialized dashboards for administrators, doctors, nurses, and patients.

## 🚀 Features

### 🔐 Role-Based Access System

* Registration & login with secure authentication
* Role assignment: Super Admin, Doctor, Nurse, Patient
* Role-specific access control with protected routes
* Blockchain autentication system

### 🔤 Dashboards

* **Super Admin**: Manage users, assign roles, view system reports
* **Doctor**: View/manage appointments, update treatment records
* **Nurse**: Access task lists, update patient vitals, assist doctors
* **Patient**: View prescriptions, book appointments, download records

### 🗕 Appointment Management

* Patients can book/reschedule appointments
* Doctors can approve/reject appointments
* Calendar view for each user role

### 📋 Medical Record Module

* Doctors can create/edit diagnoses, prescriptions, and treatments
* Patients can download their medical history
* All fields are role-access controlled

### 🔔 Notification System

* Appointment confirmations
* Prescription readiness alerts
* Nurse daily task reminders

## 🛠 Tech Stack

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js, Express.js
* **Blockchain (optional)**: Hardhat, Solidity (EHR contract integration)
* **Database**: MongoDB (or as configured)
* **Web3 Wallet Integration**: MetaMask (if enabled)

## 📁 Project Structure

```
nexlinc/
├── contracts/           # Solidity smart contracts
├── frontend/            # Web UI for different user roles
├── backend/             # Node.js/Express.js server
├── scripts/             # Hardhat deployment scripts
├── hardhat.config.js    # Hardhat configuration
└── README.md            # Project documentation
```

## 🧪 Getting Started

### Prerequisites

* Node.js
* MetaMask (if using blockchain features)
* MongoDB

### Installation

```bash
git clone https://github.com/Victowolf/Meditrack-bytebattle-A.I.M.git
cd nexlinc
npm install
```

### Running the App

```bash
npx hardhat node          # Run local blockchain node
npx hardhat run scripts/deploy.js --network localhost
npm start                 # Start the backend/frontend
```

## 🙌 Team & Contributions

Built as part of the **ByteBattle Hackathon** to modernize healthcare management with intelligent role-based systems and secure data access.
