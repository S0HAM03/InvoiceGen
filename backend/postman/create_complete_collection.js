const fs = require('fs');

const collection = {
  info: {
    name: "InvoiceGen Complete API",
    description: "Complete API documentation for the InvoiceGen application, categorized by module.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    {
      key: "baseUrl",
      value: "http://localhost:5000",
      type: "string"
    },
    {
      key: "token",
      value: "",
      type: "string"
    }
  ],
  auth: {
    type: "bearer",
    bearer: [
      {
        key: "token",
        value: "{{token}}",
        type: "string"
      }
    ]
  },
  item: [
    {
      name: "Auth",
      item: [
        {
          name: "Register User",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "John Doe",
                email: "john@example.com",
                password: "password123"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/auth/register",
              host: ["{{baseUrl}}"],
              path: ["api", "auth", "register"]
            }
          }
        },
        {
          name: "Login User",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "    pm.collectionVariables.set('token', jsonData.token);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "john@example.com",
                password: "password123"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/auth/login",
              host: ["{{baseUrl}}"],
              path: ["api", "auth", "login"]
            }
          }
        },
        {
          name: "Refresh Token",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                refreshToken: "YOUR_REFRESH_TOKEN_HERE"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/auth/refresh",
              host: ["{{baseUrl}}"],
              path: ["api", "auth", "refresh"]
            }
          }
        },
        {
          name: "Logout User",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                refreshToken: "YOUR_REFRESH_TOKEN_HERE"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/auth/logout",
              host: ["{{baseUrl}}"],
              path: ["api", "auth", "logout"]
            }
          }
        }
      ]
    },
    {
      name: "Users",
      item: [
        {
          name: "Get Current User",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/users/me",
              host: ["{{baseUrl}}"],
              path: ["api", "users", "me"]
            }
          }
        }
      ]
    },
    {
      name: "Clients",
      item: [
        {
          name: "Create Client",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Acme Corp",
                email: "contact@acmecorp.com",
                phone: "+1-555-0198",
                address: "123 Business Rd, Tech City, TX 75001",
                company: "Acme Corporation"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/clients",
              host: ["{{baseUrl}}"],
              path: ["api", "clients"]
            }
          }
        },
        {
          name: "Get All Clients",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/clients",
              host: ["{{baseUrl}}"],
              path: ["api", "clients"],
              query: [
                { key: "page", value: "1", disabled: true },
                { key: "limit", value: "10", disabled: true },
                { key: "search", value: "acme", disabled: true }
              ]
            }
          }
        },
        {
          name: "Get Client by ID",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/clients/:id",
              host: ["{{baseUrl}}"],
              path: ["api", "clients", ":id"],
              variable: [
                { key: "id", value: "CLIENT_ID_HERE" }
              ]
            }
          }
        },
        {
          name: "Update Client",
          request: {
            method: "PATCH",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Acme Corp Updated",
                phone: "+1-555-1111"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/clients/:id",
              host: ["{{baseUrl}}"],
              path: ["api", "clients", ":id"],
              variable: [
                { key: "id", value: "CLIENT_ID_HERE" }
              ]
            }
          }
        },
        {
          name: "Delete Client",
          request: {
            method: "DELETE",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/clients/:id",
              host: ["{{baseUrl}}"],
              path: ["api", "clients", ":id"],
              variable: [
                { key: "id", value: "CLIENT_ID_HERE" }
              ]
            }
          }
        }
      ]
    },
    {
      name: "Invoices",
      item: [
        {
          name: "Create Invoice",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                clientId: "CLIENT_ID_HERE",
                invoiceNumber: "INV-2023-001",
                date: "2023-10-01T00:00:00.000Z",
                dueDate: "2023-10-31T00:00:00.000Z",
                lineItems: [
                  {
                    description: "Web Development Services",
                    quantity: 40,
                    rate: 100,
                    amount: 4000
                  },
                  {
                    description: "Server Hosting (Annual)",
                    quantity: 1,
                    rate: 200,
                    amount: 200
                  }
                ],
                subtotal: 4200,
                taxRate: 5,
                taxAmount: 210,
                total: 4410,
                status: "sent",
                notes: "Thank you for your business.",
                terms: "Payment due within 30 days."
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/invoices",
              host: ["{{baseUrl}}"],
              path: ["api", "invoices"]
            }
          }
        },
        {
          name: "Get All Invoices",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/invoices",
              host: ["{{baseUrl}}"],
              path: ["api", "invoices"],
              query: [
                { key: "page", value: "1", disabled: true },
                { key: "limit", value: "10", disabled: true },
                { key: "status", value: "draft", disabled: true }
              ]
            }
          }
        },
        {
          name: "Get Invoice by ID",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/invoices/:id",
              host: ["{{baseUrl}}"],
              path: ["api", "invoices", ":id"],
              variable: [
                { key: "id", value: "INVOICE_ID_HERE" }
              ]
            }
          }
        },
        {
          name: "Update Invoice",
          request: {
            method: "PATCH",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                status: "paid"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/invoices/:id",
              host: ["{{baseUrl}}"],
              path: ["api", "invoices", ":id"],
              variable: [
                { key: "id", value: "INVOICE_ID_HERE" }
              ]
            }
          }
        },
        {
          name: "Delete Invoice",
          request: {
            method: "DELETE",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/invoices/:id",
              host: ["{{baseUrl}}"],
              path: ["api", "invoices", ":id"],
              variable: [
                { key: "id", value: "INVOICE_ID_HERE" }
              ]
            }
          }
        }
      ]
    }
  ]
};

fs.writeFileSync('complete_collection.json', JSON.stringify(collection, null, 2));
console.log('Collection generated at complete_collection.json');
