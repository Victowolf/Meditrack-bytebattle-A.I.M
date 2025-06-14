window.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("admin-login-form");
  const walletWarning = document.getElementById("wallet-warning");

  // ✅ Replace this with your actual deployed admin wallet address
  const adminWalletAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffB92266".toLowerCase();

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

    if (connectedWallet === adminWalletAddress) {
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
document.getElementById("admin-login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("admin-id").value.trim();
  const pass = document.getElementById("admin-password").value.trim();
  const error = document.getElementById("error-message");

  if (id === "admin01" && pass === "adminpass123") {
    window.location.href = "admin.html";
  } else {
    error.textContent = "Invalid ID or password!";
  }
});
