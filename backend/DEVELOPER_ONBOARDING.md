# Developer Onboarding Guide

Welcome to the **InvoiceGen Backend**! This guide is designed to get you up to speed with the project architecture, tech stack, and development workflows so you can start contributing quickly.

---

## 1. Project Overview & Tech Stack

The backend is built with a modern Node.js stack designed for scalability and type safety.

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Validation:** Zod
- **Authentication:** JSON Web Tokens (JWT)
- **Error Tracking:** Sentry
- **Logging:** Winston & Morgan

---

## 2. Prerequisites & Setup

### Prerequisites
- **Node.js**: v18 or higher recommended.
- **MongoDB**: A running local or cloud instance.

### Local Environment Setup

1. **Clone the repository and navigate to the backend folder.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the root of the `backend` directory based on the `.env.example` structure. Required variables typically include:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/invoicegen
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```
4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The server will start (default: `http://localhost:5000`) and automatically reload on file changes using `tsx`.

---

## 3. Project Structure

The project follows a modular, feature-based architecture.

```text
backend/
├── src/
│   ├── config/          # Environment variables, DB connection, logging config
│   ├── middleware/      # Global middlewares (auth, validation, error handling)
│   ├── modules/         # Feature modules (Auth, Users, Clients, Invoices)
│   │   ├── clients/
│   │   │   ├── client.controller.ts
│   │   │   ├── client.model.ts
│   │   │   ├── client.routes.ts
│   │   │   └── client.schema.ts
│   │   └── ...
│   ├── utils/           # Shared utility functions
│   ├── app.ts           # Express app setup and middleware registration
│   └── server.ts        # Server entry point
├── package.json
└── tsconfig.json
```

---

## 4. Development Workflow

### Adding a New Module
When adding a new feature (e.g., `Products`):
1. Create a new folder under `src/modules/products`.
2. Define the Zod schemas in `product.schema.ts`.
3. Create the Mongoose model in `product.model.ts`.
4. Write the business logic in `product.controller.ts`.
5. Map endpoints to controller functions in `product.routes.ts`.
6. Register the new router in `src/app.ts`.

### Error Handling
We use a centralized error-handling middleware (`src/middleware/errorHandler.ts`). 
To throw an error in a controller:
```typescript
const error = new Error('Client not found') as any;
error.statusCode = 404;
error.code = 'NOT_FOUND';
throw error; // Caught by the global error handler
```
*Tip: Zod validation errors are automatically caught and formatted by the `validate` middleware.*

### Coding Standards
- **Type Safety**: Avoid using `any` where possible. Define clear TypeScript interfaces.
- **Async/Await**: Always use `try/catch` blocks inside async controller functions and pass errors to `next(error)`.
- **Validation**: Never trust client input. Always validate `req.body`, `req.params`, and `req.query` using Zod schemas before processing.

---

> [!TIP]
> If you have questions about the API payloads or endpoints, refer to the [API Documentation](API_DOCUMENTATION.md) or the Postman Collection located in the project root.
