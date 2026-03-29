/**
 * One-time migration: generate thumbnails for existing lost-found items that don't have one.
 * Run with: node scripts/generateThumbnails.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Jimp, JimpMime } = require("jimp");
const LostFoundItem = require("../subsystems/lost-found-reporting/models/LostFoundItem");

const THUMB_SIZE = 80;

async function generateThumbnail(base64DataUrl) {
  const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const image = await Jimp.read(buffer);
  const size = Math.min(image.width, image.height);
  image
    .crop({
      x: Math.floor((image.width - size) / 2),
      y: Math.floor((image.height - size) / 2),
      w: size,
      h: size,
    })
    .resize({ w: THUMB_SIZE, h: THUMB_SIZE });
  const thumbBuffer = await image.getBuffer(JimpMime.jpeg);
  return "data:image/jpeg;base64," + thumbBuffer.toString("base64");
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const items = await LostFoundItem.find({
    thumbnail: { $exists: false },
    "images.0": { $exists: true },
  }).select("_id images");

  console.log(`Found ${items.length} items without thumbnails`);

  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const thumb = await generateThumbnail(item.images[0]);
      await LostFoundItem.updateOne({ _id: item._id }, { $set: { thumbnail: thumb } });
      success++;
      process.stdout.write(`\r✔ ${success}/${items.length}`);
    } catch (err) {
      failed++;
      console.error(`\nFailed for ${item._id}: ${err.message}`);
    }
  }

  console.log(`\n\nDone. ${success} updated, ${failed} failed.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
