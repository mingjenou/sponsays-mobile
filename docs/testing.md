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
4. Tap **Try SponSays without an account** and confirm Do opens directly without onboarding.
5. Confirm Do shows the idea field, Filters button and coral **SponSays** CTA, with no behaviour selector.
6. Enter **Hike**, choose a future local date and time plus $$ / 2 people, apply, and request a recommendation.
7. Confirm the deciding state is followed by one demo recommendation.
8. Tap **Not this one** and confirm the rejected place is not immediately repeated.
9. Continue rejecting and confirm up to eight replacements are distinct; if the pool runs out earlier, confirm the app shows calm context-change guidance.
10. Tap **I’M IN**, open the action view, and test feedback.
11. Test the directions deep link. It intentionally opens the phone’s external maps app.
12. Visit all four tabs.
13. Stop Expo, restart it, scan again and confirm there is no fatal error.

Repeat the Do test with **Vegetarian Food** and **Live Music**.

## Task 4B authenticated provider acceptance

Complete [Google Places setup](google-places-setup.md), sign in, and then:

1. Confirm successful sign-in opens Do directly, with no onboarding selection screen.
2. Search **Hike** and verify one real hiking/trail/nature place. Reject it and verify a different relevant provider ID where the pool allows.
3. Search **Vegetarian Food**, then repeat with a future local date/time / $$ / 2 people. Confirm the exact datetime reaches the request pipeline without unsupported future-opening guarantee copy.
4. Search **Live Music** and verify a relevant venue. The app must not claim a live performance is happening at that moment.
5. On a real recommendation, tap **I’M IN**, confirm **YOU’RE GOING.**, and open directions to the real coordinates.
6. While signed in, test Save for Later, feedback and Memories.
7. Deny foreground location once and confirm the UI identifies central Adelaide as a fallback rather than claiming “near you.”
8. Temporarily test with the function/key unavailable and confirm the app labels its Adelaide demo fallback.

Development logs identify `source=google_places` and the provider place ID. Normal consumer UI does not display raw IDs. Automated tests use fixtures and never call Google.

## Scope note

The checked-in Maestro flows describe the future development-build journey. Expo Go itself is not identified as `com.sponsays.preview`, so those flows are not part of this QR milestone’s acceptance gate.
