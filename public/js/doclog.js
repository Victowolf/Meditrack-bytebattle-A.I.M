window.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("doctor-login-form");
  const walletWarning = document.getElementById("wallet-warning");

  // ✅ Replace this with your actual deployed admin wallet address
  const doctorWalletAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906".toLowerCase();

  if (typeof window.ethereum === "undefined") {
    walletWarning.textContent = "MetaMask is not installed.";
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

    if (!accounts || accounts.length === 0) {
      walletWarning.textContent = "MetaMask wallet not connected.";
      return;
    }

    const connectedWallet = accounts[0].toLowerCase();
    console.log("Connected wallet:", connectedWallet);

    if (connectedWallet === doctorWalletAddress) {
      loginForm.style.display = "block"; // ✅ Show form only for verified admin
    } else {
      walletWarning.textContent = "Unauthorized wallet address. Access denied.";
    }
  } catch (error) {
    console.error("MetaMask connection error:", error);
    walletWarning.textContent = "MetaMask connection failed.";
  }
});

// 💡 Login form credentials check
document.getElementById("doctor-login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("doctor-id").value.trim();
  const pass = document.getElementById("doctor-password").value.trim();
  const error = document.getElementById("error-message");

  if (id === "doc01" && pass === "docpass123") {
    window.location.href = "doctor.html";
  } else {
    error.textContent = "Invalid ID or password!";
  }
});
