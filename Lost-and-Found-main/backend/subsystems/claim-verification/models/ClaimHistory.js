const mongoose = require('mongoose');

// Records every meaningful state change on a VerificationRequest so the
// frontend can render a live timeline without re-fetching the whole document.
const claimHistorySchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationRequest',
      required: true,
      index: true,
    },
    // Who/what triggered the change
    actor: {
      type: String,          // e.g. "admin", "system"
      default: 'admin',
    },
    // The kind of event
    event: {
      type: String,
      enum: [
        'submitted',        // initial claim created
        'stage_updated',    // one or more approval stages changed
        'status_changed',   // overall claim status changed (approved/rejected/processed)
        'pin_regenerated',  // collection PIN resent
        'collected',        // item physically collected
      ],
      required: true,
    },
    // Human-readable summary shown in the timeline
    description: {
      type: String,
      required: true,
    },
    // Snapshot of relevant fields at the time of the event (lightweight)
    snapshot: {
      status: String,
      approvalStages: mongoose.Schema.Types.Mixed,
      notes: String,
    },
  },
  { timestamps: true }  // createdAt is the event timestamp shown in timeline
);

const ClaimHistory = mongoose.model('ClaimHistory', claimHistorySchema);
module.exports = ClaimHistory;
