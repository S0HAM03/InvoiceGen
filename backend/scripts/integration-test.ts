import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/modules/users/user.model';
import { Client } from '../src/modules/clients/client.model';
import { Invoice } from '../src/modules/invoices/invoice.model';
import { Session } from '../src/modules/auth/session.model';

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api/v1`;
const ROOT_URL = `http://localhost:${PORT}`;

const TEST_EMAIL = 'finaltest@example.com';
const TEST_PASSWORD = 'FinalTest@2026!';
const NEW_PASSWORD = 'NewPassword@2026!';

let token = '';
let userId = '';
let clientId = '';
let invoiceId = '';
let sessionId = '';

let passed = 0;
let failed = 0;

const assert = (condition: any, message: string) => {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
    return false;
  }
  console.log(`  ✅ PASS: ${message}`);
  passed++;
  return true;
};

const req = async (method: string, path: string, body?: any, useRoot = false) => {
  const base = useRoot ? ROOT_URL : BASE_URL;
  const res = await fetch(`${base}${path}`, {
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
};

const runTests = async () => {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   INVOICEGEN — FINAL INTEGRATION TEST SUITE   ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  // Connect to DB
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('✅ Connected to MongoDB.\n');

  // Cleanup old test data
  console.log('🧹 Cleaning up old test data...');
  const existingUser = await User.findOne({ email: TEST_EMAIL });
  if (existingUser) {
    await Client.deleteMany({ userId: existingUser._id });
    await Invoice.deleteMany({ userId: existingUser._id });
    await Session.deleteMany({ user: existingUser._id });
    await User.deleteOne({ email: TEST_EMAIL });
  }
  // Also clean up with new password email (in case previous test changed password)
  const existingUser2 = await User.findOne({ email: TEST_EMAIL });
  if (existingUser2) {
    await User.deleteOne({ email: TEST_EMAIL });
  }
  console.log('✅ Cleanup complete.\n');

  try {
    // ────────────────────────────────────────────────
    // SECTION 1: HEALTH & ROOT
    // ────────────────────────────────────────────────
    console.log('━━━ 1. HEALTH & ROOT ENDPOINTS ━━━');

    const rootRes = await req('GET', '/', undefined, true);
    assert(rootRes.status === 200, 'GET / — Root returns 200');
    assert(rootRes.data.status === 'online', 'GET / — Returns status: online');

    const healthRes = await req('GET', '/health');
    assert(healthRes.status === 200, 'GET /health — Returns 200');
    assert(healthRes.data.success === true, 'GET /health — success: true');

    const readyRes = await req('GET', '/health/ready');
    assert(readyRes.status === 200, 'GET /health/ready — Returns 200');
    assert(readyRes.data.message?.includes('connected'), 'GET /health/ready — DB connected');

    // ────────────────────────────────────────────────
    // SECTION 2: AUTH — REGISTRATION & LOGIN
    // ────────────────────────────────────────────────
    console.log('\n━━━ 2. AUTH — REGISTER & LOGIN ━━━');

    const regRes = await req('POST', '/auth/register', {
      name: 'Final Tester',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(regRes.status === 201, 'POST /auth/register — User registered (201)');
    assert(regRes.data.data?.email === TEST_EMAIL, 'POST /auth/register — Correct email returned');
    assert(regRes.data.data?.accessToken, 'POST /auth/register — Access token returned');

    // DB Verification
    const dbUser = await User.findOne({ email: TEST_EMAIL });
    assert(dbUser !== null, '🗄️ DB — User exists in MongoDB after registration');

    // Duplicate registration
    const dupRes = await req('POST', '/auth/register', {
      name: 'Duplicate',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(dupRes.status === 409, 'POST /auth/register — Duplicate email returns 409');

    // Login
    const loginRes = await req('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(loginRes.status === 200, 'POST /auth/login — Login successful (200)');
    assert(loginRes.data.data?.accessToken, 'POST /auth/login — Access token returned');

    token = loginRes.data.data.accessToken;
    userId = loginRes.data.data._id;

    // Bad login
    const badLoginRes = await req('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: 'WrongPassword123!',
    });
    assert(badLoginRes.status === 401, 'POST /auth/login — Wrong password returns 401');

    // ────────────────────────────────────────────────
    // SECTION 3: AUTH — FORGOT/RESET PASSWORD (MOCK)
    // ────────────────────────────────────────────────
    console.log('\n━━━ 3. AUTH — FORGOT/RESET PASSWORD ━━━');

    const forgotRes = await req('POST', '/auth/forgot-password', {
      email: TEST_EMAIL,
    });
    assert(forgotRes.status === 200, 'POST /auth/forgot-password — Returns 200');

    const forgotNonExist = await req('POST', '/auth/forgot-password', {
      email: 'nonexistent@test.com',
    });
    assert(forgotNonExist.status === 200, 'POST /auth/forgot-password — Non-existent email still returns 200 (no enumeration)');

    const resetRes = await req('POST', '/auth/reset-password', {
      token: 'mock-token',
      password: 'NewMockPassword1!',
    });
    assert(resetRes.status === 200, 'POST /auth/reset-password — Mock reset returns 200');

    // ────────────────────────────────────────────────
    // SECTION 4: USER PROFILE
    // ────────────────────────────────────────────────
    console.log('\n━━━ 4. USER PROFILE ━━━');

    const getMeRes = await req('GET', '/users/me');
    assert(getMeRes.status === 200, 'GET /users/me — Returns 200');
    assert(getMeRes.data.data?.email === TEST_EMAIL, 'GET /users/me — Returns correct email');
    assert(getMeRes.data.data?.name === 'Final Tester', 'GET /users/me — Returns correct name');

    const updateMeRes = await req('PATCH', '/users/me', {
      name: 'Updated Tester',
      avatar: 'https://example.com/avatar.png',
    });
    assert(updateMeRes.status === 200, 'PATCH /users/me — Profile updated (200)');
    assert(updateMeRes.data.data?.name === 'Updated Tester', 'PATCH /users/me — Name updated correctly');

    // DB Verification
    const dbUpdatedUser = await User.findById(userId);
    assert(dbUpdatedUser?.name === 'Updated Tester', '🗄️ DB — User name updated in MongoDB');

    // Unauthorized access
    const savedToken = token;
    token = '';
    const noAuthRes = await req('GET', '/users/me');
    assert(noAuthRes.status === 401, 'GET /users/me — No token returns 401');
    token = savedToken;

    // ────────────────────────────────────────────────
    // SECTION 5: USER — SESSIONS
    // ────────────────────────────────────────────────
    console.log('\n━━━ 5. USER — SESSIONS ━━━');

    const sessionsRes = await req('GET', '/users/sessions');
    assert(sessionsRes.status === 200, 'GET /users/sessions — Returns 200');
    assert(Array.isArray(sessionsRes.data.data), 'GET /users/sessions — Returns array');
    assert(sessionsRes.data.data.length >= 1, 'GET /users/sessions — At least 1 session exists');

    if (sessionsRes.data.data.length > 0) {
      sessionId = sessionsRes.data.data[0]._id;
      const revokeRes = await req('DELETE', `/users/sessions/${sessionId}`);
      assert(revokeRes.status === 200, 'DELETE /users/sessions/:id — Session revoked (200)');

      // DB Verification
      const dbSession = await Session.findById(sessionId);
      assert(dbSession?.isValid === false, '🗄️ DB — Session marked as invalid in MongoDB');
    }

    // ────────────────────────────────────────────────
    // SECTION 6: USER — CHANGE PASSWORD
    // ────────────────────────────────────────────────
    console.log('\n━━━ 6. USER — CHANGE PASSWORD ━━━');

    const changePwRes = await req('POST', '/users/change-password', {
      currentPassword: TEST_PASSWORD,
      newPassword: NEW_PASSWORD,
    });
    assert(changePwRes.status === 200, 'POST /users/change-password — Password changed (200)');

    // Re-login with new password
    const reLoginRes = await req('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: NEW_PASSWORD,
    });
    assert(reLoginRes.status === 200, 'POST /auth/login — Login with new password succeeds');
    token = reLoginRes.data.data.accessToken;
    
    // Old password should fail
    const oldPwRes = await req('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(oldPwRes.status === 401, 'POST /auth/login — Old password no longer works (401)');

    // ────────────────────────────────────────────────
    // SECTION 7: CLIENTS — FULL CRUD
    // ────────────────────────────────────────────────
    console.log('\n━━━ 7. CLIENTS — FULL CRUD ━━━');

    // Create
    const createClientRes = await req('POST', '/clients', {
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '9876543210',
      company: 'Acme Inc',
      address: '123 Main Street',
    });
    assert(createClientRes.status === 201, 'POST /clients — Client created (201)');
    clientId = createClientRes.data.data._id;

    // DB Verification
    const dbClient = await Client.findById(clientId);
    assert(dbClient !== null && dbClient.name === 'Acme Corp', '🗄️ DB — Client exists in MongoDB');

    // Create second client for list testing
    const createClient2Res = await req('POST', '/clients', {
      name: 'Beta LLC',
      email: 'info@beta.com',
      company: 'Beta LLC',
    });
    assert(createClient2Res.status === 201, 'POST /clients — Second client created (201)');
    const client2Id = createClient2Res.data.data._id;

    // Get all clients
    const getClientsRes = await req('GET', '/clients');
    assert(getClientsRes.status === 200, 'GET /clients — List clients (200)');
    assert(getClientsRes.data.data.length >= 2, 'GET /clients — At least 2 clients returned');
    assert(getClientsRes.data.pagination, 'GET /clients — Pagination metadata present');

    // Get single client
    const getClientRes = await req('GET', `/clients/${clientId}`);
    assert(getClientRes.status === 200, 'GET /clients/:id — Single client (200)');
    assert(getClientRes.data.data.name === 'Acme Corp', 'GET /clients/:id — Correct client returned');

    // Update client
    const updateClientRes = await req('PATCH', `/clients/${clientId}`, {
      company: 'Acme Global',
      address: '456 New Street',
    });
    assert(updateClientRes.status === 200, 'PATCH /clients/:id — Client updated (200)');

    // DB Verification
    const dbClientUpdated = await Client.findById(clientId);
    assert(dbClientUpdated?.company === 'Acme Global', '🗄️ DB — Client company updated in MongoDB');
    assert(dbClientUpdated?.address === '456 New Street', '🗄️ DB — Client address updated in MongoDB');

    // Delete second client
    const deleteClient2Res = await req('DELETE', `/clients/${client2Id}`);
    assert(deleteClient2Res.status === 200, 'DELETE /clients/:id — Client soft-deleted (200)');

    // DB Verification — soft delete
    const dbClientDeleted = await Client.findById(client2Id);
    assert(dbClientDeleted?.isDeleted === true, '🗄️ DB — Client isDeleted=true in MongoDB');

    // ────────────────────────────────────────────────
    // SECTION 8: INVOICES — FULL CRUD
    // ────────────────────────────────────────────────
    console.log('\n━━━ 8. INVOICES — FULL CRUD ━━━');

    // Create Draft Invoice
    const createInvRes = await req('POST', '/invoices', {
      clientId,
      invoiceNumber: 'INV-FINAL-001',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'draft',
      lineItems: [
        { description: 'Web Development', quantity: 40, rate: 75, amount: 3000 },
        { description: 'UI/UX Design', quantity: 20, rate: 60, amount: 1200 },
      ],
      taxRate: 18,
      notes: 'Payment due within 30 days.',
      terms: 'Net 30',
    });
    assert(createInvRes.status === 201, 'POST /invoices — Draft invoice created (201)');
    invoiceId = createInvRes.data.data._id;

    // DB Verification
    const dbInvoice = await Invoice.findById(invoiceId);
    assert(dbInvoice !== null, '🗄️ DB — Invoice exists in MongoDB');
    assert(dbInvoice?.status === 'draft', '🗄️ DB — Invoice status is "draft"');
    assert(dbInvoice?.subtotal === 4200, '🗄️ DB — Subtotal calculated correctly (3000+1200=4200)');
    assert(dbInvoice?.taxAmount === 756, '🗄️ DB — Tax amount correct (4200 * 18% = 756)');
    assert(dbInvoice?.total === 4956, '🗄️ DB — Total correct (4200 + 756 = 4956)');
    assert(dbInvoice?.lineItems.length === 2, '🗄️ DB — 2 line items stored');

    // Create second invoice for list testing
    const createInv2Res = await req('POST', '/invoices', {
      clientId,
      invoiceNumber: 'INV-FINAL-002',
      date: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      lineItems: [
        { description: 'Consultation', quantity: 5, rate: 100, amount: 500 },
      ],
      taxRate: 10,
    });
    assert(createInv2Res.status === 201, 'POST /invoices — Second invoice created (201)');
    const invoice2Id = createInv2Res.data.data._id;

    // Get all invoices
    const getInvsRes = await req('GET', '/invoices');
    assert(getInvsRes.status === 200, 'GET /invoices — List invoices (200)');
    assert(getInvsRes.data.data.length >= 2, 'GET /invoices — At least 2 invoices returned');
    assert(getInvsRes.data.pagination, 'GET /invoices — Pagination metadata present');

    // Get single invoice
    const getInvRes = await req('GET', `/invoices/${invoiceId}`);
    assert(getInvRes.status === 200, 'GET /invoices/:id — Single invoice (200)');
    assert(getInvRes.data.data.invoiceNumber === 'INV-FINAL-001', 'GET /invoices/:id — Correct invoice returned');

    // Update invoice status to "sent"
    const sendInvRes = await req('PATCH', `/invoices/${invoiceId}`, {
      status: 'sent',
    });
    assert(sendInvRes.status === 200, 'PATCH /invoices/:id — Status changed to "sent" (200)');

    // DB Verification
    const dbInvoiceSent = await Invoice.findById(invoiceId);
    assert(dbInvoiceSent?.status === 'sent', '🗄️ DB — Invoice status changed to "sent"');

    // Update line items (should recalculate totals)
    const updateInvRes = await req('PATCH', `/invoices/${invoiceId}`, {
      lineItems: [
        { description: 'Web Development', quantity: 50, rate: 80, amount: 4000 },
      ],
    });
    assert(updateInvRes.status === 200, 'PATCH /invoices/:id — Line items updated (200)');

    // DB Verification — recalculated totals
    const dbInvoiceUpdated = await Invoice.findById(invoiceId);
    assert(dbInvoiceUpdated?.subtotal === 4000, '🗄️ DB — Subtotal recalculated (4000)');
    assert(dbInvoiceUpdated?.total === 4720, '🗄️ DB — Total recalculated (4000 + 18% = 4720)');

    // Filter invoices by status
    const filteredInvs = await req('GET', '/invoices?status=draft');
    assert(filteredInvs.status === 200, 'GET /invoices?status=draft — Filtered query works (200)');

    // Filter by clientId
    const clientFilteredInvs = await req('GET', `/invoices?clientId=${clientId}`);
    assert(clientFilteredInvs.status === 200, 'GET /invoices?clientId=X — Client filter works (200)');

    // Delete invoice (soft delete)
    const deleteInvRes = await req('DELETE', `/invoices/${invoice2Id}`);
    assert(deleteInvRes.status === 200, 'DELETE /invoices/:id — Invoice soft-deleted (200)');

    // DB Verification
    const dbInvDeleted = await Invoice.findById(invoice2Id);
    assert(dbInvDeleted?.isDeleted === true, '🗄️ DB — Invoice isDeleted=true in MongoDB');

    // Deleted invoice should return 404
    const getDeletedInv = await req('GET', `/invoices/${invoice2Id}`);
    assert(getDeletedInv.status === 404, 'GET /invoices/:id — Deleted invoice returns 404');

    // ────────────────────────────────────────────────
    // SECTION 9: 404 HANDLER
    // ────────────────────────────────────────────────
    console.log('\n━━━ 9. ERROR HANDLING ━━━');

    const notFoundRes = await req('GET', '/nonexistent-route');
    assert(notFoundRes.status === 404, 'GET /nonexistent — Returns 404');
    assert(notFoundRes.data?.error?.code === 'NOT_FOUND', 'GET /nonexistent — Error code is NOT_FOUND');

    // Invalid ObjectId
    const badIdRes = await req('GET', '/clients/invalid-id-here');
    assert(badIdRes.status === 404 || badIdRes.status === 400, 'GET /clients/badId — Returns 404 or 400');

    // ────────────────────────────────────────────────
    // SECTION 10: AUTH — LOGOUT
    // ────────────────────────────────────────────────
    console.log('\n━━━ 10. AUTH — LOGOUT ━━━');

    const logoutAllRes = await req('POST', '/auth/logout-all');
    assert(logoutAllRes.status === 200, 'POST /auth/logout-all — Logout all sessions (200)');

    // DB Verification — all sessions invalidated
    const activeSessions = await Session.find({ user: userId, isValid: true });
    assert(activeSessions.length === 0, '🗄️ DB — All sessions invalidated after logout-all');

    const logoutRes = await req('POST', '/auth/logout');
    assert(logoutRes.status === 200, 'POST /auth/logout — Logout single session (200)');

    // ════════════════════════════════════════════════
    // RESULTS
    // ════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log(`║   RESULTS: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 22 - `${passed} passed, ${failed} failed`.length))}║`);
    if (failed === 0) {
      console.log('║   🎉 ALL TESTS PASSED!                        ║');
    } else {
      console.log('║   ⚠️  SOME TESTS FAILED                       ║');
    }
    console.log('╚═══════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n💥 Test Execution Crashed:', error);
    process.exit(1);
  } finally {
    // Final DB cleanup
    console.log('🧹 Final cleanup...');
    await Client.deleteMany({ userId });
    await Invoice.deleteMany({ userId });
    await Session.deleteMany({ user: userId });
    await User.deleteOne({ email: TEST_EMAIL });
    await mongoose.disconnect();
    console.log('✅ Database cleaned up and connection closed.');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
