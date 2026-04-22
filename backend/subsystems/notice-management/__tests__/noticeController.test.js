/**
 * Notice Management Subsystem — Integration Tests (Full Suite)
 * * Target: Notice lifecycle, Security, Validation, and Notifications.
 * Tools: Jest, Supertest, MongoMemoryServer.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Standard timeout for local DB testing
jest.setTimeout(30000);

// --- Silence non-fatal console noise ---
jest.spyOn(console, 'log').mockImplementation(() => { });
jest.spyOn(console, 'warn').mockImplementation(() => { });
jest.spyOn(console, 'error').mockImplementation(() => { });

// --- Mock Email Service ---
const emailService = require('../../../utils/emailService');
jest.mock('../../../utils/emailService', () => ({
  sendNoticeNotification: jest.fn().mockResolvedValue(true),
  sendForwardAlertEmail: jest.fn().mockResolvedValue(true),
}));

// --- Mock External Subsystem Models ---
jest.mock('../../claim-verification/models/NotificationPreference', () => ({
  find: jest.fn().mockResolvedValue([{ email: 'test@student.sliit.lk', receiveEmails: true }]),
}));
jest.mock('../../claim-verification/models/AppNotification', () => ({
  insertMany: jest.fn().mockResolvedValue([]),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
}));

// --- Models & Routes ---
const noticeRoutes = require('../routes/noticeRoutes');
const Notice = require('../models/Notice');
const SecureTip = require('../models/SecureTip');
const NoticeComment = require('../models/NoticeComment');

// --- Express Setup ---
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/api/notices', noticeRoutes);

// Local test database URI (Make sure MongoDB is running locally!)
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/lost-and-found-test';

// --- Setup & Teardown ---
beforeAll(async () => {
  // Connect to the local MongoDB test database
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Drop the test database to keep things clean, then disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  await Notice.deleteMany({});
  await SecureTip.deleteMany({});
  await NoticeComment.deleteMany({});
  jest.clearAllMocks(); // Resets call counts for emailService
});

// --- Test Fixtures ---
const validNoticeData = {
  title: 'Black Leather Wallet Found',
  content: 'Found a black leather wallet in the cafeteria.',
  category: 'found-item',
  itemType: 'wallet',
  priority: 'medium',
  targetAudience: 'all-students',
  postedBy: 'admin-123',
  userId: 'admin-123',
};

async function seedNotice(overrides = {}) {
  return Notice.create({ ...validNoticeData, ...overrides });
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Notice Management Subsystem Integration', () => {

  describe('1. CRUD Operations & Validation', () => {
    test('TC-01 | Create a valid notice and trigger notification', async () => {
      const res = await request(app).post('/api/notices').send(validNoticeData);
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(validNoticeData.title);
      expect(emailService.sendNoticeNotification).toHaveBeenCalled();
    });

    test('TC-02 | Reject notice creation without title', async () => {
      const res = await request(app).post('/api/notices').send({ content: 'No title...' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('TC-03 | Delete an existing notice', async () => {
      const notice = await seedNotice();
      const res = await request(app).delete(`/api/notices/${notice._id}`);
      expect(res.status).toBe(200);
      const count = await Notice.countDocuments();
      expect(count).toBe(0);
    });
  });

  describe('2. Search & Filter Logic', () => {
    test('TC-04 | Filter by category (lost-item vs found-item)', async () => {
      await seedNotice({ title: 'Lost 1', category: 'lost-item' });
      await seedNotice({ title: 'Found 1', category: 'found-item' });

      const res = await request(app).get('/api/notices?category=found-item');
      expect(res.status).toBe(200);
      expect(res.body.data.every(n => n.category === 'found-item')).toBe(true);
    });

    test('TC-05 | Search by keyword in title', async () => {
      await seedNotice({ title: 'Blue Macbook' });
      const res = await request(app).get('/api/notices/search?q=macbook');
      expect(res.body.data[0].title).toBe('Blue Macbook');
    });
  });

  describe('3. Admin Workflow', () => {
    test('TC-06 | Approve a pending smart report', async () => {
      const notice = await seedNotice({ status: 'pending' });
      const res = await request(app)
        .patch(`/api/notices/${notice._id}/status`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    test('TC-07 | Retrieve archived notices only', async () => {
      await seedNotice({ title: 'Archived', isArchived: true });
      const res = await request(app).get('/api/notices/archived');
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('4. Interactivity: Comments & Secure Tips', () => {
    test('TC-08 | Post an anonymous sighting comment', async () => {
      const notice = await seedNotice();
      const res = await request(app)
        .post(`/api/notices/${notice._id}/comments`)
        .send({ text: 'Saw it near B402', isAnonymous: true });

      expect(res.status).toBe(201);
      expect(res.body.data.userName).toBe('Anonymous');
    });

    test('TC-09 | Submit a Secure Tip for Admin review', async () => {
      const notice = await seedNotice();
      const res = await request(app)
        .post(`/api/notices/${notice._id}/tips`)
        .send({ userId: 'student-99', text: 'Sensitive info here' });

      expect(res.status).toBe(201);
      expect(res.body.data.text).toBe('Sensitive info here');
    });
  });

  describe('5. Security & Edge Cases', () => {
    test('TC-10 | Fail to retrieve notice with invalid MongoDB ID', async () => {
      const res = await request(app).get('/api/notices/invalid-id-format');
      expect(res.status).toBe(400); // Handled by Mongoose validation or middleware
    });

    test('TC-11 | Prevent email forwarding with invalid email format', async () => {
      const notice = await seedNotice();
      const res = await request(app)
        .post(`/api/notices/${notice._id}/forward-alert`)
        .send({ friendEmail: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });
});