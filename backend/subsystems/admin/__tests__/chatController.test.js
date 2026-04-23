const { buildFallbackReply, normalizeMessage } = require('../controllers/chatController');

describe('chatController fallback replies', () => {
  test('normalizes punctuation and casing safely', () => {
    expect(normalizeMessage('  Hello!! Verification??  ')).toBe('hello verification');
  });

  test('returns greeting help for hello messages', () => {
    const reply = buildFallbackReply('Hi there');

    expect(reply).toMatch(/report a lost item/i);
  });

  test('returns verification steps for verification questions', () => {
    const reply = buildFallbackReply('give me the steps to varification og items');

    expect(reply).toMatch(/to verify and claim an item/i);
    expect(reply).toMatch(/submit your claim/i);
    expect(reply).not.toMatch(/tell me what happened and i will guide you/i);
  });

  test('returns verification steps for ownership proof questions', () => {
    const reply = buildFallbackReply('How do I prove ownership before collecting the item?');

    expect(reply).toMatch(/proof of ownership/i);
    expect(reply).toMatch(/collection instructions or pin/i);
  });
});
