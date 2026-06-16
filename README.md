# Invoice Generator Backend

A secure, production-ready backend service for managing invoices and client information. Built with Node.js, Express, TypeScript, and MongoDB, this API provides comprehensive invoice management capabilities with a React frontend.

🔗 **Live Demo**: https://invoicegen-22l6.onrender.com/login

## 📋 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Security](#security)

## Introduction

The Invoice Generator Backend is a full-featured REST API designed to streamline invoice and client management workflows. It provides secure authentication, comprehensive CRUD operations for invoices and clients, and is deployed and accessible at https://invoicegen-22l6.onrender.com/login.

## ✨ Features

### Authentication & Authorization
- **Secure User Registration**: Create new user accounts with encrypted password storage
- **Login System**: Email and password-based authentication
- **JWT Token Management**: 
  - Short-lived access tokens for API requests
  - Long-lived refresh tokens stored in HttpOnly secure cookies
- **Token Refresh**: Seamlessly renew access tokens without re-authentication
- **Secure Logout**: Invalidate sessions and clear authentication cookies
- **Password Security**: Passwords hashed using bcryptjs with salt rounds

### Client Management
- **Create Clients**: Add new clients with comprehensive details
- **Retrieve Clients**: Fetch individual or all clients associated with the authenticated user
- **Update Clients**: Modify client information
- **Delete Clients**: Remove clients from the system
- **User Isolation**: Clients are strictly isolated to the authenticated user

### Invoice Management
- **Create Invoices**: Generate new invoices with line items
- **Retrieve Invoices**: Access individual or all invoices for the authenticated user
- **Update Invoices**: Modify invoice details and line items
- **Delete Invoices**: Remove invoices from the system
- **Automatic Calculations**:
  - Line item subtotals
  - Tax amount calculations
  - Final invoice totals
- **User Isolation**: Invoices are strictly isolated to the authenticated user

### User Profile
- **Profile Retrieval**: Access the authenticated user's profile information

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | - | JavaScript runtime |
| **Express** | v4 | Web framework and routing |
| **TypeScript** | - | Type-safe JavaScript |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | - | MongoDB object modeling |
| **JWT** | - | Secure token-based authentication |
| **bcryptjs** | - | Password hashing and encryption |
| **Zod** | - | Schema validation and parsing |
| **Helmet** | - | HTTP security headers |
| **CORS** | - | Cross-origin request handling |
| **express-rate-limit** | - | Request rate limiting |
| **express-mongo-sanitize** | - | NoSQL injection prevention |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher (comes with Node.js)
- **MongoDB**: v4.4 or higher (local or cloud instance via MongoDB Atlas)
- **Git**: For cloning the repository

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/S0HAM03/InvoiceGen.git
cd InvoiceGen
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in your configuration details:

```bash
cp .env.example .env
```

Edit the `.env` file with your values (see [Environment Variables](#environment-variables) section below).

### 4. Start Development Server

Run the development server with hot-reload:

```bash
npm run dev
```

The server will start and watch for file changes. By default, the server runs on `http://localhost:3000`.

### 5. Build for Production

To create an optimized production build:

```bash
npm run build
```

### 6. Start Production Server

```bash
npm start
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| `PORT` | Number | No | Server port | `3000` |
| `NODE_ENV` | String | No | Execution environment | `development`, `production` |
| `DATABASE_URL` | String | Yes | MongoDB connection string | `mongodb://localhost:27017/invoicegen` or `mongodb+srv://user:password@cluster.mongodb.net/invoicegen` |
| `JWT_SECRET` | String | Yes | Secret key for signing JWT tokens | `your-secret-key-here-min-32-chars` |
| `JWT_EXPIRY` | String | No | Access token expiration time | `15m`, `1h` |
| `REFRESH_TOKEN_EXPIRY` | String | No | Refresh token expiration time | `7d`, `30d` |
| `CORS_ORIGIN` | String | No | Allowed CORS origin(s) | `http://localhost:3000`, `https://yourdomain.com` |
| `RATE_LIMIT_WINDOW_MS` | Number | No | Rate limit window in milliseconds | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Number | No | Maximum requests per window | `100` |

### Example `.env` File

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/invoicegen
JWT_SECRET=your-super-secret-key-with-minimum-32-characters-long
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📡 API Overview

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints
```
POST   /auth/register          - Register a new user
POST   /auth/login             - Login and receive tokens
POST   /auth/refresh           - Refresh access token
POST   /auth/logout            - Logout and clear session
```

### User Endpoints
```
GET    /users/me               - Get authenticated user profile
```

### Client Endpoints
```
GET    /clients                - List all clients (authenticated user)
GET    /clients/:id            - Get a specific client
POST   /clients                - Create a new client
PUT    /clients/:id            - Update a client
DELETE /clients/:id            - Delete a client
```

### Invoice Endpoints
```
GET    /invoices               - List all invoices (authenticated user)
GET    /invoices/:id           - Get a specific invoice
POST   /invoices               - Create a new invoice
PUT    /invoices/:id           - Update an invoice
DELETE /invoices/:id           - Delete an invoice
```

### Response Format

All endpoints return standardized JSON responses:

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "...": "..."
  },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "statusCode": 400
}
```

## 🔒 Security

This backend implements multiple layers of security:

### Input Validation
- All request inputs are validated using **Zod** schemas
- Strict type checking prevents invalid data from reaching the database

### Authentication & Authorization
- **JWT-based authentication** with short-lived access tokens and long-lived refresh tokens
- **HttpOnly cookies** for secure token storage
- **Password hashing** using bcryptjs with industry-standard salt rounds
- **Resource ownership verification** ensures users can only access their own data

### Middleware Security
- **Helmet**: Secures HTTP headers against common vulnerabilities
- **CORS**: Restricts API access to authorized origins
- **express-rate-limit**: Prevents brute-force attacks and DDoS
- **express-mongo-sanitize**: Prevents NoSQL injection attacks

### Data Protection
- **IDOR Prevention**: Strict ownership checks on all resource access
- **Error Handling**: Global error middleware returns standardized responses without exposing sensitive information
- **Database Security**: Mongoose schema validation and MongoDB best practices

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**S0HAM03** - [GitHub Profile](https://github.com/S0HAM03)

---

For support or questions, please open an issue on the [GitHub repository](https://github.com/S0HAM03/InvoiceGen).
