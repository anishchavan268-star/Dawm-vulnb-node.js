# Dawm Vulnerable Node.js App

A deliberately vulnerable web application built with Node.js, Express, and SQLite for educational purposes. This application demonstrates common web security vulnerabilities and their mitigations side-by-side.

## Table of Contents
- [Features](#features)
- [Vulnerabilities Demonstrated](#vulnerabilities-demonstrated)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Security Features](#security-features)
- [Project Structure](#project-structure)
- [Educational Goals](#educational-goals)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Dual Implementation**: Both vulnerable and secure versions of the same functionality
- **Authentication System**: Login/Signup with password complexity requirements
- **Plant Store Interface**: Search functionality with XSS demonstrations
- **Multiple Vulnerabilities**: SQL Injection, XSS, SSRF, and more
- **Educational Focus**: Clear examples of vulnerabilities and their fixes

## Vulnerabilities Demonstrated

1. **SQL Injection** - Both classic and UNION-based attacks
2. **Cross-Site Scripting (XSS)** - Reflected XSS in search functionality
3. **Server-Side Request Forgery (SSRF)** - External request endpoint
4. **Weak Authentication** - Plain text password storage (fixed version uses bcrypt)
5. **Missing Input Validation** - Password complexity requirements

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/dawm-vulnerable-node-js-app.git
```

2. Navigate to the project directory:
```bash
cd Dawm-vulnb-node.js
```

3. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
   - Main application: `http://localhost:3000`
   - Secure login: `http://localhost:3000/index.html`
   - Vulnerable login: Click the "Vulnb" button on the main page

3. The server will run on port 3000 by default

## Security Features

### Secure Implementation
- Parameterized SQL queries to prevent SQL injection
- Input sanitization and proper output encoding
- Password hashing with bcrypt
- Password complexity validation (1 capital letter + 1 symbol)
- XSS prevention using DOM methods instead of innerHTML

### Vulnerable Implementation (for educational purposes)
- Direct string concatenation in SQL queries
- Unsafe use of innerHTML with user input
- Plain text password storage (in original version)
- No input validation

## Project Structure

```
.
├── home.html           # Secure home page with XSS protection
├── index.html          # Main login/signup page with tabs
├── vuln_home.html      # Vulnerable home page with XSS
├── vuln_login.html     # Vulnerable login page
├── server.js           # Express server with vulnerable endpoints
├── script.js           # Client-side JavaScript with validation
├── style.css           # Styling for both secure and vulnerable pages
├── package.json        # Project dependencies
└── users.db            # SQLite database file
```

## Educational Goals

This application is designed to help:
- Students understand common web vulnerabilities
- Developers learn secure coding practices
- Security professionals practice penetration testing
- Educators demonstrate security concepts

## Dependencies

- express: ^5.2.1
- sqlite3: ^5.1.7
- bcryptjs: ^2.4.3
- body-parser: ^2.2.1

## Important Security Notes

⚠️ **WARNING**: This application contains intentional security vulnerabilities and should NEVER be deployed in a production environment. It is designed purely for educational purposes in controlled environments.

## Contributing

Contributions to improve the educational value are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add documentation for any new vulnerabilities or features
5. Submit a pull request

## License


This project is educational and intended for learning purposes only. Use responsibly in controlled environments.
