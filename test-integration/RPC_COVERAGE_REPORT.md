# RPC Test Coverage Report

**Generated:** 2025-11-15T16:47:54.037Z

## Summary

- **Total RPCs:** 83
- **Tested:** 17
- **Untested:** 66
- **Coverage:** 20.5%

## Coverage by Priority

### Critical Priority (17/18 tested)

- ✅ `complete_quest` (Quest System)
- ✅ `complete_step` (Quest System)
- ✅ `create_party` (Party/Group System)
- ❌ `create_party_vote` (Party/Group System)
- ✅ `generate_scavenger_hunt` (Quest System)
- ✅ `generate_single_task_prompt` (Quest System)
- ✅ `get_available_quests` (Quest System)
- ✅ `get_leaderboard` (Progression)
- ✅ `get_party_members` (Party/Group System)
- ✅ `get_quest_detail` (Quest System)
- ✅ `get_user_achievements` (Achievement System)
- ✅ `get_user_level` (Progression)
- ✅ `join_party` (Party/Group System)
- ✅ `leave_party` (Party/Group System)
- ✅ `start_quest` (Quest System)
- ✅ `submit_rating` (Rating System)
- ✅ `test_function` (Uncategorized)
- ✅ `update_user_location` (Location Services)

### High Priority (0/3 tested)

- ❌ `generate_mystery_prompt` (Quest System)
- ❌ `get_user_quests` (Quest System)
- ❌ `submit_step_media` (Quest System)

### Medium Priority (0/59 tested)

- ❌ `accept_single_task_achievement` (Quest System)
- ❌ `add_item_to_group_pool` (Party/Group System)
- ❌ `cast_vote` (Party/Group System)
- ❌ `check_badge_unlock` (Achievement System)
- ❌ `complete_observation_session` (Mini-Games)
- ❌ `complete_quiz_session` (Mini-Games)
- ❌ `complete_single_task_achievement` (Quest System)
- ❌ `create_achievement` (Achievement System)
- ❌ `create_event` (Events System)
- ❌ `create_item_trade` (Trading System)
- ❌ `create_match_request` (Quest System)
- ❌ `create_mystery_quest_from_location` (Quest System)
- ❌ `create_observation_puzzle` (Mini-Games)
- ❌ `create_quest_from_location` (Quest System)
- ❌ `create_scavenger_quest_from_location` (Quest System)
- ❌ `create_single_task_quest_from_location` (Quest System)
- ❌ `create_subgroups` (Party/Group System)
- ❌ `discover_items` (Inventory/Items)
- ❌ `find_matches` (Social/Matching)
- ❌ `get_active_event` (Events System)
- ❌ `get_audio_experiences` (Audio Experiences)
- ❌ `get_available_mini_games` (Mini-Games)
- ❌ `get_collection_sets` (Inventory/Items)
- ❌ `get_event_leaderboard` (Events System)
- ❌ `get_group_pool_items` (Party/Group System)
- ❌ `get_observation_puzzle` (Mini-Games)
- ❌ `get_party_objective_progress` (Party/Group System)
- ❌ `get_party_votes` (Party/Group System)
- ❌ `get_places_nearby` (Location Services)
- ❌ `get_quest_participants` (Quest System)
- ❌ `get_quest_rating_summary` (Rating System)
- ❌ `get_quiz_questions` (Quest System)
- ❌ `get_subgroups` (Party/Group System)
- ❌ `get_user_audio_collection` (Inventory/Items)
- ❌ `get_user_inventory` (Inventory/Items)
- ❌ `get_user_safety_reports` (Safety/Moderation)
- ❌ `get_verification_status` (Verification)
- ❌ `get_vote_results` (Party/Group System)
- ❌ `join_event` (Events System)
- ❌ `process_feedback_categorization` (Safety/Moderation)
- ❌ `purchase_audio` (Audio Experiences)
- ❌ `rate_audio` (Audio Experiences)
- ❌ `record_activity_pattern` (Social/Matching)
- ❌ `request_verification` (Quest System)
- ❌ `respond_to_trade` (Trading System)
- ❌ `start_observation_session` (Mini-Games)
- ❌ `start_quiz_session` (Mini-Games)
- ❌ `submit_observation_count` (Mini-Games)
- ❌ `submit_quiz_answer` (Mini-Games)
- ❌ `submit_safety_report` (Safety/Moderation)
- ❌ `toggle_audio_favorite` (Audio Experiences)
- ❌ `update_audio_progress` (Audio Experiences)
- ❌ `update_event_participation` (Events System)
- ❌ `update_party_objective_progress` (Party/Group System)
- ❌ `update_report_status` (Safety/Moderation)
- ❌ `update_user_preferences` (Social/Matching)
- ❌ `upload_photo` (Uncategorized)
- ❌ `use_item` (Inventory/Items)
- ❌ `verify_observation_item` (Inventory/Items)

### Low Priority (0/3 tested)

- ❌ `create_quiz_question` (Quest System)
- ❌ `get_feedback_analytics` (Safety/Moderation)
- ❌ `get_report_queue` (Safety/Moderation)

## Coverage by Category

### Achievement System (1/3 tested)

- ❌ `check_badge_unlock` [medium]
- ❌ `create_achievement` [medium]
- ✅ `get_user_achievements` [critical]

### Audio Experiences (0/5 tested)

- ❌ `get_audio_experiences` [medium]
- ❌ `purchase_audio` [medium]
- ❌ `rate_audio` [medium]
- ❌ `toggle_audio_favorite` [medium]
- ❌ `update_audio_progress` [medium]

### Events System (0/5 tested)

- ❌ `create_event` [medium]
- ❌ `get_active_event` [medium]
- ❌ `get_event_leaderboard` [medium]
- ❌ `join_event` [medium]
- ❌ `update_event_participation` [medium]

### Inventory/Items (0/6 tested)

- ❌ `discover_items` [medium]
- ❌ `get_collection_sets` [medium]
- ❌ `get_user_audio_collection` [medium]
- ❌ `get_user_inventory` [medium]
- ❌ `use_item` [medium]
- ❌ `verify_observation_item` [medium]

### Location Services (1/2 tested)

- ❌ `get_places_nearby` [medium]
- ✅ `update_user_location` [critical]

### Mini-Games (0/9 tested)

- ❌ `complete_observation_session` [medium]
- ❌ `complete_quiz_session` [medium]
- ❌ `create_observation_puzzle` [medium]
- ❌ `get_available_mini_games` [medium]
- ❌ `get_observation_puzzle` [medium]
- ❌ `start_observation_session` [medium]
- ❌ `start_quiz_session` [medium]
- ❌ `submit_observation_count` [medium]
- ❌ `submit_quiz_answer` [medium]

### Party/Group System (4/14 tested)

- ❌ `add_item_to_group_pool` [medium]
- ❌ `cast_vote` [medium]
- ✅ `create_party` [critical]
- ❌ `create_party_vote` [critical]
- ❌ `create_subgroups` [medium]
- ❌ `get_group_pool_items` [medium]
- ✅ `get_party_members` [critical]
- ❌ `get_party_objective_progress` [medium]
- ❌ `get_party_votes` [medium]
- ❌ `get_subgroups` [medium]
- ❌ `get_vote_results` [medium]
- ✅ `join_party` [critical]
- ✅ `leave_party` [critical]
- ❌ `update_party_objective_progress` [medium]

### Progression (2/2 tested)

- ✅ `get_leaderboard` [critical]
- ✅ `get_user_level` [critical]

### Quest System (7/21 tested)

- ❌ `accept_single_task_achievement` [medium]
- ✅ `complete_quest` [critical]
- ❌ `complete_single_task_achievement` [medium]
- ✅ `complete_step` [critical]
- ❌ `create_match_request` [medium]
- ❌ `create_mystery_quest_from_location` [medium]
- ❌ `create_quest_from_location` [medium]
- ❌ `create_quiz_question` [low]
- ❌ `create_scavenger_quest_from_location` [medium]
- ❌ `create_single_task_quest_from_location` [medium]
- ❌ `generate_mystery_prompt` [high]
- ✅ `generate_scavenger_hunt` [critical]
- ✅ `generate_single_task_prompt` [critical]
- ✅ `get_available_quests` [critical]
- ✅ `get_quest_detail` [critical]
- ❌ `get_quest_participants` [medium]
- ❌ `get_quiz_questions` [medium]
- ❌ `get_user_quests` [high]
- ❌ `request_verification` [medium]
- ✅ `start_quest` [critical]
- ❌ `submit_step_media` [high]

### Rating System (1/2 tested)

- ❌ `get_quest_rating_summary` [medium]
- ✅ `submit_rating` [critical]

### Safety/Moderation (0/6 tested)

- ❌ `get_feedback_analytics` [low]
- ❌ `get_report_queue` [low]
- ❌ `get_user_safety_reports` [medium]
- ❌ `process_feedback_categorization` [medium]
- ❌ `submit_safety_report` [medium]
- ❌ `update_report_status` [medium]

### Social/Matching (0/3 tested)

- ❌ `find_matches` [medium]
- ❌ `record_activity_pattern` [medium]
- ❌ `update_user_preferences` [medium]

### Trading System (0/2 tested)

- ❌ `create_item_trade` [medium]
- ❌ `respond_to_trade` [medium]

### Uncategorized (1/2 tested)

- ✅ `test_function` [critical]
- ❌ `upload_photo` [medium]

### Verification (0/1 tested)

- ❌ `get_verification_status` [medium]

## Complete RPC List

### Tested RPCs (17)

- `complete_quest`
- `complete_step`
- `create_party`
- `generate_scavenger_hunt`
- `generate_single_task_prompt`
- `get_available_quests`
- `get_leaderboard`
- `get_party_members`
- `get_quest_detail`
- `get_user_achievements`
- `get_user_level`
- `join_party`
- `leave_party`
- `start_quest`
- `submit_rating`
- `test_function`
- `update_user_location`

### Untested RPCs (66)

- `accept_single_task_achievement` [Quest System, medium]
- `add_item_to_group_pool` [Party/Group System, medium]
- `cast_vote` [Party/Group System, medium]
- `check_badge_unlock` [Achievement System, medium]
- `complete_observation_session` [Mini-Games, medium]
- `complete_quiz_session` [Mini-Games, medium]
- `complete_single_task_achievement` [Quest System, medium]
- `create_achievement` [Achievement System, medium]
- `create_event` [Events System, medium]
- `create_item_trade` [Trading System, medium]
- `create_match_request` [Quest System, medium]
- `create_mystery_quest_from_location` [Quest System, medium]
- `create_observation_puzzle` [Mini-Games, medium]
- `create_party_vote` [Party/Group System, critical]
- `create_quest_from_location` [Quest System, medium]
- `create_quiz_question` [Quest System, low]
- `create_scavenger_quest_from_location` [Quest System, medium]
- `create_single_task_quest_from_location` [Quest System, medium]
- `create_subgroups` [Party/Group System, medium]
- `discover_items` [Inventory/Items, medium]
- `find_matches` [Social/Matching, medium]
- `generate_mystery_prompt` [Quest System, high]
- `get_active_event` [Events System, medium]
- `get_audio_experiences` [Audio Experiences, medium]
- `get_available_mini_games` [Mini-Games, medium]
- `get_collection_sets` [Inventory/Items, medium]
- `get_event_leaderboard` [Events System, medium]
- `get_feedback_analytics` [Safety/Moderation, low]
- `get_group_pool_items` [Party/Group System, medium]
- `get_observation_puzzle` [Mini-Games, medium]
- `get_party_objective_progress` [Party/Group System, medium]
- `get_party_votes` [Party/Group System, medium]
- `get_places_nearby` [Location Services, medium]
- `get_quest_participants` [Quest System, medium]
- `get_quest_rating_summary` [Rating System, medium]
- `get_quiz_questions` [Quest System, medium]
- `get_report_queue` [Safety/Moderation, low]
- `get_subgroups` [Party/Group System, medium]
- `get_user_audio_collection` [Inventory/Items, medium]
- `get_user_inventory` [Inventory/Items, medium]
- `get_user_quests` [Quest System, high]
- `get_user_safety_reports` [Safety/Moderation, medium]
- `get_verification_status` [Verification, medium]
- `get_vote_results` [Party/Group System, medium]
- `join_event` [Events System, medium]
- `process_feedback_categorization` [Safety/Moderation, medium]
- `purchase_audio` [Audio Experiences, medium]
- `rate_audio` [Audio Experiences, medium]
- `record_activity_pattern` [Social/Matching, medium]
- `request_verification` [Quest System, medium]
- `respond_to_trade` [Trading System, medium]
- `start_observation_session` [Mini-Games, medium]
- `start_quiz_session` [Mini-Games, medium]
- `submit_observation_count` [Mini-Games, medium]
- `submit_quiz_answer` [Mini-Games, medium]
- `submit_safety_report` [Safety/Moderation, medium]
- `submit_step_media` [Quest System, high]
- `toggle_audio_favorite` [Audio Experiences, medium]
- `update_audio_progress` [Audio Experiences, medium]
- `update_event_participation` [Events System, medium]
- `update_party_objective_progress` [Party/Group System, medium]
- `update_report_status` [Safety/Moderation, medium]
- `update_user_preferences` [Social/Matching, medium]
- `upload_photo` [Uncategorized, medium]
- `use_item` [Inventory/Items, medium]
- `verify_observation_item` [Inventory/Items, medium]
