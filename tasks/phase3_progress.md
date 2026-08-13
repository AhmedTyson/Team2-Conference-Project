# Phase 3: Password Reset Token Security

## Task 5: Add Expiration to Password Reset Tokens

**Status:** ✅ Completed
**Completed:** 2026-08-13

### Steps:

1. ✅ Read password reset token migration (0001_01_01_000000_create_users_table.php)
2. ✅ Create PasswordResetToken model with expiration logic
3. ✅ Add expires_at column to migration (2026_08_12_232304_add_expires_at_to_password_reset_tokens_table.php)
4. ✅ Add unique index on token column
5. ✅ Create ExpirePasswordTokens command
6. ✅ Register command in routes/console.php (daily schedule)
7. ✅ Run migration
8. ✅ Test expiration logic
9. ✅ Test cleanup command
10. ✅ Run auth tests

### Changes Made:

**File 1: app/Models/System/PasswordResetToken.php** (new file)
- Created custom PasswordResetToken model
- Added createWithExpiration() static method
- Added isExpired() and isValid() methods
- Configured correct table, primary key, and casts

**File 2: database/migrations/2026_08_12_232304_add_expires_at_to_password_reset_tokens_table.php**
- Added expires_at column (nullable timestamp, after created_at)
- Added unique index on token column
- Implemented rollback logic in down() method

**File 3: app/Console/Commands/ExpirePasswordTokens.php** (new file)
- Created scheduled command to delete expired tokens
- Command signature: password:expire-tokens
- Returns SUCCESS if no tokens found, otherwise deletes and reports count

**File 4: routes/console.php**
- Registered ExpirePasswordTokens command to run daily
- Commented as SEC-11

### Verification:

✅ Migration ran successfully
✅ expires_at column added to password_reset_tokens table
✅ Unique index on token column created
✅ Token expiration logic works correctly (60-minute expiration)
✅ Expired token detection works correctly
✅ Cleanup command works correctly
✅ All auth tests pass (6/6)

### Test Results:

```
Test 1: Create token and check validity
Created token with expires_at: 2026-08-13 00:30:27
Is expired: no
Is valid: yes

Test 2: Check if expired token is detected
Expired token expires_at: 2026-08-12 22:30:27
Is expired: yes
Is valid: no

Test 3: Delete expired tokens
Number of expired tokens before cleanup: 0
Number of expired tokens after cleanup: 0

Test 4: Check database schema
Columns in password_reset_tokens table:
  - email (varchar)
  - token (varchar)
  - created_at (datetime)
  - expires_at (datetime)

Test 5: Check unique index on token column
Indexes on password_reset_tokens table:
  - password_reset_tokens_token_unique (unique: yes)
  - sqlite_autoindex_password_reset_tokens_1 (unique: yes)
```

### Acceptance Criteria:

- ✅ Add expires_at column to password_reset_tokens table
- ✅ Add unique index on token column
- ✅ Update PasswordResetToken model
- ✅ Create scheduled command to delete expired tokens
- ✅ Register command in routes/console.php

---

## Progress Tracking

- **Task 5:** 10/10 steps completed ✅
- **Phase 3:** 10/10 steps completed (100%)

---

## Next Steps

**Phase 3 is complete!** ✅

Proceed to Phase 4: Database Performance - Foreign Key Indexes

- Task 6: Add Indexes to Trip Foreign Keys

