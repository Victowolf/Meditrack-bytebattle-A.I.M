// public/js/index.js

let currentWallet = "";
let walletConnected = false;

// ✅ Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "ehr123";

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert("🦊 Please install MetaMask!");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    currentWallet = accounts[0];
    walletConnected = true;
    await loadContract();
    document.getElementById("walletDisplay").innerText = `Connected: ${currentWallet}`;
  } catch (err) {
    console.error("MetaMask connection error:", err);
    alert("❌ MetaMask connection failed.");
  }
}

// Auto-detect account switch
if (window.ethereum) {
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (accounts.length > 0) {
      currentWallet = accounts[0];
      document.getElementById("walletDisplay").innerText = `Connected: ${currentWallet}`;
      await loadContract();

      try {
        const contractAdmin = await contract.admin();
        if (currentWallet.toLowerCase() !== contractAdmin.toLowerCase()) {
          alert("Admin account switched. Redirecting to login.");
          window.location.href = "index.html";
        }
      } catch (err) {
        console.error("Error verifying admin:", err);
      }
    } else {
      currentWallet = "";
      walletConnected = false;
      document.getElementById("walletDisplay").innerText = "Not Connected";
      alert("MetaMask disconnected. Redirecting to login.");
      window.location.href = "index.html";
    }
  });
}

async function loginAdmin() {
  const username = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;

  if (!walletConnected) {
    alert("❌ Please connect your MetaMask wallet first.");
    return;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    alert("❌ Invalid username or password.");
    return;
  }

  try {
    await loadContract();
    const contractAdmin = await contract.admin();
    if (currentWallet.toLowerCase() === contractAdmin.toLowerCase()) {
      await contract.login(); // 🔁 Log admin login to blockchain
      window.location.href = "admin.html";
    } else {
      alert("❌ Access denied. This wallet is not the admin.");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Something went wrong during login.");
  }
}