import 'dotenv/config';
import fs from 'fs';

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const req = async (method, path, body, token) => {
  try {
    await new Promise(r => setTimeout(r, 200)); const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, data };
  } catch (error) {
    return { status: 'error', data: error.message };
  }
};

const run = async () => {
  const results = [];
  
  const log = (name, res) => {
    results.push({ name, status: res.status, data: res.data });
    console.log(`[${res.status}] ${name}`);
  };

  const ts = Date.now();
  const testEmail = `test_${ts}@example.com`;
  const invalidEmail = `invalid_email`;
  const password = `Pass123!`;
  
  // --- AUTH TESTS ---
  log('Auth: Register valid user', await req('POST', '/auth/register', { name: 'Test', email: testEmail, password }));
  log('Auth: Register duplicate email', await req('POST', '/auth/register', { name: 'Test2', email: testEmail, password }));
  log('Auth: Register missing fields', await req('POST', '/auth/register', { name: 'Test3' }));
  log('Auth: Register invalid email', await req('POST', '/auth/register', { name: 'Test4', email: invalidEmail, password }));
  
  const loginRes = await req('POST', '/auth/login', { email: testEmail, password });
  log('Auth: Login valid user', loginRes);
  const token = loginRes.data?.data?.accessToken;
  const userId = loginRes.data?.data?._id;
  
  log('Auth: Login wrong password', await req('POST', '/auth/login', { email: testEmail, password: 'wrongpassword' }));
  log('Auth: Login missing fields', await req('POST', '/auth/login', { email: testEmail }));
  log('Auth: Get Profile without token', await req('GET', '/users/me', null, null));
  log('Auth: Get Profile with valid token', await req('GET', '/users/me', null, token));

  // --- CLIENT TESTS ---
  log('Client: Create without token', await req('POST', '/clients', { name: 'Acme', email: 'acme@test.com' }, null));
  
  const clientRes1 = await req('POST', '/clients', { name: 'Acme Corp', email: 'acme@test.com', phone: '1234567890' }, token);
  log('Client: Create valid', clientRes1);
  const clientId = clientRes1.data?.data?._id;
  
  log('Client: Create missing required name', await req('POST', '/clients', { email: 'no_name@test.com' }, token));
  log('Client: Create duplicate email for same user', await req('POST', '/clients', { name: 'Acme Corp 2', email: 'acme@test.com' }, token));
  
  log('Client: Get all clients', await req('GET', '/clients', null, token));
  log('Client: Get single client', await req('GET', `/clients/${clientId}`, null, token));
  log('Client: Get non-existent client', await req('GET', `/clients/64b5f1f9a2b9a70012345678`, null, token));
  
  log('Client: Update client', await req('PATCH', `/clients/${clientId}`, { company: 'Acme LLC' }, token));
  log('Client: Update non-existent client', await req('PATCH', `/clients/64b5f1f9a2b9a70012345678`, { company: 'Acme LLC' }, token));

  // --- INVOICE TESTS ---
  log('Invoice: Create without token', await req('POST', '/invoices', { clientId, invoiceNumber: `INV-${ts}` }, null));
  
  const invRes1 = await req('POST', '/invoices', {
    clientId,
    invoiceNumber: `INV-${ts}`,
    date: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    status: 'draft',
    lineItems: [{ description: 'Dev Work', quantity: 10, rate: 50, amount: 500 }],
    taxRate: 10
  }, token);
  log('Invoice: Create valid', invRes1);
  const invoiceId = invRes1.data?.data?._id;
  
  log('Invoice: Create missing clientId', await req('POST', '/invoices', { invoiceNumber: `INV-2-${ts}` }, token));
  log('Invoice: Create with invalid status', await req('POST', '/invoices', { clientId, invoiceNumber: `INV-3-${ts}`, status: 'invalid_status' }, token));
  
  log('Invoice: Get all invoices', await req('GET', '/invoices', null, token));
  log('Invoice: Get single invoice', await req('GET', `/invoices/${invoiceId}`, null, token));
  log('Invoice: Get non-existent invoice', await req('GET', `/invoices/64b5f1f9a2b9a70012345678`, null, token));
  
  log('Invoice: Update invoice status', await req('PATCH', `/invoices/${invoiceId}`, { status: 'sent' }, token));
  log('Invoice: Update lineItems directly (recalculate test)', await req('PATCH', `/invoices/${invoiceId}`, { 
    lineItems: [{ description: 'Dev Work', quantity: 5, rate: 50, amount: 250 }]
  }, token));

  // --- DELETE TESTS ---
  log('Invoice: Delete invoice', await req('DELETE', `/invoices/${invoiceId}`, null, token));
  log('Invoice: Delete non-existent invoice', await req('DELETE', `/invoices/64b5f1f9a2b9a70012345678`, null, token));
  
  log('Client: Delete client', await req('DELETE', `/clients/${clientId}`, null, token));
  log('Client: Delete non-existent client', await req('DELETE', `/clients/64b5f1f9a2b9a70012345678`, null, token));

  fs.writeFileSync('scratch_results.json', JSON.stringify({ userId, clientId, invoiceId, results }, null, 2));
  console.log('Done.');
};

run();
