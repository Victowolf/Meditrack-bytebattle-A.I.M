// public/js/index2.js

const DOCTOR_USERNAME = "doc123";
const DOCTOR_PASSWORD = "ehr123";

function loginDoctor() {
  const username = document.getElementById("doctorUser").value;
  const password = document.getElementById("doctorPass").value;

  if (username !== DOCTOR_USERNAME || password !== DOCTOR_PASSWORD) {
    alert("❌ Invalid username or password.");
    return;
  }

  // Credentials match
  window.location.href = "doctor.html";
}

// Optional: Set current year in footer
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("current-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
