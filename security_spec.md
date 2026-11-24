# Firestore Security Specification

## 1. Data Invariants
1. `cafeProfiles/{userId}` can only be created or updated by `request.auth.uid == userId`, contains zero PII (no email/phone/address), enforces `totalFocusMinutes >= 0`, and allows `totalFocusMinutes` to grow by at most 120 minutes per update.
2. `moodNotes/{noteId}` must carry `uid == request.auth.uid`, `roomId == 'main-cafe'`, server timestamp `createdAt == request.time`, bounded `content` (1..120 chars), and can only be deleted by its author (`existing().uid == request.auth.uid`).
3. `chatMessages/{messageId}` must carry `uid == request.auth.uid`, `roomId == 'main-cafe'`, server timestamp `createdAt == request.time`, bounded `text` (1..200 chars), and is immutable after creation (`update` denied).
4. All `list` queries explicitly validate `resource.data.roomId == 'main-cafe'` and `isSignedIn()`.

## 2. Dirty Dozen Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read/write to `cafeProfiles`, `moodNotes`, or `chatMessages`.
2. Creating `cafeProfiles/otherUser` with `uid: "otherUser"` while signed in as `userA`.
3. Creating `cafeProfiles/userA` with an extra shadow field `isAdmin: true`.
4. Updating `cafeProfiles/userA` to inflate `totalFocusMinutes` by `+5000` in a single write.
5. Updating `cafeProfiles/userA` to mutate immutable `uid` or `createdAt`.
6. Creating `cafeProfiles/userA` with a 500-character `nickname`.
7. Creating `moodNotes/{id}` with `uid: "someoneElse"` (identity spoofing).
8. Creating `moodNotes/{id}` with a forged past `createdAt` timestamp instead of `request.time`.
9. Deleting another user's `moodNotes/{id}`.
10. Creating `chatMessages/{id}` with `text` longer than 200 characters.
11. Updating an existing `chatMessages/{id}` document.
12. Using an invalid document ID containing `/` or special characters longer than 128 chars.
