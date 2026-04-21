const express = require('express');
const router = express.Router();
const {
  createVerificationRequest,
  getAllVerificationRequests,
  getVerificationRequestById,
  updateVerificationRequestStatus,
  updateApprovalStages,
  deleteVerificationRequest,
  getVerificationRequestsByItem,
  getVerificationRequestsByEmail,
  confirmCollection,
  regeneratePin,
  getClaimHistory,
} = require('../controllers/verificationController');

// Create new verification request
router.post('/', createVerificationRequest);

// Get all verification requests (admin)
router.get('/', getAllVerificationRequests);

// Get verification request by ID
router.get('/:id', getVerificationRequestById);

// Update verification request status (admin)
router.patch('/:id/status', updateVerificationRequestStatus);

// Save approval stage progress (admin)
router.patch('/:id/stages', updateApprovalStages);

// Delete verification request
router.delete('/:id', deleteVerificationRequest);

// Get verification requests by item ID
router.get('/item/:itemId', getVerificationRequestsByItem);

// Get verification requests by claimant email (user account page)
router.get('/user/:email', getVerificationRequestsByEmail);

// Confirm student collected item using their collection PIN
router.post('/:id/confirm-collection', confirmCollection);

// Regenerate collection PIN for an approved claim
router.patch('/:id/regenerate-pin', regeneratePin);

// Get full event history / timeline for a claim
router.get('/:id/history', getClaimHistory);

module.exports = router;