/**
 * Utility for persisting whether the user has completed or skipped the intro walkthrough.
 * Ensures the intro onboarding screens are only shown ONCE to first-time users.
 */

const INTRO_STORAGE_KEY = 'chaircare_intro_seen_v1';

export const hasSeenIntro = (): boolean => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(INTRO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
  return false;
};

export const markIntroAsSeen = (): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  }
};

export const resetIntroSeen = (): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(INTRO_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }
};
