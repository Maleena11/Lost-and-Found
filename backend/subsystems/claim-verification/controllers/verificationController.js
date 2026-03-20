const VerificationRequest = require('../models/VerificationRequest');
const LostFoundItem = require('../../lost-found-reporting/models/LostFoundItem');

// Create a new verification request
exports.createVerificationRequest = async (req, res) => {
  try {
    const { itemId, claimantInfo, verificationDetails } = req.body;

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
      verificationDetails
    });

    // Populate the item information
    await verificationRequest.populate('itemId');

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

    // If approved, update the item status to claimed
    if (status === 'approved') {
      await LostFoundItem.findByIdAndUpdate(request.itemId, {
        status: 'claimed',
        isResolved: true
      });
    }

    await request.save();
    await request.populate('itemId');

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