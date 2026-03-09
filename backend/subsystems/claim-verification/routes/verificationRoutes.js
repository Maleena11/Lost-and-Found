const express = require('express');
const router = express.Router();
const {
  createVerificationRequest,
  getAllVerificationRequests,
  getVerificationRequestById,
  updateVerificationRequestStatus,
  deleteVerificationRequest,
  getVerificationRequestsByItem
} = require('../controllers/verificationController');

// Create new verification request
router.post('/', createVerificationRequest);

// Get all verification requests (admin)
router.get('/', getAllVerificationRequests);

// Get verification request by ID
router.get('/:id', getVerificationRequestById);

// Update verification request status (admin)
router.patch('/:id/status', updateVerificationRequestStatus);

// Delete verification request
router.delete('/:id', deleteVerificationRequest);

// Get verification requests by item ID
router.get('/item/:itemId', getVerificationRequestsByItem);

module.exports = router;