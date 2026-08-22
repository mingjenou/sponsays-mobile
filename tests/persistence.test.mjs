import assert from 'node:assert/strict';
import test from 'node:test';
import { mapSignInError, mapSignUpError } from '../src/features/auth/errorMapping.ts';
import { saveSettings } from '../src/features/profile/settingsPersistence.ts';
import {
  trackRecommendationPersistence,
  waitForRecommendationPersistence,
} from '../src/features/recommendations/persistenceReadiness.ts';

const settings = {
  displayName: '  Ming  ',
  homeCity: '  Adelaide  ',
  interests: ['Food', 'Culture'],
  dietaryPreferences: ['Vegetarian'],
  budget: '$$',
  distanceKm: 10,
  socialContext: 'Friends',
};

test('signed-in Settings maps and saves profile and preference fields', async () => {
  let profileInput;
  let preferenceInput;
  const status = await saveSettings(true, settings, {
    updateProfile: async (input) => {
      profileInput = input;
      return { error: null };
    },
    savePreferences: async (input) => {
      preferenceInput = input;
      return { error: null };
    },
  });

  assert.equal(status, 'saved');
  assert.deepEqual(profileInput, {
    displayName: 'Ming',
    homeCity: 'Adelaide',
  });
  assert.deepEqual(preferenceInput, {
    interests: ['Food', 'Culture'],
    dietaryPreferences: ['Vegetarian'],
    defaultBudget: '$$',
    defaultDistanceKm: 10,
    defaultSocialContext: 'Friends',
    defaultSpontaneityMode: 'spontaneous',
  });
});

test('signed-out Settings never calls a persistence gateway', async () => {
  let writes = 0;
  const status = await saveSettings(false, settings, {
    updateProfile: async () => {
      writes += 1;
      return { error: null };
    },
    savePreferences: async () => {
      writes += 1;
      return { error: null };
    },
  });

  assert.equal(status, 'demo');
  assert.equal(writes, 0);
});

test('feedback readiness waits for the recommendation persistence queue', async () => {
  let finishPersistence;
  const persistence = new Promise((resolve) => {
    finishPersistence = resolve;
  });
  trackRecommendationPersistence('recommendation-1', persistence);

  let feedbackCanWrite = false;
  const waiting = waitForRecommendationPersistence('recommendation-1').then(() => {
    feedbackCanWrite = true;
  });
  await Promise.resolve();
  assert.equal(feedbackCanWrite, false);

  finishPersistence();
  await waiting;
  assert.equal(feedbackCanWrite, true);
});

test('auth errors retain the required friendly mappings', () => {
  assert.deepEqual(mapSignInError('email_not_confirmed'), {
    code: 'email_not_confirmed',
    message: 'Please confirm your email before signing in.',
  });
  assert.deepEqual(mapSignInError('invalid_credentials'), {
    code: 'invalid_credentials',
    message: "That email or password doesn't look right.",
  });
  assert.deepEqual(mapSignInError('over_email_send_rate_limit'), {
    code: 'over_email_send_rate_limit',
    message: 'Please wait a moment before requesting another email.',
  });
  assert.deepEqual(mapSignUpError('unexpected'), {
    code: 'sign_up_failed',
    message: "We couldn't create your account. Please try again.",
  });
});
