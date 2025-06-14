# Meditrack: Multi-Role Healthcare Management Dashboard

Meditrack is a blockchain secured, scalable, and modular web-based Enterprise Resource Management (ERM) system designed for modern healthcare institutions. It supports role-based access control and provides specialized dashboards for administrators, doctors, nurses, and patients.

### Demo video
👉[WatchInAction](https://drive.google.com/file/d/1K9PQxwtXD58OLXqcjrK08wjKKseLBBuc/view?usp=sharing)

## 🚀 Features

### 🔐 Role-Based Access System

* Registration & login with secure authentication
* Role assignment: Super Admin, Doctor, Nurse, Patient
* Role-specific access control with protected routes
* Blockchain autentication system

### 🔤 Dashboards

* **Super Admin**: Manage users, assign roles, view system reports, audit logs, bloackchain visualizer.
* **Doctor**: View/manage appointments, update treatment records, write prescriptions
* **Staff**: Access task lists, update patient vitals, assist doctors,genrate invoice
* **Patient**: View prescriptions, book appointments, download/upload records

### 🗕 Appointment Management

* Patients can book/reschedule appointments
* Doctors can approve/reject appointments
* Calendar view for each user role

### 📋 Medical Record Module

* Doctors can create/edit diagnoses, prescriptions, and treatments
* Patients can download their medical history
* All fields are role-access controlled
* RAG integrated Ai diagnostic assistant dashboard. for doctors/patients.

### 🔔 Notification System

* Appointment confirmations
* Prescription readiness alerts
* Nurse daily task reminders

## 🛠 Tech Stack

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js, Express.js
* **Blockchain (optional)**: Hardhat, Solidity (EHR contract integration)
* **Database**: MongoDB (or as configured)
* **Web3 Wallet Integration**: MetaMask 

## 📁 Project Structure

```
Meditrack-bytebattle-A.I.M/
├── contracts/           # Solidity smart contracts
├── public/              # Web UI for different user roles
├── nodemodules/         # Node.js/Express.js server
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

### Team mates
- Yash R Hosalli
- Prayas Murari
- Jighyanshu Kumar
- Kamran Aralikatti
