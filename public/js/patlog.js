document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const pud = document.getElementById('pud').value.trim();
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  errorMessage.textContent = '';

  try {
    const response = await fetch('http://localhost:3000/api/patient-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pud, password })
    });



    const result = await response.json();

    if (response.ok) {
      alert('Login successful!');
      localStorage.setItem('pud', pud);
      window.location.href = 'patient.html';// Replace with actual dashboard path
    } else {
      errorMessage.textContent = result.error || 'Login failed';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.textContent = 'Unable to connect to server.';
  }
});