import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordFailedLogin,
  resetFailedLogins,
  checkAccountLock,
  getFailedAttempts
} from './rate-limiter';

describe('Authentication Security Tests', () => {
  const testEmail = 'test@example.com';

  beforeEach(() => {
    // Reset failed logins before each test
    resetFailedLogins(testEmail);
  });

  describe('Account Lockout', () => {
    it('should not lock account with fewer than 5 failed attempts', () => {
      // Record 4 failed attempts
      for (let i = 0; i < 4; i++) {
        recordFailedLogin(testEmail);
      }

      const lockedUntil = checkAccountLock(testEmail);
      expect(lockedUntil).toBeNull();
      expect(getFailedAttempts(testEmail)).toBe(4);
    });

    it('should lock account for 15 minutes after 5 failed attempts', () => {
      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(testEmail);
      }

      const lockedUntil = checkAccountLock(testEmail);
      expect(lockedUntil).not.toBeNull();
      expect(getFailedAttempts(testEmail)).toBe(5);

      // Check that lock duration is approximately 15 minutes
      if (lockedUntil) {
        const lockDuration = lockedUntil.getTime() - Date.now();
        expect(lockDuration).toBeGreaterThan(14 * 60 * 1000); // At least 14 minutes
        expect(lockDuration).toBeLessThan(16 * 60 * 1000); // At most 16 minutes
      }
    });

    it('should lock account for 1 hour after 10 failed attempts', () => {
      // Record 10 failed attempts
      for (let i = 0; i < 10; i++) {
        recordFailedLogin(testEmail);
      }

      const lockedUntil = checkAccountLock(testEmail);
      expect(lockedUntil).not.toBeNull();
      expect(getFailedAttempts(testEmail)).toBe(10);

      // Check that lock duration is approximately 1 hour
      if (lockedUntil) {
        const lockDuration = lockedUntil.getTime() - Date.now();
        expect(lockDuration).toBeGreaterThan(59 * 60 * 1000); // At least 59 minutes
        expect(lockDuration).toBeLessThan(61 * 60 * 1000); // At most 61 minutes
      }
    });

    it('should lock account for 24 hours after 20 failed attempts', () => {
      // Record 20 failed attempts
      for (let i = 0; i < 20; i++) {
        recordFailedLogin(testEmail);
      }

      const lockedUntil = checkAccountLock(testEmail);
      expect(lockedUntil).not.toBeNull();
      expect(getFailedAttempts(testEmail)).toBe(20);

      // Check that lock duration is approximately 24 hours
      if (lockedUntil) {
        const lockDuration = lockedUntil.getTime() - Date.now();
        expect(lockDuration).toBeGreaterThan(23.9 * 60 * 60 * 1000); // At least 23.9 hours
        expect(lockDuration).toBeLessThan(24.1 * 60 * 60 * 1000); // At most 24.1 hours
      }
    });

    it('should reset failed attempts on successful login', () => {
      // Record 4 failed attempts
      for (let i = 0; i < 4; i++) {
        recordFailedLogin(testEmail);
      }

      expect(getFailedAttempts(testEmail)).toBe(4);

      // Reset on successful login
      resetFailedLogins(testEmail);

      expect(getFailedAttempts(testEmail)).toBe(0);
      expect(checkAccountLock(testEmail)).toBeNull();
    });

    it('should normalize email addresses (case-insensitive)', () => {
      recordFailedLogin('TEST@EXAMPLE.COM');
      recordFailedLogin('test@example.com');
      recordFailedLogin('Test@Example.Com');

      expect(getFailedAttempts('test@example.com')).toBe(3);
      expect(getFailedAttempts('TEST@EXAMPLE.COM')).toBe(3);
    });
  });
});
