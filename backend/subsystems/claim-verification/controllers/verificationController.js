const bcrypt = require('bcryptjs');
const VerificationRequest = require('../models/VerificationRequest');
const LostFoundItem = require('../../lost-found-reporting/models/LostFoundItem');
const { sendClaimConfirmation, sendApprovalWithPin, sendCollectionReceipt } = require('../../../utils/emailService');

// Create a new verification request
exports.createVerificationRequest = async (req, res) => {
  try {
    const { itemId, claimantInfo, verificationDetails, claimantImages } = req.body;

    // Check if the item exists and is a found item
    const item = await LostFoundItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    if (item.itemType !== 'found') {
      return res.status(400).json({
        success: false,
        error: 'Verification requests can only be made for found items'
      });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'This item is no longer available for claims'
      });
    }

    // Check if there's already a pending verification request for this item by this person
    const existingRequest = await VerificationRequest.findOne({
      itemId,
      'claimantInfo.email': claimantInfo.email,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending verification request for this item'
      });
    }

    // Create new verification request
    const verificationRequest = await VerificationRequest.create({
      itemId,
      claimantInfo,
      verificationDetails,
      claimantImages: Array.isArray(claimantImages) ? claimantImages : []
    });

    // Populate the item information
    await verificationRequest.populate('itemId');

    // Send confirmation email to claimant (non-blocking — failure won't reject the submission)
    const claimRef = `CLM-${verificationRequest._id.toString().slice(-6).toUpperCase()}`;
    sendClaimConfirmation(claimantInfo.email, {
      claimantName: claimantInfo.name,
      claimRef,
      itemName: verificationRequest.itemId?.itemName || 'Your item',
      submittedAt: verificationRequest.submittedAt || new Date(),
    }).catch(err => console.error('[Email] Failed to send claim confirmation:', err.message));

    res.status(201).json({
      success: true,
      data: verificationRequest
    });
  } catch (error) {
    console.error('Create verification request error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get all verification requests (for admin)
exports.getAllVerificationRequests = async (req, res) => {
  try {
    const requests = await VerificationRequest.find()
      .populate('itemId')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get verification request by ID
exports.getVerificationRequestById = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id)
      .populate('itemId');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Verification request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update verification request status (for admin)
exports.updateVerificationRequestStatus = async (req, res) => {
  try {
    const { status, notes, processedBy } = req.body;

    if (!['approved', 'rejected', 'processed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Verification request not found'
      });
    }

    request.status = status;
    request.processedAt = Date.now();
    request.processedBy = processedBy;
    if (notes) request.notes = notes;

    // Generate collection PIN and update item status on approval
    let plainCollectionPin = null;
    if (status === 'approved') {
      plainCollectionPin = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPin = await bcrypt.hash(plainCollectionPin, 10);
      request.collectionPin = hashedPin;
      request.collectionPinExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await LostFoundItem.findByIdAndUpdate(request.itemId, {
        status: 'claimed',
        isResolved: true
      });
    }

    await request.save();
    await request.populate('itemId');

    // Send approval email with collection PIN (non-blocking)
    if (status === 'approved' && plainCollectionPin) {
      const claimRef = `CLM-${request._id.toString().slice(-6).toUpperCase()}`;
      sendApprovalWithPin(request.claimantInfo.email, {
        claimantName: request.claimantInfo.name,
        claimRef,
        itemName: request.itemId?.itemName || 'Your item',
        collectionPin: plainCollectionPin,
        expiryDate: request.collectionPinExpiry
      }).catch(err => console.error('[Email] Failed to send approval+PIN email:', err.message));
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Save approval stage progress without finalizing (for admin)
exports.updateApprovalStages = async (req, res) => {
  try {
    const { approvalStages, notes } = req.body;

    // Verify the request exists and is still pending before updating
    const existing = await VerificationRequest.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }
    if (existing.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Cannot update stages of a non-pending request' });
    }

    // Build the $set payload — using findByIdAndUpdate avoids Mongoose's
    // nested-object dirty-tracking problem that causes .save() to silently
    // skip writing nested subdocuments back to MongoDB.
    const updateFields = {};
    if (approvalStages) updateFields.approvalStages = approvalStages;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('itemId');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update approval stages error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Delete verification request
exports.deleteVerificationRequest = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Verification request not found'
      });
    }

    await VerificationRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get verification requests by claimant email (for user account page)
exports.getVerificationRequestsByEmail = async (req, res) => {
  try {
    const requests = await VerificationRequest.find({
      'claimantInfo.email': req.params.email.toLowerCase()
    })
      .select('-claimantImages')
      .populate('itemId', 'itemName category location thumbnail images')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Confirm student collected item by validating the collection PIN
exports.confirmCollection = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, error: 'Collection PIN is required' });
    }

    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'This claim is not in an approved state' });
    }

    if (!request.collectionPin) {
      return res.status(400).json({ success: false, error: 'No collection PIN has been set for this claim' });
    }

    if (request.collectionPinExpiry && new Date() > request.collectionPinExpiry) {
      return res.status(400).json({ success: false, error: 'Collection PIN has expired. Please contact Student Services.' });
    }

    const isValid = await bcrypt.compare(pin.toString(), request.collectionPin);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid PIN. Please ask the student to check their approval email.' });
    }

    // Mark claim as processed and record collection timestamp
    request.status = 'processed';
    request.collectedAt = new Date();
    await request.save();
    await request.populate('itemId');

    // Update item status to returned
    await LostFoundItem.findByIdAndUpdate(request.itemId?._id || request.itemId, {
      status: 'returned'
    });

    // Send collection receipt email (non-blocking)
    const claimRef = `CLM-${request._id.toString().slice(-6).toUpperCase()}`;
    sendCollectionReceipt(request.claimantInfo.email, {
      claimantName: request.claimantInfo.name,
      claimRef,
      itemName: request.itemId?.itemName || 'Your item',
      collectedAt: request.collectedAt
    }).catch(err => console.error('[Email] Failed to send collection receipt:', err.message));

    console.log(`[Collection] Item collected — claim ${request._id}, item ${request.itemId?._id}, claimant: ${request.claimantInfo.email}`);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Confirm collection error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Regenerate an expired (or soon-expiring) collection PIN for an approved claim
exports.regeneratePin = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'PIN can only be regenerated for approved claims' });
    }

    const plainCollectionPin = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPin = await bcrypt.hash(plainCollectionPin, 10);
    request.collectionPin = hashedPin;
    request.collectionPinExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await request.save();
    await request.populate('itemId');

    const claimRef = `CLM-${request._id.toString().slice(-6).toUpperCase()}`;
    sendApprovalWithPin(request.claimantInfo.email, {
      claimantName: request.claimantInfo.name,
      claimRef,
      itemName: request.itemId?.itemName || 'Your item',
      collectionPin: plainCollectionPin,
      expiryDate: request.collectionPinExpiry
    }).catch(err => console.error('[Email] Failed to send regenerated PIN email:', err.message));

    console.log(`[PIN] Regenerated PIN for claim ${request._id}, claimant: ${request.claimantInfo.email}`);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Regenerate PIN error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get verification requests by item ID
exports.getVerificationRequestsByItem = async (req, res) => {
  try {
    const requests = await VerificationRequest.find({ itemId: req.params.itemId })
      .populate('itemId')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};