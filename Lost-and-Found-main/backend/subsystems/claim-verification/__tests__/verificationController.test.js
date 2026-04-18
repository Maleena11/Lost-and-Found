/**
 * Claim Verification Subsystem — Integration Tests
 *
 * Covers the full user journey:
 *   Student submits claim → Admin reviews (3-stage) → Admin approves → PIN sent →
 *   Student collects item → Admin confirms with PIN → Claim closed
 *
 * Also covers: rejection, duplicate prevention, wrong PIN, expired PIN,
 *              claim history audit trail, and get-by-email / get-by-item queries.
 *
 * Tools: Jest (test runner) + Supertest (HTTP assertions) + MongoMemoryServer (in-memory DB)
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

// ── Silence non-fatal console noise during tests ─────────────────────────────
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// ── Mock email service (no real SMTP in tests) ────────────────────────────────
jest.mock('../../../utils/emailService', () => ({
  sendClaimConfirmation: jest.fn().mockResolvedValue(true),
  sendApprovalWithPin:   jest.fn().mockResolvedValue(true),
  sendCollectionReceipt: jest.fn().mockResolvedValue(true),
}));

// ── Mock Socket.IO (no real WS server in tests) ───────────────────────────────
jest.mock('../../../socketInstance', () => ({
  getIO: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  })),
}));

// ── Models (loaded AFTER mongoose connection is set up) ───────────────────────
const verificationRoutes = require('../routes/verificationRoutes');
const LostFoundItem      = require('../../lost-found-reporting/models/LostFoundItem');
const VerificationRequest = require('../models/VerificationRequest');
const ClaimHistory        = require('../models/ClaimHistory');

// ── Minimal Express app (mirrors index.js wiring, without DB connect call) ────
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/api/verification', verificationRoutes);

// ── Test fixtures ─────────────────────────────────────────────────────────────
const claimantInfo = {
  name:    'Kumudi Wickramasinghe',
  email:   'it21234567@student.sliit.lk',
  phone:   '0771234567',
  address: 'No 10, Malabe, Colombo',
};

const verificationDetails = {
  description:    'My black laptop bag with SLIIT sticker. Has a small tear on the right side handle.',
  ownershipProof: 'I have purchase receipt and the serial number of the laptop inside is SN-123456.',
  additionalInfo: 'Lost on 2024-03-10 near the Library.',
};

// ── MongoDB in-memory setup / teardown ────────────────────────────────────────
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Clean collections between tests
afterEach(async () => {
  await VerificationRequest.deleteMany({});
  await ClaimHistory.deleteMany({});
  await LostFoundItem.deleteMany({});
});

// ── Helper: seed a found item ─────────────────────────────────────────────────
async function seedFoundItem(overrides = {}) {
  return LostFoundItem.create({
    userId:      'admin-user-01',
    itemType:    'found',
    itemName:    'Black Laptop Bag',
    category:    'laptop-tablet',
    description: 'Black laptop bag found near the library entrance.',
    location:    'Library – Ground Floor',
    dateTime:    new Date('2024-03-10T10:00:00Z'),
    status:      'pending',
    ...overrides,
  });
}

// ── Helper: create a claim via API ────────────────────────────────────────────
async function submitClaim(itemId, infoOverrides = {}) {
  return request(app)
    .post('/api/verification')
    .send({
      itemId,
      claimantInfo: { ...claimantInfo, ...infoOverrides },
      verificationDetails,
      claimantImages: [],
    });
}

// =============================================================================
// TEST SUITES
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
describe('1. Student submits a claim', () => {
// ─────────────────────────────────────────────────────────────────────────────

  test('TC-01 | Successfully submit a claim for a found item', async () => {
    const item = await seedFoundItem();

    const res = await submitClaim(item._id.toString());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.claimantInfo.email).toBe(claimantInfo.email);
  });

  test('TC-02 | Reject claim if item does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await submitClaim(fakeId);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/item not found/i);
  });

  test('TC-03 | Reject claim if item type is "lost" (not claimable)', async () => {
    const item = await seedFoundItem({ itemType: 'lost' });

    const res = await submitClaim(item._id.toString());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/found items/i);
  });

  test('TC-04 | Reject claim if item is already claimed / no longer pending', async () => {
    const item = await seedFoundItem({ status: 'claimed' });

    const res = await submitClaim(item._id.toString());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no longer available/i);
  });

  test('TC-05 | Prevent duplicate pending claim from the same student email', async () => {
    const item = await seedFoundItem();

    await submitClaim(item._id.toString()); // first claim
    const res = await submitClaim(item._id.toString()); // duplicate

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already have a pending/i);
  });

  test('TC-06 | Two different students can claim the same item (competing claims)', async () => {
    const item = await seedFoundItem();

    const r1 = await submitClaim(item._id.toString(), { email: 'it21000001@student.sliit.lk' });
    const r2 = await submitClaim(item._id.toString(), { email: 'it21000002@student.sliit.lk' });

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);

    const count = await VerificationRequest.countDocuments({ itemId: item._id });
    expect(count).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('2. Admin retrieves claims', () => {
// ─────────────────────────────────────────────────────────────────────────────

  test('TC-07 | Admin gets all verification requests', async () => {
    const item = await seedFoundItem();
    await submitClaim(item._id.toString(), { email: 'it21000001@student.sliit.lk' });
    await submitClaim(item._id.toString(), { email: 'it21000002@student.sliit.lk' });

    const res = await request(app).get('/api/verification');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
  });

  test('TC-08 | Get a single claim by ID', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app).get(`/api/verification/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  test('TC-09 | Return 404 for a non-existent claim ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/verification/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('TC-10 | Get all claims by student email (student account page)', async () => {
    const item1 = await seedFoundItem({ itemName: 'Item A' });
    const item2 = await seedFoundItem({ itemName: 'Item B' });

    await submitClaim(item1._id.toString());
    await submitClaim(item2._id.toString());

    const res = await request(app).get(`/api/verification/user/${claimantInfo.email}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  test('TC-11 | Get all claims for a specific item (competing claims view)', async () => {
    const item = await seedFoundItem();
    await submitClaim(item._id.toString(), { email: 'it21000001@student.sliit.lk' });
    await submitClaim(item._id.toString(), { email: 'it21000002@student.sliit.lk' });

    const res = await request(app).get(`/api/verification/item/${item._id}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('3. Admin 3-stage verification workflow', () => {
// ─────────────────────────────────────────────────────────────────────────────

  test('TC-12 | Save stage 1 progress (description check — passed)', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app)
      .patch(`/api/verification/${id}/stages`)
      .send({
        approvalStages: {
          stage1: { status: 'passed', notes: 'Description matches item details.' },
          stage2: { status: 'pending', notes: '' },
          stage3: { status: 'pending', notes: '' },
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.approvalStages.stage1.status).toBe('passed');
    expect(res.body.data.status).toBe('pending'); // still pending — not finalised
  });

  test('TC-13 | Save all 3 stages before final decision', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app)
      .patch(`/api/verification/${id}/stages`)
      .send({
        approvalStages: {
          stage1: { status: 'passed', notes: 'Description matches.' },
          stage2: { status: 'passed', notes: 'Ownership proof valid.' },
          stage3: { status: 'passed', notes: 'Final check passed.' },
        },
        notes: 'All stages passed. Ready to approve.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.approvalStages.stage2.status).toBe('passed');
    expect(res.body.data.approvalStages.stage3.status).toBe('passed');
  });

  test('TC-14 | Cannot update stages on a non-pending claim', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    // First reject it
    await request(app)
      .patch(`/api/verification/${id}/status`)
      .send({ status: 'rejected', notes: 'Does not match.' });

    // Then try to update stages
    const res = await request(app)
      .patch(`/api/verification/${id}/stages`)
      .send({ approvalStages: { stage1: { status: 'passed', notes: '' } } });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/non-pending/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('4. Admin approves or rejects a claim', () => {
// ─────────────────────────────────────────────────────────────────────────────

  test('TC-15 | Approve a claim — generates hashed collection PIN', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app)
      .patch(`/api/verification/${id}/status`)
      .send({ status: 'approved', processedBy: 'admin@sliit.lk', notes: 'Verified.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
    // PIN must be stored as a bcrypt hash, never plain text
    expect(res.body.data.collectionPin).toBeDefined();
    expect(res.body.data.collectionPin).not.toMatch(/^\d{6}$/); // should NOT be plain
    expect(res.body.data.collectionPinExpiry).toBeDefined();
  });

  test('TC-16 | Reject a claim with admin notes', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app)
      .patch(`/api/verification/${id}/status`)
      .send({ status: 'rejected', notes: 'Description does not match item details.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
    expect(res.body.data.notes).toMatch(/does not match/i);
  });

  test('TC-17 | Reject invalid status value', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app)
      .patch(`/api/verification/${id}/status`)
      .send({ status: 'random-invalid-status' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid status/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('5. Student collects item — PIN verification', () => {
// ─────────────────────────────────────────────────────────────────────────────

  // Helper: create approved claim and return { id, plainPin }
  async function createApprovedClaim() {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    await request(app)
      .patch(`/api/verification/${id}/status`)
      .send({ status: 'approved', processedBy: 'admin@sliit.lk' });

    // Read the hashed PIN from DB and reverse-engineer by setting a known PIN
    const plainPin = '654321';
    const hashed   = await bcrypt.hash(plainPin, 10);
    await VerificationRequest.findByIdAndUpdate(id, {
      collectionPin:       hashed,
      collectionPinExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { id, plainPin };
  }

  test('TC-18 | Correct PIN — item successfully collected, status → processed', async () => {
    const { id, plainPin } = await createApprovedClaim();

    const res = await request(app)
      .post(`/api/verification/${id}/confirm-collection`)
      .send({ pin: plainPin });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('processed');
    expect(res.body.data.collectedAt).toBeDefined();
  });

  test('TC-19 | Wrong PIN is rejected', async () => {
    const { id } = await createApprovedClaim();

    const res = await request(app)
      .post(`/api/verification/${id}/confirm-collection`)
      .send({ pin: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid pin/i);
  });

  test('TC-20 | Missing PIN is rejected', async () => {
    const { id } = await createApprovedClaim();

    const res = await request(app)
      .post(`/api/verification/${id}/confirm-collection`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pin is required/i);
  });

  test('TC-21 | Expired PIN is rejected', async () => {
    const { id } = await createApprovedClaim();

    // Force the PIN to already be expired
    await VerificationRequest.findByIdAndUpdate(id, {
      collectionPinExpiry: new Date(Date.now() - 1000), // 1 second in the past
    });

    const plainPin = '654321';
    const res = await request(app)
      .post(`/api/verification/${id}/confirm-collection`)
      .send({ pin: plainPin });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  test('TC-22 | Cannot collect a non-approved claim (still pending)', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app)
      .post(`/api/verification/${id}/confirm-collection`)
      .send({ pin: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not in an approved state/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('6. PIN regeneration', () => {
// ─────────────────────────────────────────────────────────────────────────────

  test('TC-23 | Regenerate PIN for an approved claim', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    await request(app)
      .patch(`/api/verification/${id}/status`)
      .send({ status: 'approved' });

    const oldRecord = await VerificationRequest.findById(id);
    const oldHash   = oldRecord.collectionPin;

    const res = await request(app).patch(`/api/verification/${id}/regenerate-pin`);

    expect(res.status).toBe(200);
    // New hash should differ from old hash
    const newHash = res.body.data.collectionPin;
    expect(newHash).not.toBe(oldHash);
    // Expiry should be in the future
    expect(new Date(res.body.data.collectionPinExpiry) > new Date()).toBe(true);
  });

  test('TC-24 | Cannot regenerate PIN for a non-approved claim', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app).patch(`/api/verification/${id}/regenerate-pin`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/approved claims/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('7. Claim history (audit trail)', () => {
// ─────────────────────────────────────────────────────────────────────────────

  test('TC-25 | History records "submitted" event on claim creation', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const res = await request(app).get(`/api/verification/${id}/history`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].event).toBe('submitted');
  });

  test('TC-26 | History grows with each status change (immutable audit trail)', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    // Stage update
    await request(app)
      .patch(`/api/verification/${id}/stages`)
      .send({ approvalStages: { stage1: { status: 'passed', notes: 'ok' } } });

    // Approve
    await request(app)
      .patch(`/api/verification/${id}/status`)
      .send({ status: 'approved' });

    const res = await request(app).get(`/api/verification/${id}/history`);

    expect(res.status).toBe(200);
    // Should have: submitted, stage_updated, status_changed
    expect(res.body.count).toBeGreaterThanOrEqual(3);

    const events = res.body.data.map(h => h.event);
    expect(events).toContain('submitted');
    expect(events).toContain('stage_updated');
    expect(events).toContain('status_changed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('8. Delete a claim', () => {
// ─────────────────────────────────────────────────────────────────────────────

  test('TC-27 | Admin can delete a claim and its history', async () => {
    const item  = await seedFoundItem();
    const claim = await submitClaim(item._id.toString());
    const id    = claim.body.data._id;

    const del = await request(app).delete(`/api/verification/${id}`);
    expect(del.status).toBe(200);

    // Claim should be gone
    const getRes = await request(app).get(`/api/verification/${id}`);
    expect(getRes.status).toBe(404);

    // History should also be cleaned up
    const historyCount = await ClaimHistory.countDocuments({ claimId: id });
    expect(historyCount).toBe(0);
  });

  test('TC-28 | Delete returns 404 for non-existent claim', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).delete(`/api/verification/${fakeId}`);

    expect(res.status).toBe(404);
  });
});
