const bcrypt = require('bcryptjs');
const VerificationRequest = require('../models/VerificationRequest');
const ClaimHistory = require('../models/ClaimHistory');
const LostFoundItem = require('../../lost-found-reporting/models/LostFoundItem');
const UserModel = require('../../admin/models/users');
const { sendClaimConfirmation, sendApprovalWithPin, sendCollectionReceipt } = require('../../../utils/emailService');
const socketInstance = require('../../../socketInstance');
const { buildClaimRecommendation } = require('../utils/claimRecommendation');

// ── helpers ──────────────────────────────────────────────────────────────────

function emitClaimUpdatedEvent(claim, history = null) {
  const claimData = claim.toObject ? claim.toObject() : claim;
  const lightClaim = { ...claimData, claimantImages: undefined };

  try {
    const io = socketInstance.getIO();
    const payload = {
      claim: lightClaim,
      history,
      timestamp: new Date().toISOString(),
    };
    io.to('admins').emit('claimUpdated', payload);
    if (claim.claimantInfo?.email) {
      io.to(`user:${claim.claimantInfo.email}`).emit('claimUpdated', payload);
    }
  } catch (err) {
    console.warn('[Socket.IO] Could not emit claimUpdated:', err.message);
  }
}

async function recalculateClaimRecommendation(claimDoc) {
  if (!claimDoc) return null;
  if (claimDoc.populate && !claimDoc.populated('itemId')) {
    await claimDoc.populate('itemId');
  }
  claimDoc.recommendation = await buildClaimRecommendation(claimDoc);
  await claimDoc.save();
  return claimDoc;
}

async function refreshCompetingClaimRecommendations(itemId, skipClaimId = null) {
  if (!itemId) return [];

  const claims = await VerificationRequest.find({ itemId }).populate('itemId');
  const refreshed = [];

  for (const claim of claims) {
    if (skipClaimId && String(claim._id) === String(skipClaimId)) continue;
    await recalculateClaimRecommendation(claim);
    refreshed.push(claim);
  }

  return refreshed;
}

/**
 * Persist a history entry and broadcast the updated claim to:
 *  - the admin room ("admins")
 *  - the claimant's personal room ("user:<email>")
 */
async function recordAndEmit(claim, historyPayload) {
  // 1. Save history entry
  await ClaimHistory.create({
    claimId: claim._id,
    ...historyPayload,
    snapshot: {
      status: claim.status,
      approvalStages: claim.approvalStages,
      notes: claim.notes,
      recommendation: claim.recommendation,
    },
  });

  // 2. Fetch the freshest history for this claim to attach to the event
  const history = await ClaimHistory.find({ claimId: claim._id }).sort({ createdAt: 1 });
  emitClaimUpdatedEvent(claim, history);
  return;

  // 3. Build the payload (strip large base64 images to keep the WS frame small)
  const claimData = claim.toObject ? claim.toObject() : claim;
  const lightClaim = { ...claimData, claimantImages: undefined };

  const eventPayload = {
    claim: lightClaim,
    history,
    event: historyPayload.event,
    description: historyPayload.description,
    timestamp: new Date().toISOString(),
  };

  // 4. Emit
  try {
    const io = socketInstance.getIO();
    io.to('admins').emit('claimUpdated', eventPayload);
    if (claim.claimantInfo?.email) {
      io.to(`user:${claim.claimantInfo.email}`).emit('claimUpdated', eventPayload);
    }
  } catch (err) {
    // Socket not yet ready (e.g. during tests) — non-fatal
    console.warn('[Socket.IO] Could not emit claimUpdated:', err.message);
  }
}

// ── controllers ───────────────────────────────────────────────────────────────

// Create a new verification request
exports.createVerificationRequest = async (req, res) => {
  try {
    const { itemId, claimantInfo, verificationDetails, claimantImages } = req.body;
    const normalizedEmail = claimantInfo?.email?.trim().toLowerCase();
    const studentUser = await UserModel.findOne({
      _id: claimantInfo?.userId,
      email: normalizedEmail,
      role: 'User',
      status: 'Active',
    });

    if (!studentUser) {
      return res.status(403).json({ success: false, error: 'Only logged in active student accounts can submit claims' });
    }

    // Check if the item exists and is a found item
    const item = await LostFoundItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    if (item.itemType !== 'found') {
      return res.status(400).json({ success: false, error: 'Verification requests can only be made for found items' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'This item is no longer available for claims' });
    }

    // Check for existing pending request from the same person
    const existingRequest = await VerificationRequest.findOne({
      itemId,
      'claimantInfo.email': studentUser.email,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'You already have a pending verification request for this item' });
    }

    // Create claim
    const verificationRequest = await VerificationRequest.create({
      itemId,
      claimantInfo: {
        name: claimantInfo?.name?.trim() || studentUser.fullname,
        email: studentUser.email,
        phone: claimantInfo?.phone,
        address: claimantInfo?.address,
      },
      verificationDetails,
      claimantImages: Array.isArray(claimantImages) ? claimantImages : [],
    });
    await verificationRequest.populate('itemId');
    await recalculateClaimRecommendation(verificationRequest);
    const competingClaims = await refreshCompetingClaimRecommendations(itemId, verificationRequest._id);

    // Log + emit
    await recordAndEmit(verificationRequest, {
      event: 'submitted',
      actor: 'system',
      description: `Claim submitted by ${claimantInfo.name} for "${verificationRequest.itemId?.itemName || 'item'}"`,
    });
    competingClaims.forEach((claim) => emitClaimUpdatedEvent(claim));

    // Confirmation email (non-blocking)
    const claimRef = `CLM-${verificationRequest._id.toString().slice(-6).toUpperCase()}`;
    sendClaimConfirmation(claimantInfo.email, {
      claimantName: claimantInfo.name,
      claimRef,
      itemName: verificationRequest.itemId?.itemName || 'Your item',
      submittedAt: verificationRequest.submittedAt || new Date(),
    }).catch(err => console.error('[Email] Failed to send claim confirmation:', err.message));

    res.status(201).json({ success: true, data: verificationRequest });
  } catch (error) {
    console.error('Create verification request error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get all verification requests (for admin)
exports.getAllVerificationRequests = async (req, res) => {
  try {
    const requests = await VerificationRequest.find()
      .populate('itemId')
      .sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get verification request by ID
exports.getVerificationRequestById = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id).populate('itemId');
    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Update verification request status (approve / reject / process) — admin only
exports.updateVerificationRequestStatus = async (req, res) => {
  try {
    const { status, notes, processedBy } = req.body;

    if (!['approved', 'rejected', 'processed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }

    request.status = status;
    request.processedAt = Date.now();
    request.processedBy = processedBy;
    if (notes) request.notes = notes;

    // Generate collection PIN on approval
    let plainCollectionPin = null;
    if (status === 'approved') {
      plainCollectionPin = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPin = await bcrypt.hash(plainCollectionPin, 10);
      request.collectionPin = hashedPin;
      request.collectionPinExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await LostFoundItem.findByIdAndUpdate(request.itemId, { status: 'claimed', isResolved: true });
    }

    await request.save();
    await request.populate('itemId');
    await recalculateClaimRecommendation(request);
    const competingClaims = await refreshCompetingClaimRecommendations(request.itemId?._id || request.itemId, request._id);

    // Build a readable description for the timeline
    const statusLabel = { approved: 'Approved', rejected: 'Rejected', processed: 'Processed' }[status];
    const description = `Claim ${statusLabel.toLowerCase()} by admin${notes ? ` — "${notes}"` : ''}`;

    await recordAndEmit(request, {
      event: 'status_changed',
      actor: processedBy || 'admin',
      description,
    });
    competingClaims.forEach((claim) => emitClaimUpdatedEvent(claim));

    // Approval email with PIN (non-blocking)
    if (status === 'approved' && plainCollectionPin) {
      const claimRef = `CLM-${request._id.toString().slice(-6).toUpperCase()}`;
      sendApprovalWithPin(request.claimantInfo.email, {
        claimantName: request.claimantInfo.name,
        claimRef,
        itemName: request.itemId?.itemName || 'Your item',
        collectionPin: plainCollectionPin,
        expiryDate: request.collectionPinExpiry,
      }).catch(err => console.error('[Email] Failed to send approval+PIN email:', err.message));
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Save approval stage progress without finalising the claim — admin only
exports.updateApprovalStages = async (req, res) => {
  try {
    const { approvalStages, notes } = req.body;

    const existing = await VerificationRequest.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }
    if (existing.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Cannot update stages of a non-pending request' });
    }

    const updateFields = {};
    if (approvalStages) updateFields.approvalStages = approvalStages;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('itemId');
    await recalculateClaimRecommendation(updated);

    // Build a human-readable summary of which stages changed
    const stageDescriptions = [];
    if (approvalStages) {
      ['stage1', 'stage2', 'stage3'].forEach((key, i) => {
        const s = approvalStages[key];
        if (s && s.status !== 'pending') {
          stageDescriptions.push(`Stage ${i + 1}: ${s.status}`);
        }
      });
    }
    const description = stageDescriptions.length
      ? `Approval stages updated — ${stageDescriptions.join(', ')}`
      : 'Approval stages saved';

    await recordAndEmit(updated, {
      event: 'stage_updated',
      actor: 'admin',
      description,
    });

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
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }
    const itemId = request.itemId;
    await VerificationRequest.findByIdAndDelete(req.params.id);
    // Also clean up history
    await ClaimHistory.deleteMany({ claimId: req.params.id });
    const competingClaims = await refreshCompetingClaimRecommendations(itemId);
    competingClaims.forEach((claim) => emitClaimUpdatedEvent(claim));
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get verification requests by claimant email (for user account page)
exports.getVerificationRequestsByEmail = async (req, res) => {
  try {
    const requests = await VerificationRequest.find({
      'claimantInfo.email': req.params.email.toLowerCase(),
    })
      .populate('itemId')
      .sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Confirm item collection via PIN — admin only
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

    request.status = 'processed';
    request.collectedAt = new Date();
    await request.save();
    await request.populate('itemId');
    await recalculateClaimRecommendation(request);

    await LostFoundItem.findByIdAndUpdate(request.itemId?._id || request.itemId, { status: 'returned' });

    await recordAndEmit(request, {
      event: 'collected',
      actor: 'admin',
      description: `Item physically collected by ${request.claimantInfo.name} — claim closed`,
    });

    // Collection receipt email (non-blocking)
    const claimRef = `CLM-${request._id.toString().slice(-6).toUpperCase()}`;
    sendCollectionReceipt(request.claimantInfo.email, {
      claimantName: request.claimantInfo.name,
      claimRef,
      itemName: request.itemId?.itemName || 'Your item',
      collectedAt: request.collectedAt,
    }).catch(err => console.error('[Email] Failed to send collection receipt:', err.message));

    console.log(`[Collection] Item collected — claim ${request._id}, item ${request.itemId?._id}, claimant: ${request.claimantInfo.email}`);
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Confirm collection error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Regenerate an expired collection PIN — admin only
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
    request.collectionPinExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await request.save();
    await request.populate('itemId');
    await recalculateClaimRecommendation(request);

    await recordAndEmit(request, {
      event: 'pin_regenerated',
      actor: 'admin',
      description: 'Collection PIN regenerated and resent to claimant email',
    });

    const claimRef = `CLM-${request._id.toString().slice(-6).toUpperCase()}`;
    sendApprovalWithPin(request.claimantInfo.email, {
      claimantName: request.claimantInfo.name,
      claimRef,
      itemName: request.itemId?.itemName || 'Your item',
      collectionPin: plainCollectionPin,
      expiryDate: request.collectionPinExpiry,
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
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get full event history for a single claim (for timeline UI)
exports.getClaimHistory = async (req, res) => {
  try {
    const history = await ClaimHistory.find({ claimId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
