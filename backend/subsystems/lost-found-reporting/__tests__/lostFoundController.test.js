/**
 * Lost & Found Reporting Subsystem - Integration Tests
 *
 * Covers:
 * - item creation, retrieval, update, deletion
 * - status updates, search, lean listing, heatmap aggregation
 * - sightings flow and sighting notifications
 *
 * Tools: Jest + Supertest + MongoMemoryServer
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

jest.setTimeout(180000);

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

jest.mock('jimp', () => ({
  Jimp: {
    read: jest.fn(async () => ({
      width: 100,
      height: 100,
      crop() {
        return this;
      },
      resize() {
        return this;
      },
      async getBuffer() {
        return Buffer.from('thumb');
      },
    })),
  },
  JimpMime: {
    jpeg: 'image/jpeg',
  },
}));

const lostFoundRoutes = require('../routes/lostFoundRoutes');
const LostFoundItem = require('../models/LostFoundItem');
const SightingNotification = require('../models/SightingNotification');

const app = express();
const ioMock = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

app.use(bodyParser.json({ limit: '10mb' }));
app.set('io', ioMock);
app.use('/api/lost-found', lostFoundRoutes);

const baseItem = {
  userId: 'user-001',
  itemType: 'lost',
  itemName: 'Blue Water Bottle',
  category: 'water-bottle',
  description: 'Metal bottle with university stickers',
  location: 'Library',
  dateTime: '2026-04-15T09:30:00.000Z',
  contactInfo: {
    name: 'Nimali',
    phone: '0771234567',
    email: 'nimali@sliit.lk',
  },
};

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
  ioMock.to.mockClear();
  ioMock.emit.mockClear();

  if (mongoose.connection.readyState !== 1) return;

  await SightingNotification.deleteMany({});
  await LostFoundItem.deleteMany({});
});

async function seedItem(overrides = {}) {
  return LostFoundItem.create({
    ...baseItem,
    ...overrides,
  });
}

describe('1. Item creation and retrieval', () => {
  test('TC-01 | Create a new item successfully', async () => {
    const res = await request(app)
      .post('/api/lost-found')
      .send({
        ...baseItem,
        images: ['data:image/png;base64,ZmFrZQ=='],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.itemName).toBe(baseItem.itemName);
    expect(res.body.data.thumbnail).toMatch(/^data:image\/jpeg;base64,/);
  });

  test('TC-02 | Reject invalid item payload', async () => {
    const res = await request(app)
      .post('/api/lost-found')
      .send({
        userId: 'user-001',
        itemType: 'lost',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.error)).toBe(true);
  });

  test('TC-03 | Get all items with pagination metadata', async () => {
    await seedItem({ itemName: 'Bottle A' });
    await seedItem({ itemName: 'Bottle B', userId: 'user-002' });

    const res = await request(app).get('/api/lost-found?page=1&limit=1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.total).toBe(2);
    expect(res.body.pages).toBe(2);
  });

  test('TC-04 | Get a single item by ID', async () => {
    const item = await seedItem();

    const res = await request(app).get(`/api/lost-found/${item._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(item._id.toString());
  });

  test('TC-05 | Return 404 for a missing item', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/lost-found/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/item not found/i);
  });
});

describe('2. Item updates, status, and deletion', () => {
  test('TC-06 | Owner can update an item', async () => {
    const item = await seedItem();

    const res = await request(app)
      .put(`/api/lost-found/${item._id}`)
      .send({
        userId: 'user-001',
        itemName: 'Updated Bottle',
        location: 'Main Canteen',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.itemName).toBe('Updated Bottle');
    expect(res.body.data.location).toBe('Main Canteen');
  });

  test('TC-07 | Reject update from a different user', async () => {
    const item = await seedItem();

    const res = await request(app)
      .put(`/api/lost-found/${item._id}`)
      .send({
        userId: 'user-999',
        itemName: 'Hacked Update',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not authorized/i);
  });

  test('TC-08 | Update item status and resolve returned items', async () => {
    const item = await seedItem({ itemType: 'found', status: 'pending' });

    const res = await request(app)
      .patch(`/api/lost-found/${item._id}/status`)
      .send({ status: 'returned' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('returned');
    expect(res.body.data.isResolved).toBe(true);
  });

  test('TC-09 | Reject invalid status value', async () => {
    const item = await seedItem();

    const res = await request(app)
      .patch(`/api/lost-found/${item._id}/status`)
      .send({ status: 'archived' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid status/i);
  });

  test('TC-10 | Owner can delete an item', async () => {
    const item = await seedItem();

    const res = await request(app)
      .delete(`/api/lost-found/${item._id}`)
      .send({ userId: 'user-001' });

    expect(res.status).toBe(200);

    const deleted = await LostFoundItem.findById(item._id);
    expect(deleted).toBeNull();
  });
});

describe('3. Search and analytics', () => {
  test('TC-11 | Search items using filters and keyword', async () => {
    await seedItem({
      itemName: 'Dell Laptop',
      category: 'laptop-tablet',
      location: 'Library',
      description: 'Black laptop with charger',
      itemType: 'found',
    });
    await seedItem({
      itemName: 'Student ID',
      category: 'student-id',
      location: 'Cafeteria',
      description: 'SLIIT ID card',
      userId: 'user-002',
    });

    const res = await request(app).get(
      '/api/lost-found/search?itemType=found&category=laptop-tablet&location=library&query=laptop'
    );

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].itemName).toBe('Dell Laptop');
  });

  test('TC-12 | Return lean list without images field', async () => {
    await seedItem({
      images: ['data:image/png;base64,ZmFrZQ=='],
    });

    const res = await request(app).get('/api/lost-found?lean=true');

    expect(res.status).toBe(200);
    expect(res.body.data[0].images).toBeUndefined();
  });

  test('TC-13 | Aggregate heatmap counts by location', async () => {
    await seedItem({
      itemType: 'lost',
      location: 'Library',
      createdAt: new Date(),
    });
    await seedItem({
      itemType: 'found',
      location: 'Library',
      userId: 'user-002',
      createdAt: new Date(),
    });
    await seedItem({
      itemType: 'found',
      location: 'Main Gate',
      userId: 'user-003',
      createdAt: new Date(),
    });

    const res = await request(app).get('/api/lost-found/heatmap?timeRange=all');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0]).toMatchObject({
      location: 'Library',
      total: 2,
      lost: 1,
      found: 1,
    });
  });
});

describe('4. Sightings and notifications', () => {
  test('TC-14 | Add a sighting to a lost item and create notification', async () => {
    const item = await seedItem({ itemType: 'lost' });

    const res = await request(app)
      .post(`/api/lost-found/${item._id}/sightings`)
      .send({
        location: 'Bus Stop',
        dateTime: '2026-04-16T10:00:00.000Z',
        note: 'Seen near the bench',
        reporterEmail: 'helper@sliit.lk',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.location).toBe('Bus Stop');

    const notifications = await SightingNotification.find({ itemId: item._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].recipientEmail).toBe('nimali@sliit.lk');
    expect(ioMock.to).toHaveBeenCalledWith('nimali@sliit.lk');
    expect(ioMock.emit).toHaveBeenCalled();
  });

  test('TC-15 | Reject sighting on a found item', async () => {
    const item = await seedItem({ itemType: 'found' });

    const res = await request(app)
      .post(`/api/lost-found/${item._id}/sightings`)
      .send({
        location: 'Library',
        dateTime: '2026-04-16T10:00:00.000Z',
        reporterEmail: 'helper@sliit.lk',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/only for lost items/i);
  });

  test('TC-16 | Reject owner adding a sighting to their own item', async () => {
    const item = await seedItem({ itemType: 'lost' });

    const res = await request(app)
      .post(`/api/lost-found/${item._id}/sightings`)
      .send({
        location: 'Library',
        dateTime: '2026-04-16T10:00:00.000Z',
        reporterEmail: 'nimali@sliit.lk',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cannot add a sighting to your own item/i);
  });

  test('TC-17 | Owner can mark a sighting as helpful', async () => {
    const item = await seedItem({
      itemType: 'lost',
      sightings: [
        {
          location: 'Gate A',
          dateTime: new Date('2026-04-16T10:00:00.000Z'),
          note: 'Seen here',
          reporterEmail: 'helper@sliit.lk',
        },
      ],
    });

    const sightingId = item.sightings[0]._id;

    const res = await request(app)
      .patch(`/api/lost-found/${item._id}/sightings/${sightingId}`)
      .send({
        userId: 'user-001',
        reaction: 'helpful',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.helpful).toBe(true);
    expect(res.body.data.dismissed).toBe(false);
  });

  test('TC-18 | Reporter can update their own sighting before it is confirmed helpful', async () => {
    const item = await seedItem({
      itemType: 'lost',
      sightings: [
        {
          location: 'Old Spot',
          dateTime: new Date('2026-04-16T10:00:00.000Z'),
          note: 'Initial note',
          reporterEmail: 'helper@sliit.lk',
        },
      ],
    });

    const sightingId = item.sightings[0]._id;

    const res = await request(app)
      .put(`/api/lost-found/${item._id}/sightings/${sightingId}`)
      .send({
        reporterEmail: 'helper@sliit.lk',
        location: 'New Spot',
        dateTime: '2026-04-17T08:00:00.000Z',
        note: 'Updated note',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.location).toBe('New Spot');
    expect(res.body.data.note).toBe('Updated note');
  });

  test('TC-19 | Reporter can delete their own sighting', async () => {
    const item = await seedItem({
      itemType: 'lost',
      sightings: [
        {
          location: 'Old Spot',
          dateTime: new Date('2026-04-16T10:00:00.000Z'),
          note: 'Initial note',
          reporterEmail: 'helper@sliit.lk',
        },
      ],
    });

    const sightingId = item.sightings[0]._id;

    const res = await request(app)
      .delete(`/api/lost-found/${item._id}/sightings/${sightingId}`)
      .send({
        reporterEmail: 'helper@sliit.lk',
      });

    expect(res.status).toBe(200);
    expect(res.body.sightings).toHaveLength(0);
  });

  test('TC-20 | Read and mark sighting notifications', async () => {
    const item = await seedItem({ itemType: 'lost' });
    const notification = await SightingNotification.create({
      recipientEmail: 'nimali@sliit.lk',
      itemId: item._id,
      itemName: item.itemName,
      sightingLocation: 'Library',
      message: 'Possible match',
    });

    const listRes = await request(app).get('/api/lost-found/sighting-notifications/nimali@sliit.lk');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const markRes = await request(app).patch(
      `/api/lost-found/sighting-notifications/${notification._id}/read`
    );

    expect(markRes.status).toBe(200);
    expect(markRes.body.data.isRead).toBe(true);
  });
});
