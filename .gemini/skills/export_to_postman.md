# Export to Postman Skill

## Trigger
Use this skill when the user asks to "export endpoints to Postman", "generate a Postman collection", or "update the Postman collection".

## Instructions
1. **Discover Endpoints**: Scan the backend codebase (e.g., `backend/src/modules/**/*.routes.ts`) to find all defined Express routes and their HTTP methods (GET, POST, PATCH, DELETE).
2. **Identify Request Bodies**: For each endpoint, locate the corresponding validation schema (e.g., Zod schemas in `*.schema.ts`).
3. **Generate Sample Data**: Based on the schema definitions, create sample JSON bodies for the endpoints that require them (usually POST and PATCH).
4. **Construct Collection JSON**: Create a Postman Collection v2.1.0 compatible JSON object. 
   - Add a `{{baseUrl}}` variable at the collection level.
   - Add a `{{token}}` variable at the collection level and configure the collection to use Bearer Auth with this token.
   - Group the endpoints into folders (Items) based on their category/module (e.g., Auth, Users, Clients, Invoices).
5. **Save to File**: Write the final JSON output to a file named `InvoiceGen_Postman_Collection.json` in the project's root directory so the user can easily import it.

## Important Details
- Ensure all route paths correctly use the `{{baseUrl}}` prefix.
- Retain RESTful parameter syntax in Postman format (e.g., convert `/:id` to `/:id` and add it to the URL variables in Postman).
- Make sure to update the JSON carefully so it doesn't contain syntax errors.
