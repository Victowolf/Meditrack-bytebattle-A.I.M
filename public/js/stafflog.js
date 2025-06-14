// Set current year
//document.getElementById("current-year").textContent = new Date().getFullYear();

// Staff login logic
document.getElementById("staff-login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const staffId = document.getElementById("staff-id").value.trim();
  const password = document.getElementById("staff-password").value.trim();
  const errorMsg = document.getElementById("error-message");

  if (staffId === "staff01" && password === "staff123") {
    window.location.href = "staff.html"; // redirect to dashboard
  } else {
    errorMsg.textContent = "Invalid ID or password!";
  }
});
