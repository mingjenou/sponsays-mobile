# Testing

## Automated checks available now

```bash
npm run typecheck
npm run lint
npm test
```

The CI workflow runs the same commands after `npm ci`.

## Milestone 1 manual acceptance

1. Run `npx expo start` and confirm a QR code appears.
2. Open the QR code in Expo Go on a physical iPhone or Android phone.
3. Confirm the splash and tagline appear.
4. Complete or skip onboarding.
5. Confirm all six context chips respond.
6. Switch Safe, Spontaneous and Chaos.
7. Tap **SPONSAY ME ✦** and see the deciding state followed by one recommendation.
8. Tap **Not this one** and confirm the rejected place is not immediately repeated.
9. Continue rejecting and confirm the replacement limit leads to context-change guidance.
10. Tap **I’M IN**, open the action view, and test feedback.
11. Test the directions deep link. It intentionally opens the phone’s external maps app.
12. Visit all four tabs.
13. Stop Expo, restart it, scan again and confirm there is no fatal error.

## Scope note

The checked-in Maestro flows describe the future development-build journey. Expo Go itself is not identified as `com.sponsays.preview`, so those flows are not part of this QR milestone’s acceptance gate.
