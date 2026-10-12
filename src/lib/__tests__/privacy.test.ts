import { privacyDetail, privacyLine, type PrivacyInput } from '../privacy';

const AUTHOR = 'author-1';
const OTHER = 'viewer-2';
const spot = (over: Partial<PrivacyInput>): PrivacyInput => ({
  visibility: 'public',
  is_exact: false,
  author_id: AUTHOR,
  author_handle: 'kuyajun',
  ...over,
});

describe('privacyLine', () => {
  it('private spots are only you', () => {
    expect(privacyLine(spot({ visibility: 'private', is_exact: true }), AUTHOR)).toBe('Only you');
  });
  it('the author of a followers spot sees followers only', () => {
    expect(privacyLine(spot({ visibility: 'followers', is_exact: true }), AUTHOR)).toBe('Followers only');
  });
  it('an accepted follower sees the exact pin', () => {
    expect(privacyLine(spot({ visibility: 'followers', is_exact: true }), OTHER)).toBe('Exact pin');
  });
  it('public spots are approximate for everyone, the author included', () => {
    expect(privacyLine(spot({}), OTHER)).toBe('Approximate area');
    expect(privacyLine(spot({}), null)).toBe('Approximate area');
    expect(privacyLine(spot({ is_exact: true }), AUTHOR)).toBe('Approximate area');
  });
  it('a followers spot without the exact point is approximate', () => {
    expect(privacyLine(spot({ visibility: 'followers' }), OTHER)).toBe('Approximate area');
  });
});

describe('privacyDetail', () => {
  it('names the author for followers spots', () => {
    expect(privacyDetail(spot({ visibility: 'followers' }), OTHER)).toBe(
      "Approximate area. Exact pin is for @kuyajun's followers.",
    );
  });
  it('reassures the author about public spots', () => {
    expect(privacyDetail(spot({ is_exact: true }), AUTHOR)).toBe(
      'Approximate area. Others see a circle, never the exact point.',
    );
  });
  it('explains private spots', () => {
    expect(privacyDetail(spot({ visibility: 'private' }), AUTHOR)).toBe('Only you. Nobody else sees this spot.');
  });
});
