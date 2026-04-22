const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

jest.setTimeout(180000);

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

jest.mock('../../../utils/emailService', () => ({
  sendNoticeNotification: jest.fn().mockResolvedValue(true),
  sendForwardAlertEmail: jest.fn().mockResolvedValue(true),
  sendClaimConfirmation: jest.fn().mockResolvedValue(true),
  sendApprovalWithPin: jest.fn().mockResolvedValue(true),
  sendCollectionReceipt: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../socketInstance', () => ({
  getIO: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  })),
}));

const userRoutes = require('../routes/userRoutes');
const settingsRoutes = require('../routes/settingsRoutes');
const lostFoundRoutes = require('../../lost-found-reporting/routes/lostFoundRoutes');
const noticeRoutes = require('../../notice-management/routes/noticeRoutes');
const verificationRoutes = require('../../claim-verification/routes/verificationRoutes');

const User = require('../models/users');
const Admin = require('../models/admin');
const SystemSettings = require('../models/SystemSettings');
const LostFoundItem = require('../../lost-found-reporting/models/LostFoundItem');
const Notice = require('../../notice-management/models/Notice');
const VerificationRequest = require('../../claim-verification/models/VerificationRequest');
const ClaimHistory = require('../../claim-verification/models/ClaimHistory');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/verification', verificationRoutes);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;

  await Promise.all([
    User.deleteMany({}),
    Admin.deleteMany({}),
    SystemSettings.deleteMany({}),
    LostFoundItem.deleteMany({}),
    Notice.deleteMany({}),
    VerificationRequest.deleteMany({}),
    ClaimHistory.deleteMany({}),
  ]);
});

async function seedUser(overrides = {}) {
  const password = overrides.password || (await bcrypt.hash('Password@123', 10));
  return User.create({
    fullname: 'Test Student',
    email: 'student1@sliit.lk',
    password,
    phonenumber: '0771234567',
    role: 'User',
    status: 'Active',
    ...overrides,
  });
}

async function seedAdmin(overrides = {}) {
  const password = overrides.password || (await bcrypt.hash('Admin@123', 10));
  return Admin.create({
    username: 'admin',
    password,
    ...overrides,
  });
}

async function seedLostFoundItem(overrides = {}) {
  return LostFoundItem.create({
    userId: 'admin-seed',
    itemType: 'found',
    itemName: 'Black Laptop Bag',
    category: 'laptop-tablet',
    description: 'Found near the library.',
    location: 'Library',
    dateTime: new Date('2026-04-20T08:30:00Z'),
    status: 'pending',
    ...overrides,
  });
}

async function seedNotice(overrides = {}) {
  return Notice.create({
    userId: 'admin-seed',
    postedBy: 'admin-seed',
    title: 'Found Wallet Notice',
    content: 'Wallet handed over to student services.',
    category: 'found-item',
    itemType: 'wallet',
    priority: 'medium',
    startDate: new Date('2026-04-20T08:30:00Z'),
    endDate: new Date('2026-04-30T08:30:00Z'),
    targetAudience: 'all-students',
    contactEmail: 'admin@sliit.lk',
    ...overrides,
  });
}

async function seedVerification(overrides = {}) {
  const item = overrides.itemId || await seedLostFoundItem();
  const claimantInfo = {
    name: 'Nimali Perera',
    email: 'nimali@sliit.lk',
    phone: '0711111111',
    address: 'Malabe',
    ...(overrides.claimantInfo || {}),
  };
  const verificationDetails = {
    description: 'Black bag with sticker',
    ownershipProof: 'Receipt',
    additionalInfo: 'Lost near library',
    ...(overrides.verificationDetails || {}),
  };
  const { claimantInfo: _ignoredClaimantInfo, verificationDetails: _ignoredVerificationDetails, ...rest } = overrides;

  return VerificationRequest.create({
    itemId: item._id,
    claimantInfo,
    verificationDetails,
    status: 'pending',
    ...rest,
  });
}

describe('Admin dashboard overview automated journeys', () => {
  test('TC-ADM-01 | Dashboard overview APIs return the counts used in summary cards and widgets', async () => {
    await seedUser({ fullname: 'Ayesha Silva', email: 'ayesha@sliit.lk' });
    await seedUser({ fullname: 'Kasun Fernando', email: 'kasun@sliit.lk', status: 'Inactive' });

    const dashboardClaimItem = await seedLostFoundItem({ itemType: 'lost', itemName: 'Student ID', category: 'student-id', status: 'pending' });
    await seedLostFoundItem({ itemType: 'found', itemName: 'Water Bottle', category: 'water-bottle', status: 'claimed' });
    await seedLostFoundItem({ itemType: 'found', itemName: 'Car Key', category: 'keys', status: 'returned' });

    await seedNotice({ title: 'Urgent advisory', category: 'advisory', priority: 'urgent' });
    await seedNotice({ title: 'General notice', category: 'announcement', priority: 'medium' });

    await seedVerification({ itemId: dashboardClaimItem, status: 'pending', claimantInfo: { name: 'User One', email: 'user1@sliit.lk' } });
    await seedVerification({ itemId: dashboardClaimItem, status: 'approved', claimantInfo: { name: 'User Two', email: 'user2@sliit.lk' } });

    const [usersRes, itemsRes, verificationRes, noticesRes] = await Promise.all([
      request(app).get('/api/users'),
      request(app).get('/api/lost-found'),
      request(app).get('/api/verification'),
      request(app).get('/api/notices'),
    ]);

    expect(usersRes.status).toBe(200);
    expect(itemsRes.status).toBe(200);
    expect(verificationRes.status).toBe(200);
    expect(noticesRes.status).toBe(200);

    expect(usersRes.body).toHaveLength(2);
    expect(itemsRes.body.count).toBe(3);
    expect(verificationRes.body.count).toBe(2);
    expect(verificationRes.body.data.filter((claim) => claim.status === 'pending')).toHaveLength(1);
    expect(noticesRes.body.count).toBe(2);
    expect(noticesRes.body.data.filter((notice) => notice.priority === 'urgent')).toHaveLength(1);
  });
});

describe('User management automated journeys', () => {
  test('TC-ADM-02 | Admin creates a user and the password is stored hashed while the response is UI-friendly', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Dasun Perera',
        email: 'dasun@sliit.lk',
        phone: '0777654321',
        password: 'Password@123',
        role: 'User',
        status: 'Active',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Dasun Perera');
    expect(res.body.email).toBe('dasun@sliit.lk');
    expect(res.body.role).toBe('User');

    const stored = await User.findOne({ email: 'dasun@sliit.lk' });
    expect(stored).toBeTruthy();
    expect(stored.password).not.toBe('Password@123');
    expect(await bcrypt.compare('Password@123', stored.password)).toBe(true);
  });

  test('TC-ADM-03 | Admin can list, update, and delete users through the management API', async () => {
    const createdUser = await seedUser({ fullname: 'Raveen Perera', email: 'raveen@sliit.lk', role: 'User', status: 'Active' });

    const listRes = await request(app).get('/api/users');
    expect(listRes.status).toBe(200);
    expect(listRes.body[0]).toMatchObject({
      name: 'Raveen Perera',
      email: 'raveen@sliit.lk',
      role: 'User',
      status: 'Active',
    });

    const updateRes = await request(app)
      .put(`/api/users/${createdUser._id}`)
      .send({
        name: 'Raveen Perera',
        email: 'raveen@sliit.lk',
        phone: '0719999999',
        role: 'Admin',
        status: 'Inactive',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.role).toBe('Admin');
    expect(updateRes.body.status).toBe('Inactive');
    expect(updateRes.body.phonenumber).toBe('0719999999');

    const deleteRes = await request(app).delete(`/api/users/${createdUser._id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toMatch(/deleted successfully/i);

    const deleted = await User.findById(createdUser._id);
    expect(deleted).toBeNull();
  });

  test('TC-ADM-04 | Login supports both student accounts and admin accounts', async () => {
    await seedUser({
      fullname: 'Student Login',
      email: 'loginuser@sliit.lk',
      password: await bcrypt.hash('UserPass@123', 10),
    });
    await seedAdmin({
      username: 'dashboard-admin',
      password: await bcrypt.hash('AdminPass@123', 10),
    });

    const studentLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'loginuser@sliit.lk', password: 'UserPass@123' });

    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'dashboard-admin', password: 'AdminPass@123' });

    expect(studentLogin.status).toBe(200);
    expect(studentLogin.body.user.role).toBe('User');
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.user.role).toBe('Admin');
  });

  test('TC-ADM-05 | Duplicate emails are blocked during user creation', async () => {
    await seedUser({ email: 'duplicate@sliit.lk' });

    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Another Student',
        email: 'duplicate@sliit.lk',
        phone: '0770000000',
        password: 'Password@123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email already exists/i);
  });
});

describe('System settings automated journeys', () => {
  test('TC-ADM-06 | First settings load creates the singleton record with default values', async () => {
    const res = await request(app).get('/api/settings');

    expect(res.status).toBe(200);
    expect(res.body._singleton).toBe('global');
    expect(res.body.systemName).toMatch(/UniFind/i);

    const stored = await SystemSettings.findOne({ _singleton: 'global' });
    expect(stored).toBeTruthy();
  });

  test('TC-ADM-07 | Admin updates settings and immutable singleton fields stay protected', async () => {
    const existing = await SystemSettings.create({
      _singleton: 'global',
      systemName: 'UniFind',
      adminEmail: 'admin@old.lk',
      timezone: 'Asia/Colombo',
      itemsPerPage: '10',
      requireSpecialChars: true,
    });

    const res = await request(app)
      .put('/api/settings')
      .send({
        _id: new mongoose.Types.ObjectId().toString(),
        _singleton: 'tampered',
        systemName: 'UniFind Admin Console',
        adminEmail: 'admin@new.lk',
        timezone: 'UTC',
        itemsPerPage: '25',
        requireSpecialChars: false,
      });

    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(existing._id.toString());
    expect(res.body._singleton).toBe('global');
    expect(res.body.systemName).toBe('UniFind Admin Console');
    expect(res.body.adminEmail).toBe('admin@new.lk');
    expect(res.body.itemsPerPage).toBe('25');
    expect(res.body.requireSpecialChars).toBe(false);
  });
});
