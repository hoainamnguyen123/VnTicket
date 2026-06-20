import { describe, expect, it } from 'vitest';
import { getRoleNavigation } from './navigationPolicy';

describe('getRoleNavigation', () => {
  it('replaces personal ticket navigation with admin management for admins', () => {
    const navigation = getRoleNavigation({ role: 'ROLE_ADMIN' });

    expect(navigation.showMyTickets).toBe(false);
    expect(navigation.showOrganizer).toBe(false);
    expect(navigation.primaryDestination).toBe('/admin');
  });

  it('keeps personal ticket and organizer navigation for normal users', () => {
    const navigation = getRoleNavigation({ role: 'ROLE_USER' });

    expect(navigation.showMyTickets).toBe(true);
    expect(navigation.showOrganizer).toBe(true);
    expect(navigation.primaryDestination).toBe('/history');
  });

  it('does not expose authenticated navigation to guests', () => {
    const navigation = getRoleNavigation(null);

    expect(navigation.showMyTickets).toBe(false);
    expect(navigation.showOrganizer).toBe(true);
  });
});
