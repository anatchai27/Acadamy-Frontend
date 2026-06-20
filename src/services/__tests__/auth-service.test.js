import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoredToken,
  getStoredUser,
  setAuthStorage,
  clearAuthStorage,
} from '../auth-service';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYwMDAxLCJlbWFpbCI6Im51dHByZW1vMDJAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIn0.abc123';
const mockUser = { userId: 60001, email: 'nutpremo02@gmail.com', role: 'admin' };

describe('Auth Service - localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setAuthStorage', () => {
    // ── Arrange-Act-Assert ──

    it('1. stores token in localStorage under auth_token key', () => {
      // Arrange
      // Act
      setAuthStorage(mockToken, mockUser);
      // Assert
      expect(localStorage.getItem(TOKEN_KEY)).toBe(mockToken);
    });

    it('2. stores user as JSON string under auth_user key', () => {
      // Arrange
      // Act
      setAuthStorage(mockToken, mockUser);
      // Assert
      const raw = localStorage.getItem(USER_KEY);
      expect(JSON.parse(raw)).toEqual(mockUser);
    });

    it('3. stores both token and user in a single call', () => {
      // Arrange
      // Act
      setAuthStorage(mockToken, mockUser);
      // Assert
      expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy();
      expect(localStorage.getItem(USER_KEY)).toBeTruthy();
    });
  });

  describe('getStoredToken', () => {
    it('4. returns token when previously stored', () => {
      // Arrange
      localStorage.setItem(TOKEN_KEY, mockToken);
      // Act
      const result = getStoredToken();
      // Assert
      expect(result).toBe(mockToken);
    });

    it('5. returns null when no token stored', () => {
      // Arrange
      // Act
      const result = getStoredToken();
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getStoredUser', () => {
    it('6. returns parsed user object when stored', () => {
      // Arrange
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      // Act
      const result = getStoredUser();
      // Assert
      expect(result).toEqual(mockUser);
    });

    it('7. returns null when no user stored', () => {
      // Arrange
      // Act
      const result = getStoredUser();
      // Assert
      expect(result).toBeNull();
    });

    it('8. returns null when stored JSON is malformed', () => {
      // Arrange
      localStorage.setItem(USER_KEY, '{broken json');
      // Act
      const result = getStoredUser();
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('clearAuthStorage', () => {
    it('9. removes both token and user from localStorage', () => {
      // Arrange
      setAuthStorage(mockToken, mockUser);
      // Act
      clearAuthStorage();
      // Assert
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });

    it('10. does not throw when called on empty storage', () => {
      // Arrange
      // Act & Assert
      expect(() => clearAuthStorage()).not.toThrow();
    });
  });
});
