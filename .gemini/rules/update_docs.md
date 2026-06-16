# Rule: Keep API Documentation Sync

## Trigger
**ALWAYS RUN THIS RULE** whenever you modify, add, or delete any API endpoint, route, or validation schema in the backend.

## Instructions
1. After successfully implementing a change to an API endpoint or creating a new one, you MUST automatically update the `backend/API_DOCUMENTATION.md` file.
2. Ensure the following details are updated for the modified/new endpoint:
   - The HTTP method and route path (e.g., `POST /api/v1/resource`).
   - Any new or removed required fields in the request body (based on the Zod schema).
   - Expected status codes or error possibilities if they have changed.
3. If the change introduces a new "Scenario" or workflow, add it to the `Workflow Scenarios` section of the documentation.
4. (Optional but recommended) Ask the user if they also want to trigger the "Export to Postman Skill" to keep the Postman collection in sync.

*Note for AI: Do not ask the user for permission to update the documentation. Do it automatically as part of the task completion.*
