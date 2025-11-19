# Untestable RPCs Documentation

**Generated:** 2025-11-15  
**Purpose:** Document RPCs that cannot be tested in standard integration tests

---

## Admin-Only RPCs

These RPCs require administrative permissions and cannot be tested with standard user accounts:

### `create_quiz_question`
**Category:** Quest System  
**Priority:** Low  
**Reason:** Requires admin permissions to create quiz questions  
**Workaround:** Would need admin test account or special test setup

### `create_observation_puzzle`
**Category:** Mini-Games  
**Priority:** Medium  
**Reason:** Requires admin permissions to create observation puzzles  
**Workaround:** Would need admin test account or special test setup

### `get_feedback_analytics`
**Category:** Safety/Moderation  
**Priority:** Low  
**Reason:** Requires admin permissions to view analytics  
**Workaround:** Would need admin test account

### `get_report_queue`
**Category:** Safety/Moderation  
**Priority:** Low  
**Reason:** Requires admin permissions to view report queue  
**Workaround:** Would need admin test account

### `update_report_status`
**Category:** Safety/Moderation  
**Priority:** Medium  
**Reason:** Requires admin permissions to update report status  
**Workaround:** Would need admin test account

### `process_feedback_categorization`
**Category:** Safety/Moderation  
**Priority:** Medium  
**Reason:** Requires admin permissions to process feedback  
**Workaround:** Would need admin test account

---

## RPCs Requiring Special Setup

These RPCs may be testable but require special conditions:

### `get_places_nearby`
**Category:** Location Services  
**Priority:** Medium  
**Reason:** Requires GOOGLE_MAPS_API_KEY for full functionality  
**Status:** Can be tested with API key, but limited without it

### `upload_photo`
**Category:** Uncategorized  
**Priority:** Medium  
**Reason:** Requires MINIO configuration for photo storage  
**Status:** Can be tested with MINIO setup, but will fail without it

---

## Recommendations

1. **Admin Test Account:** Create a dedicated admin test account for testing admin-only RPCs
2. **Mock Services:** Consider mocking external services (Google Maps, MINIO) for consistent testing
3. **Test Environment:** Set up a dedicated test environment with all required services configured
4. **Documentation:** Keep this list updated as new untestable RPCs are identified

---

**Last Updated:** 2025-11-15

