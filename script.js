function showForm(formType) {
    // Hide all forms
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected form
    document.getElementById(formType + '-form').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Clear message
    hideMessage();
}

function showMessage(text, isSuccess) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.className = 'message show ' + (isSuccess ? 'success' : 'error');
}

function hideMessage() {
    const messageElement = document.getElementById('message');
    messageElement.className = 'message';
}

function goToVulnerablePage() {
    window.location.href = "vuln_login.html";
}

function signup() {
    const username = document.getElementById('signupUser').value;
    const password = document.getElementById('signupPass').value;
    
    // Password complexity validation
    if (!validatePassword(password)) {
        showMessage('Password must contain at least 1 capital letter and 1 symbol', false);
        return;
    }
    
    // Simple validation
    if (!username || !password) {
        showMessage('Please fill in all fields', false);
        return;
    }
    
    fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(res => res.text())
    .then(data => {
        if (data === "Signup successful") {
            showMessage(data, true);
            // Clear input fields after successful signup
            document.getElementById('signupUser').value = '';
            document.getElementById('signupPass').value = '';
            // Switch to login tab after successful signup
            setTimeout(() => {
                showForm('login');
            }, 1500);
        } else {
            showMessage(data, false);
        }
    })
    .catch(error => {
        showMessage('An error occurred. Please try again.', false);
    });
}

function validatePassword(password) {
    // Check for at least 1 capital letter
    const hasCapital = /[A-Z]/.test(password);
    // Check for at least 1 symbol
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    // Update UI for password requirements
    updatePasswordRequirements(password);
    
    return hasCapital && hasSymbol;
}

function updatePasswordRequirements(password) {
    // Check for at least 1 capital letter
    const hasCapital = /[A-Z]/.test(password);
    // Check for at least 1 symbol
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    // Update requirement indicators
    const capitalReq = document.getElementById('capital-req');
    const symbolReq = document.getElementById('symbol-req');
    
    if (capitalReq) {
        capitalReq.className = 'req-item ' + (hasCapital ? 'met' : 'unmet');
    }
    
    if (symbolReq) {
        symbolReq.className = 'req-item ' + (hasSymbol ? 'met' : 'unmet');
    }
}

// Add event listener for real-time validation
if (document.getElementById('signupPass')) {
    document.getElementById('signupPass').addEventListener('input', function() {
        const password = this.value;
        validatePassword(password);
    });
}

function login() {
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    
    // Simple validation
    if (!username || !password) {
        showMessage('Please fill in all fields', false);
        return;
    }
    
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("user", data.username);
            window.location.href = "home.html";
        } else {
            showMessage(data.message, false);
        }
    })
    .catch(error => {
        showMessage('An error occurred. Please try again.', false);
    });
}
