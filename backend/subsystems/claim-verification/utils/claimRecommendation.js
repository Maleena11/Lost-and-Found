const VerificationRequest = require('../models/VerificationRequest');

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'your', 'item',
  'near', 'into', 'onto', 'were', 'been', 'their', 'there', 'about', 'after',
  'before', 'because', 'while', 'where', 'when', 'them', 'they', 'will',
]);

function extractKeywords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function jaccardScore(a, b, maxScore) {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((word) => setB.has(word)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? Math.round((intersection / union) * maxScore) : 0;
}

function formatRecommendationAction(action) {
  return {
    approved: 'Already Approved',
    collected: 'Collected',
    reject_candidate: 'Reject Candidate',
    approve_candidate: 'Approve Candidate',
    manual_review: 'Manual Review',
    needs_more_evidence: 'Needs More Evidence',
  }[action] || 'Manual Review';
}

function buildSummary(action, band, competingClaims) {
  if (action === 'approved') return 'Admin has already approved this claim.';
  if (action === 'collected') return 'Claim is complete and the item has been collected.';
  if (action === 'reject_candidate') return 'Evidence is currently weak or inconsistent and should be reviewed carefully.';
  if (action === 'approve_candidate') {
    return competingClaims > 0
      ? 'Evidence is strong, but there are competing claims that still require a final check.'
      : 'Evidence is strong and the claim appears ready for approval.';
  }
  if (action === 'needs_more_evidence') return 'Claim needs stronger ownership evidence before approval.';
  return band === 'High'
    ? 'Claim looks strong overall, but a staff member should verify the final decision.'
    : 'Claim should stay in manual review while staff verify the evidence.';
}

async function buildClaimRecommendation(claim) {
  if (!claim) {
    return {
      score: 0,
      band: 'Low',
      action: 'needs_more_evidence',
      actionLabel: 'Needs More Evidence',
      summary: 'No claim data is available yet.',
      reasons: [],
      risks: ['Claim data is incomplete'],
      competingClaims: 0,
      breakdown: {},
      updatedAt: new Date(),
    };
  }

  const vd = claim.verificationDetails || {};
  const ci = claim.claimantInfo || {};
  const item = claim.itemId || {};
  const claimantImages = claim.claimantImages || [];
  const stages = claim.approvalStages || {};

  let completeness = 0;
  const desc = (vd.description || '').trim();
  if (desc.length >= 80) completeness += 12;
  else if (desc.length >= 30) completeness += 7;

  if ((vd.ownershipProof || '').trim().length >= 20) completeness += 8;
  else if ((vd.ownershipProof || '').trim().length > 0) completeness += 4;

  if ((vd.additionalInfo || '').trim().length > 0) completeness += 4;

  const claimantFields = [ci.name, ci.email, ci.phone, ci.address];
  const filledFields = claimantFields.filter((value) => value && String(value).trim().length > 0).length;
  completeness += Math.round((filledFields / 4) * 6);

  const claimWords = extractKeywords(`${vd.description || ''} ${vd.additionalInfo || ''}`);
  const itemWords = extractKeywords(`${item.itemName || ''} ${item.description || ''}`);
  const textMatch = jaccardScore(claimWords, itemWords, 20);

  const locationWords = extractKeywords(`${vd.additionalInfo || ''} ${vd.description || ''}`);
  const itemLocationWords = extractKeywords(item.location || '');
  const locationMatch = jaccardScore(locationWords, itemLocationWords, 10);

  const imageEvidence = claimantImages.length > 0 ? 10 : 0;

  const stageStatuses = ['stage1', 'stage2', 'stage3'].map((key) => stages[key]?.status || 'pending');
  const failedStages = stageStatuses.filter((status) => status === 'failed').length;
  const passedStages = stageStatuses.filter((status) => status === 'passed').length;
  const stageProgress = failedStages > 0 ? 0 : passedStages * 5;

  const competingClaims = await VerificationRequest.countDocuments({
    itemId: item._id || claim.itemId,
    status: 'pending',
    _id: { $ne: claim._id },
  });

  let competition = 15;
  if (competingClaims === 1) competition = 8;
  else if (competingClaims >= 2) competition = 0;

  const score = Math.min(100, completeness + textMatch + locationMatch + imageEvidence + stageProgress + competition);
  const band = score >= 75 ? 'High' : score >= 45 ? 'Medium' : 'Low';

  let action = 'manual_review';
  if (claim.status === 'approved') action = 'approved';
  else if (claim.status === 'processed') action = 'collected';
  else if (claim.status === 'rejected' || failedStages > 0 || score < 35) action = 'reject_candidate';
  else if (score >= 75 && competingClaims === 0) action = 'approve_candidate';
  else if (score < 55) action = 'needs_more_evidence';

  const reasons = [];
  const risks = [];

  if (completeness >= 22) reasons.push('Claim details are well filled and specific.');
  else if (completeness >= 14) reasons.push('Claim form is reasonably complete.');
  else risks.push('Claim form is missing useful ownership details.');

  if (textMatch >= 12) reasons.push('Description strongly overlaps with the found item details.');
  else if (textMatch > 0) reasons.push('Description has some overlap with the found item details.');
  else risks.push('Description has weak textual overlap with the found item details.');

  if (locationMatch >= 6) reasons.push('Claim context aligns with the item location.');
  else if (item.location && locationWords.length > 0) risks.push('Claim context does not clearly support the item location.');

  if (imageEvidence > 0) reasons.push('Claimant uploaded supporting image evidence.');
  else risks.push('No claimant image evidence was submitted.');

  if (passedStages > 0) reasons.push(`Admin has already passed ${passedStages} verification stage${passedStages > 1 ? 's' : ''}.`);
  if (failedStages > 0) risks.push('At least one verification stage has failed.');

  if (competingClaims > 0) {
    risks.push(
      competingClaims === 1
        ? 'There is 1 competing pending claim for the same item.'
        : `There are ${competingClaims} competing pending claims for the same item.`
    );
  } else {
    reasons.push('There are no competing pending claims for this item.');
  }

  return {
    score,
    band,
    action,
    actionLabel: formatRecommendationAction(action),
    summary: buildSummary(action, band, competingClaims),
    reasons,
    risks,
    competingClaims,
    breakdown: {
      completeness: { score: completeness, max: 30 },
      textMatch: { score: textMatch, max: 20 },
      locationMatch: { score: locationMatch, max: 10 },
      imageEvidence: { score: imageEvidence, max: 10 },
      stageProgress: { score: stageProgress, max: 15 },
      competition: { score: competition, max: 15 },
    },
    updatedAt: new Date(),
  };
}

module.exports = { buildClaimRecommendation };
