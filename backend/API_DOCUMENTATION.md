# API Documentation

This document outlines the standard responses, status codes, error handling paradigms, and detailed endpoint references for the InvoiceGen API.

---

## 1. Authentication
Most endpoints require authentication via a Bearer Token (JWT).
To authenticate, include the token in the `Authorization` header of your HTTP request:
```http
Authorization: Bearer <your_jwt_token_here>
```

---

## 2. Standard Status Codes & Errors

The API uses conventional HTTP response codes to indicate the success or failure of an API request.

### Success Codes
- **`200 OK`**: The request was successful (used for GET, PATCH, DELETE).
- **`201 Created`**: The request was successful and a new resource was created (used for POST).

### Error Codes
- **`400 Bad Request`**: The request was invalid (e.g., missing required fields, schema validation failed).
- **`401 Unauthorized`**: Authentication failed (e.g., missing or invalid JWT).
- **`403 Forbidden`**: The authenticated user does not have permission to perform the action.
- **`404 Not Found`**: The requested resource could not be found.
- **`500 Internal Server Error`**: An unexpected error occurred on the server.

### Standard Error Response Format
When an error occurs, the API returns a standardized JSON structure:
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "errors": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

---

## 3. Workflow Scenarios

### Scenario A: Discarding/Deleting Data
To discard or remove a record, use the `DELETE` HTTP method. In this system, records are often "soft deleted" (e.g., an `isDeleted` flag is flipped, and a `deletedAt` timestamp is set) to prevent accidental data loss.
- **Example:** Discard an invoice by calling `DELETE /api/v1/invoices/:id`.

### Scenario B: Approving/Finalizing an Invoice
When an invoice is initially created, its status is `draft`. To approve it and mark it ready for the client, you change its status to `sent`. Later, when paid, you change it to `paid`.
- **Example:** 
  ```http
  PATCH /api/v1/invoices/:id
  Content-Type: application/json
  
  {
    "status": "sent"
  }
  ```

### Scenario C: Changing/Editing Data
To edit a record without replacing the entire object, use the `PATCH` HTTP method. You only need to send the fields you wish to change.
- **Example:** Update a client's company name.
  ```http
  PATCH /api/v1/clients/:id
  Content-Type: application/json
  
  {
    "company": "Acme Global Solutions"
  }
  ```

---

## 4. Endpoints Reference

### Health
- **`GET /api/v1/health`**: Check server status.
- **`GET /api/v1/health/ready`**: Check database connectivity.

### Auth
- **`POST /api/v1/auth/register`**: Create a new account.
  - **Body:** `name`, `email`, `password`
- **`POST /api/v1/auth/login`**: Authenticate and receive a JWT.
  - **Body:** `email`, `password`
- **`POST /api/v1/auth/refresh`**: Get a new access token (requires refresh token cookie).
- **`POST /api/v1/auth/logout`**: Terminate the current session.

### Users
- **`GET /api/v1/users/me`**: Get current authenticated user profile.
- **`PATCH /api/v1/users/me`**: Update user profile.
  - **Body (Optional):** `name`, `avatar`, `businessLogo`
- **`POST /api/v1/users/change-password`**: Update password.
  - **Body:** `currentPassword`, `newPassword`

### Clients
- **`POST /api/v1/clients`**: Create a new client.
  - **Body:** `name`, `email` (optional), `phone` (optional), `address` (optional), `company` (optional).
- **`GET /api/v1/clients`**: List all clients for the user.
- **`GET /api/v1/clients/:id`**: Get a specific client.
- **`PATCH /api/v1/clients/:id`**: Update a specific client.
- **`DELETE /api/v1/clients/:id`**: Delete a specific client.

### Invoices
- **`POST /api/v1/invoices`**: Create a new invoice.
  - **Body:** `clientId`, `invoiceNumber`, `date`, `dueDate`, `lineItems` (array of description, quantity, rate), `taxRate` (optional), `status` (optional), `notes` (optional), `terms` (optional).
- **`GET /api/v1/invoices`**: List all invoices for the user.
- **`GET /api/v1/invoices/:id`**: Get a specific invoice.
- **`PATCH /api/v1/invoices/:id`**: Update a specific invoice (e.g., change status, update line items).
- **`DELETE /api/v1/invoices/:id`**: Delete an invoice.
