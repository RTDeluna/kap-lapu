export type SpotVisibility = 'private' | 'followers' | 'public';

export type PrivacyLine = 'Exact pin' | 'Followers only' | 'Only you' | 'Approximate area';

export interface PrivacyInput {
  visibility: SpotVisibility;
  is_exact: boolean;
  author_id: string;
  author_handle: string;
}

/**
 * The one line every spot shows about who sees what.
 * - Only you: a private spot (only its author can load it at all).
 * - Followers only: the author looking at their own followers spot.
 * - Exact pin: someone else's spot where the server handed this viewer the exact point.
 * - Approximate area: everything else, including the author's own public spot,
 *   because that is what everyone else sees.
 */
export function privacyLine(spot: PrivacyInput, viewerId: string | null | undefined): PrivacyLine {
  const isAuthor = !!viewerId && viewerId === spot.author_id;
  if (spot.visibility === 'private') return 'Only you';
  if (isAuthor) return spot.visibility === 'followers' ? 'Followers only' : 'Approximate area';
  return spot.is_exact ? 'Exact pin' : 'Approximate area';
}

/** A longer sentence for the spot detail screen. */
export function privacyDetail(spot: PrivacyInput, viewerId: string | null | undefined): string {
  const line = privacyLine(spot, viewerId);
  const handle = `@${spot.author_handle}`;
  switch (line) {
    case 'Only you':
      return 'Only you. Nobody else sees this spot.';
    case 'Followers only':
      return 'Followers only. Your barkada sees the exact pin.';
    case 'Exact pin':
      return `Exact pin. Shared with ${handle}'s followers.`;
    case 'Approximate area':
      if (viewerId && viewerId === spot.author_id) {
        return 'Approximate area. Others see a circle, never the exact point.';
      }
      return spot.visibility === 'followers'
        ? `Approximate area. Exact pin is for ${handle}'s followers.`
        : `Approximate area. Only ${handle} knows the exact pin.`;
  }
}
