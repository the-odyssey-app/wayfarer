# Maestro E2E Testing Best Practices

This document outlines best practices for writing reliable, maintainable Maestro E2E tests for the Wayfarer mobile app.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Element Selection Strategies](#element-selection-strategies)
3. [Writing Reliable Assertions](#writing-reliable-assertions)
4. [Navigation Verification](#navigation-verification)
5. [Handling Dynamic Content](#handling-dynamic-content)
6. [Common Patterns](#common-patterns)
7. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
8. [Troubleshooting](#troubleshooting)
9. [Examples from Wayfarer](#examples-from-wayfarer)

---

## Core Principles

### 1. Use testID for Critical Elements

**Why:** testID provides the most reliable way to target elements. It doesn't break when text changes, works across locales, and is immune to UI styling changes.

**How to Add testID in React Native:**

```tsx
// ✅ Good: Add testID to interactive elements
<TouchableOpacity
  testID="login_button"
  accessible={true}
  accessibilityLabel="Sign In with Email"
  onPress={handleLogin}
>
  <Text>Sign In with Email</Text>
</TouchableOpacity>

// ✅ Good: Add testID to containers for screen verification
<View testID="home_screen">
  {/* Screen content */}
</View>

// ✅ Good: Add testID to form inputs
<TextInput
  testID="email_input"
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
/>
```

**In Maestro Tests:**

```yaml
# ✅ Good: Use testID for reliable targeting
- tapOn:
    id: "login_button"
- assertVisible:
    id: "home_screen"
```

### 2. Prefer Specific Over Generic

**Why:** Specific assertions catch real bugs. Generic regex patterns can match unintended elements, leading to false positives.

**Bad:**
```yaml
# ❌ Too broad - matches "home", "homeless", "homepage", etc.
- assertVisible:
    text: ".*[Hh]ome.*"
```

**Good:**
```yaml
# ✅ Specific - matches exact screen title
- assertVisible:
    id: "home_screen"
- assertVisible:
    text: "Welcome to Wayfarer"
```

### 3. Verify Navigation with Negative Assertions

**Why:** Positive assertions alone can't confirm you've actually navigated. Negative assertions prove the previous screen is gone.

**Bad:**
```yaml
# ❌ Doesn't verify navigation occurred
- tapOn:
    id: "login_button"
- assertVisible:
    id: "home_screen"
```

**Good:**
```yaml
# ✅ Verifies both navigation and previous screen is gone
- tapOn:
    id: "login_button"
- waitForAnimationToEnd
- assertVisible:
    id: "home_screen"
- assertNotVisible:
    id: "login_screen"
- assertNotVisible:
    text: "Welcome to Wayfarer"
```

### 4. Use Multiple Assertions Per Screen

**Why:** Multiple assertions verify the complete screen state, not just one element.

**Bad:**
```yaml
# ❌ Single assertion - could be false positive
- assertVisible:
    text: ".*[Qq]uest.*"
```

**Good:**
```yaml
# ✅ Multiple assertions verify complete screen state
- assertVisible:
    id: "quest_list_modal"
- assertVisible:
    id: "quest_list"
- assertVisible:
    text: "Quests"
- assertNotVisible:
    id: "home_screen"
```

---

## Element Selection Strategies

### Priority Order for Element Selection

1. **testID (Highest Priority)**
   - Most reliable
   - Doesn't break with text changes
   - Works across locales

2. **Specific Text**
   - Use exact button text or unique screen titles
   - Avoid regex when possible

3. **Regex Patterns (Last Resort)**
   - Only when text is dynamic
   - Make patterns as specific as possible
   - Use case-insensitive patterns: `.*[Ll]ogin.*`

### testID Naming Conventions

Follow consistent naming patterns:

```
{screen}_{element_type}_{purpose}

Examples:
- login_screen          (screen container)
- login_button          (button on login screen)
- email_input           (input field)
- quest_card_0          (first quest card in list)
- profile_screen         (screen container)
- xp_display            (display element)
```

### When to Use Each Strategy

**Use testID for:**
- ✅ Buttons and interactive elements
- ✅ Form inputs
- ✅ Screen containers
- ✅ List items (with index: `quest_card_0`)
- ✅ Critical UI elements

**Use Specific Text for:**
- ✅ Screen titles ("Welcome to Wayfarer")
- ✅ Button labels ("Create Account")
- ✅ Error messages
- ✅ Success confirmations

**Use Regex (sparingly) for:**
- ⚠️ Dynamic content (user names, quest titles)
- ⚠️ Optional elements that may vary
- ⚠️ When exact text is unknown

---

## Writing Reliable Assertions

### Basic Assertion Patterns

```yaml
# Assert element is visible by testID
- assertVisible:
    id: "home_screen"

# Assert text is visible
- assertVisible:
    text: "Welcome to Wayfarer"

# Assert element is NOT visible (verify navigation)
- assertNotVisible:
    id: "login_screen"

# Assert with optional flag (won't fail if not found)
- assertVisible:
    id: "optional_element"
    optional: true
```

### Timing and Animation Handling

```yaml
# Always wait for animations after navigation
- tapOn:
    id: "login_button"
- waitForAnimationToEnd
- assertVisible:
    id: "home_screen"

# Wait for specific text to appear
- waitForAnimationToEnd
- assertVisible:
    text: "Loading complete"
```

### Multiple Assertions Pattern

```yaml
# Verify complete screen state
- assertVisible:
    id: "profile_screen"
- assertVisible:
    id: "xp_display"
- assertVisible:
    text: "XP Points"
- assertNotVisible:
    id: "home_screen"
```

---

## Navigation Verification

### Complete Navigation Pattern

Every navigation should verify:
1. Target screen is visible
2. Previous screen is not visible
3. Key elements of target screen are present

```yaml
# Example: Login to Home Screen
- tapOn:
    id: "login_button"
- waitForAnimationToEnd
# Verify we're on home screen
- assertVisible:
    id: "home_screen"
- assertVisible:
    id: "map_container"
# Verify login screen is gone
- assertNotVisible:
    id: "login_screen"
- assertNotVisible:
    text: "Welcome to Wayfarer"
```

### Screen Transition Checklist

For each navigation:
- [ ] Wait for animation to complete
- [ ] Assert target screen container is visible
- [ ] Assert key element on target screen is visible
- [ ] Assert previous screen is not visible
- [ ] Assert previous screen's key text is not visible

---

## Handling Dynamic Content

### Dynamic User Data

```yaml
# ❌ Bad: Hardcoded user data
- assertVisible:
    text: "John Doe"

# ✅ Good: Use regex for dynamic content
- assertVisible:
    text: ".*XP.*"  # Matches "2456 XP" or any XP value

# ✅ Better: Use testID for display elements
- assertVisible:
    id: "xp_display"
```

### List Items with Index

```yaml
# ✅ Good: Use testID with index pattern
- tapOn:
    id: "quest_card_0"  # First quest card

# ✅ Good: Use index parameter
- tapOn:
    text: "Quest Title"
    index: 0
```

### Optional Elements

```yaml
# ✅ Good: Mark optional elements
- tapOn:
    text: ".*[Ff]ilter.*"
    optional: true
- assertVisible:
    id: "filter_modal"
    optional: true
```

---

## Common Patterns

### Form Filling Pattern

```yaml
# ✅ Good: Complete form filling with verification
- tapOn:
    id: "email_input"
- inputText: "test@example.com"
- tapOn:
    id: "password_input"
- inputText: "Password123!"
- waitForAnimationToEnd
# Verify button is ready
- assertVisible:
    id: "login_button"
- assertVisible:
    text: "Sign In with Email"
- tapOn:
    id: "login_button"
```

### Error Handling Pattern

```yaml
# ✅ Good: Verify error states
- tapOn:
    id: "login_button"
- assertVisible:
    text: ".*[Ee]rror.*|.*[Ff]ailed.*"
    optional: true
```

### Modal/Dialog Pattern

```yaml
# ✅ Good: Open and verify modal
- tapOn:
    id: "profile_button"
- assertVisible:
    id: "profile_screen"
# Close modal
- tapOn:
    id: "profile_close_button"
- assertNotVisible:
    id: "profile_screen"
- assertVisible:
    id: "home_screen"
```

---

## Anti-Patterns to Avoid

### ❌ Overly Broad Regex

```yaml
# ❌ Bad: Matches too many things
- assertVisible:
    text: ".*[0-9].*"  # Matches ANY number anywhere!

# ✅ Good: Specific pattern or testID
- assertVisible:
    id: "xp_display"
- assertVisible:
    text: ".*XP:.*[0-9]+.*"
```

### ❌ Single Assertion Per Screen

```yaml
# ❌ Bad: Only one assertion
- assertVisible:
    text: ".*[Hh]ome.*|.*[Mm]ap.*|.*[Qq]uest.*"

# ✅ Good: Multiple specific assertions
- assertVisible:
    id: "home_screen"
- assertVisible:
    id: "map_container"
- assertNotVisible:
    id: "login_screen"
```

### ❌ No Navigation Verification

```yaml
# ❌ Bad: Doesn't verify navigation worked
- tapOn:
    id: "login_button"
- assertVisible:
    id: "home_screen"

# ✅ Good: Verifies navigation
- tapOn:
    id: "login_button"
- waitForAnimationToEnd
- assertVisible:
    id: "home_screen"
- assertNotVisible:
    id: "login_screen"
```

### ❌ Using Variables That Don't Work

```yaml
# ❌ Bad: ${RANDOM} doesn't work in Maestro
- inputText: "e2e-test-${RANDOM}@wayfarer.test"

# ✅ Good: Use fixed test email or timestamp
- inputText: "e2e-test-register@wayfarer.test"
```

### ❌ No Wait for Animations

```yaml
# ❌ Bad: No wait - might fail on slow devices
- tapOn:
    id: "login_button"
- assertVisible:
    id: "home_screen"

# ✅ Good: Wait for animations
- tapOn:
    id: "login_button"
- waitForAnimationToEnd
- assertVisible:
    id: "home_screen"
```

### ❌ Coordinate-Based Tapping

```yaml
# ❌ Bad: Fragile - breaks on different screen sizes
- tapOn:
    point: "70%,50%"

# ✅ Good: Use testID or text
- tapOn:
    id: "rating_star_4"
```

---

## Troubleshooting

### Element Not Found

**Symptoms:**
```
Element not found: Id matching regex: register_button
```

**Solutions:**
1. **Verify testID exists in code:**
   ```tsx
   <TouchableOpacity testID="register_button">
   ```

2. **Add accessibility props:**
   ```tsx
   <TouchableOpacity
     testID="register_button"
     accessible={true}
     accessibilityLabel="Create Account"
   >
   ```

3. **Add wait for animations:**
   ```yaml
   - waitForAnimationToEnd
   - assertVisible:
       id: "register_button"
   ```

4. **Use text as fallback:**
   ```yaml
   - tapOn:
       id: "register_button"
       optional: true
   - tapOn:
       text: "Create Account"
       optional: true
   ```

### False Positives (Test Passes But App Is Wrong)

**Symptoms:**
- Test shows "✅ COMPLETED" but app is on wrong screen
- Test passes but functionality doesn't work

**Solutions:**
1. **Add negative assertions:**
   ```yaml
   - assertNotVisible:
       id: "login_screen"
   ```

2. **Use multiple assertions:**
   ```yaml
   - assertVisible:
       id: "home_screen"
   - assertVisible:
       id: "map_container"
   - assertNotVisible:
       id: "login_screen"
   ```

3. **Use specific text instead of regex:**
   ```yaml
   # Instead of: text: ".*[Hh]ome.*"
   - assertVisible:
       text: "Welcome to Wayfarer"
   ```

### Flaky Tests

**Symptoms:**
- Test passes sometimes, fails other times
- Timing-related failures

**Solutions:**
1. **Add explicit waits:**
   ```yaml
   - waitForAnimationToEnd
   - assertVisible:
       id: "element"
   ```

2. **Increase timeouts:**
   ```yaml
   - assertVisible:
       id: "slow_loading_element"
       timeout: 15000
   ```

3. **Use optional for conditional elements:**
   ```yaml
   - assertVisible:
       id: "optional_element"
       optional: true
   ```

---

## Examples from Wayfarer

### Authentication Test (Fixed)

**Before (Problematic):**
```yaml
- assertVisible: 
    text: ".*[Ll]ogin.*|.*[Ss]ign.*"
- tapOn: 
    text: ".*[Rr]egister.*|.*[Ss]ign.*[Uu]p.*"
- inputText: "e2e-test-${RANDOM}@wayfarer.test"
- assertVisible: 
    text: ".*[Hh]ome.*|.*[Mm]ap.*|.*[Qq]uest.*"
```

**After (Best Practices):**
```yaml
- assertVisible:
    id: "login_screen"
- assertVisible:
    text: "Welcome to Wayfarer"
- tapOn:
    id: "signup_link"
- assertVisible:
    id: "register_screen"
- assertVisible:
    text: "Join Wayfarer"
- tapOn:
    id: "email_input"
- inputText: "e2e-test-register@wayfarer.test"
- tapOn:
    id: "password_input"
- inputText: "TestPassword123!"
- waitForAnimationToEnd
- assertVisible:
    id: "register_button"
    optional: true
- assertVisible:
    text: "Create Account"
- tapOn:
    id: "register_button"
    optional: true
- tapOn:
    text: "Create Account"
    optional: true
- waitForAnimationToEnd
- assertVisible:
    id: "home_screen"
- assertNotVisible:
    text: "Welcome to Wayfarer"
- assertNotVisible:
    id: "login_screen"
```

### Progression Test (Fixed)

**Before (Problematic):**
```yaml
- assertVisible: 
    text: ".*[Pp]rofile.*|.*[Uu]ser.*"
- assertVisible: 
    text: ".*[0-9].*"  # Matches ANY number!
```

**After (Best Practices):**
```yaml
- assertVisible:
    id: "home_screen"
- assertNotVisible:
    id: "login_screen"
- tapOn:
    id: "profile_button"
- assertVisible:
    id: "profile_screen"
- assertVisible:
    id: "xp_display"
- assertVisible:
    text: ".*XP.*"
- assertNotVisible:
    id: "home_screen"
```

---

## Quick Reference Checklist

When writing a new Maestro test:

- [ ] Use `testID` for all critical elements
- [ ] Add `accessible={true}` to interactive elements in React Native
- [ ] Use specific text assertions, not broad regex
- [ ] Add negative assertions to verify navigation
- [ ] Use multiple assertions per screen
- [ ] Add `waitForAnimationToEnd` after navigation
- [ ] Verify both target screen visible AND previous screen not visible
- [ ] Use `optional: true` for truly optional elements
- [ ] Avoid `.*[0-9].*` patterns (too broad)
- [ ] Avoid coordinate-based tapping
- [ ] Don't use `${RANDOM}` (doesn't work in Maestro)
- [ ] Test on actual device/simulator to verify behavior

---

## Additional Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro React Native Support](https://docs.maestro.dev/platform-support/react-native)
- [Wayfarer E2E Testing Guide](../docs/END_TO_END_TESTING_GUIDE.md)
- [Wayfarer Testing Checklist](../docs/TESTING_CHECKLIST.md)

---

## Summary

The key to reliable Maestro tests is:

1. **testID First**: Always prefer testID over text matching
2. **Be Specific**: Use specific assertions, not broad patterns
3. **Verify Navigation**: Use negative assertions to confirm screen transitions
4. **Multiple Checks**: Verify complete screen state, not just one element
5. **Handle Timing**: Always wait for animations after navigation
6. **Test Incrementally**: Fix one test at a time and verify it works

Following these practices will result in tests that are:
- ✅ Reliable (no false positives/negatives)
- ✅ Maintainable (won't break with UI changes)
- ✅ Fast (no unnecessary waits)
- ✅ Clear (easy to understand what's being tested)

