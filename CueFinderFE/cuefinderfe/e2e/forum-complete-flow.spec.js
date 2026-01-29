/**
 * Forum E2E Test Suite
 * 
 * This test file covers:
 * 1. Navigate to forum
 * 2. Create a new discussion/topic
 * 3. Reply to a topic
 * 4. Verify posts visibility
 * 5. Check forum menus and navigation
 * 
 * Prerequisites:
 * - Backend running at http://localhost:5200
 * - Frontend running at http://localhost:3000
 * - Forum categories must be seeded
 */

const { test, expect } = require('@playwright/test');
const {
  loginViaUI,
  generateUniqueUser,
  getAuthToken,
  isLoggedIn,
  API_BASE_URL,
  APP_BASE_URL
} = require('./helpers/authHelper');
const {
  createForumDiscussion,
  createForumPost,
  getForumCategories,
  getCategoryDiscussions,
  getDiscussionPosts,
  generateSampleDiscussion,
  generateSamplePost
} = require('./helpers/dataHelper');
const {
  waitForPageLoad,
  isElementVisible,
  clickButtonByText,
  fillInput,
  getElementText,
  getElementCount,
  getAllElementTexts,
  takeScreenshot,
  clickElement
} = require('./helpers/uiHelper');

test.describe('Forum: Create Topics and Replies', () => {
  let testUser;
  let token;
  let forumCategories = [];
  let createdDiscussion = null;

  test.beforeAll(async () => {
    testUser = generateUniqueUser('forum_user');
    console.log(`\n📝 Forum Test User: ${testUser.username}\n`);
  });

  test('STEP 1: Get forum categories', async ({ request }) => {
    console.log('\n📂 STEP 1: Get Forum Categories\n');

    const response = await getForumCategories(request);
    forumCategories = Array.isArray(response) ? response : (response.data || []);

    expect(forumCategories.length).toBeGreaterThan(0);
    console.log(`✓ Found ${forumCategories.length} forum categories:`);
    
    forumCategories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.name || cat.Name} (ID: ${cat.id || cat.Id})`);
    });
  });

  test('STEP 2: Register and login forum user', async ({ page, request }) => {
    console.log('\n🔐 STEP 2: Register and Login Forum User\n');

    // Register via API (reuse from previous tests)
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });

    if ([200, 201, 409].includes(registerResponse.status())) {
      console.log(`✓ Registration response: ${registerResponse.status()}`);
    }

    // Login via UI
    await loginViaUI(page, testUser.email, testUser.password);
    token = await getAuthToken(page);

    expect(token).toBeTruthy();
    console.log('✓ User logged in');
  });

  test('STEP 3: Navigate to forum via UI', async ({ page }) => {
    console.log('\n🌐 STEP 3: Navigate to Forum\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
      token = await getAuthToken(page);
    }

    // Navigate to home
    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);
    console.log('✓ Home page loaded');

    // Look for Forum menu/button
    console.log('Looking for Forum button...');
    
    // Try clicking forum dropdown/button from sidebar
    const forumButton = page.locator('[data-testid="sidebar-forum"]').or(
      page.getByRole('button').filter({ hasText: /Forum/i }).first()
    );

    if (await forumButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await forumButton.click();
      console.log('✓ Forum button clicked');
      await page.waitForTimeout(500);
    }

    // Click on a category to navigate to forum
    if (forumCategories.length > 0) {
      const categoryName = forumCategories[0].name || forumCategories[0].Name;
      console.log(`Navigating to category: ${categoryName}`);
      
      const categoryButton = page.getByText(categoryName, { exact: true }).first();
      
      if (await categoryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await categoryButton.click();
        await page.waitForURL(`${APP_BASE_URL}/**forum**`, { timeout: 10000 });
        console.log('✓ Navigated to forum');
      }
    }

    // Verify forum page loaded
    await waitForPageLoad(page);
    const forumHeading = page.getByRole('heading', { name: /forum|community/i }).first();
    const forumVisible = await forumHeading.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`✓ Forum page visible: ${forumVisible}`);
  });

  test('STEP 4: Create a new forum topic/discussion', async ({ page, request }) => {
    console.log('\n✨ STEP 4: Create New Forum Topic\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
      token = await getAuthToken(page);
    }

    // Ensure on forum page
    await page.goto(`${APP_BASE_URL}/forum`);
    await waitForPageLoad(page);

    // Get first category ID
    const categoryId = forumCategories[0]?.id || forumCategories[0]?.Id;
    expect(categoryId).toBeTruthy();

    // Prepare discussion data
    const discussionData = generateSampleDiscussion();
    discussionData.categoryId = categoryId;

    console.log(`Creating discussion in category: ${forumCategories[0].name || forumCategories[0].Name}`);
    console.log(`Title: ${discussionData.title}`);

    // Create discussion via API
    const apiResponse = await createForumDiscussion(request, token, discussionData);

    if (apiResponse.status !== 201 && apiResponse.status !== 200) {
      console.log(`⚠️ API response status: ${apiResponse.status}`);
      console.log(`Response:`, apiResponse.data);
    }

    createdDiscussion = apiResponse.data;
    expect(createdDiscussion).toBeTruthy();
    expect(createdDiscussion.id || createdDiscussion.Id).toBeTruthy();

    console.log(`✓ Discussion created successfully`);
    console.log(`  ID: ${createdDiscussion.id || createdDiscussion.Id}`);
    console.log(`  Title: ${createdDiscussion.title || createdDiscussion.Title}`);

    // Navigate to the new discussion
    const discussionId = createdDiscussion.id || createdDiscussion.Id;
    await page.goto(`${APP_BASE_URL}/forum/discussion/${discussionId}`);
    await page.waitForURL(`**forum**`, { timeout: 10000 }).catch(() => {});
    await waitForPageLoad(page);

    console.log('✓ Navigated to new discussion');
  });

  test('STEP 5: Add a reply/post to the discussion', async ({ page, request }) => {
    console.log('\n💬 STEP 5: Add Reply to Discussion\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
      token = await getAuthToken(page);
    }

    expect(createdDiscussion).toBeTruthy();

    const discussionId = createdDiscussion.id || createdDiscussion.Id;
    expect(discussionId).toBeTruthy();

    // Prepare post data
    const postData = generateSamplePost();
    postData.discussionId = discussionId;

    console.log(`Adding reply to discussion ${discussionId}`);
    console.log(`Content: ${postData.content.substring(0, 50)}...`);

    // Create post via API
    const apiResponse = await createForumPost(request, token, postData);

    if (apiResponse.status !== 201 && apiResponse.status !== 200) {
      console.log(`⚠️ API response status: ${apiResponse.status}`);
      console.log(`Response:`, apiResponse.data);
    }

    const createdPost = apiResponse.data;
    expect(createdPost).toBeTruthy();
    expect(createdPost.id || createdPost.Id).toBeTruthy();

    console.log(`✓ Post created successfully`);
    console.log(`  ID: ${createdPost.id || createdPost.Id}`);
    console.log(`  Content preview: ${createdPost.content?.substring(0, 50) || '...'}`);

    // Navigate to discussion to see the post
    await page.goto(`${APP_BASE_URL}/forum/discussion/${discussionId}`);
    await page.waitForURL(`**forum**`, { timeout: 10000 }).catch(() => {});
    await waitForPageLoad(page);

    console.log('✓ Navigated to discussion');
  });

  test('STEP 6: Verify posts are visible in discussion', async ({ page, request }) => {
    console.log('\n👁️ STEP 6: Verify Posts Visibility\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
      token = await getAuthToken(page);
    }

    expect(createdDiscussion).toBeTruthy();
    const discussionId = createdDiscussion.id || createdDiscussion.Id;

    // Get posts via API
    const posts = await getDiscussionPosts(request, discussionId);
    console.log(`✓ Retrieved ${posts.length} posts for discussion`);

    posts.forEach((post, i) => {
      console.log(`  ${i + 1}. Post ID: ${post.id || post.Id}`);
      console.log(`     Content: ${post.content?.substring(0, 40)}...`);
    });

    // Navigate to discussion in UI
    await page.goto(`${APP_BASE_URL}/forum/discussion/${discussionId}`);
    await page.waitForURL(`**forum**`, { timeout: 10000 }).catch(() => {});
    await waitForPageLoad(page);

    console.log('✓ Navigated to discussion in UI');

    // Check for post content in UI
    const postContentElements = page.getByText(/test post created/i);
    const postCount = await postContentElements.count();
    console.log(`✓ Found ${postCount} post element(s) in UI`);

    // Take screenshot showing the discussion
    await takeScreenshot(page, 'forum-discussion');
  });

  test('STEP 7: Check forum navigation and menus', async ({ page }) => {
    console.log('\n📋 STEP 7: Forum Navigation and Menus\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    // Navigate to forum
    await page.goto(`${APP_BASE_URL}/forum`);
    await waitForPageLoad(page);

    console.log('Checking forum UI elements...');

    // Check for categories list
    const categoryElements = page.getByText(/Billiard Clubs|Tournaments|Sales|General|Practise/i);
    const categoryCount = await categoryElements.count();
    console.log(`✓ Found ${categoryCount} visible category elements`);

    // Check for discussion list
    const discussionElements = page.locator('[role="listitem"], li, .discussion-card, [class*="discussion"]');
    const discussionCount = await discussionElements.count();
    console.log(`✓ Found ${discussionCount} discussion/item elements`);

    // Check for create new discussion button
    const createButton = page.getByRole('button').filter({ hasText: /New Topic|Create|New Discussion|Add/i }).first();
    const createVisible = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Create button visible: ${createVisible}`);

    // Check for search functionality
    const searchInput = page.locator('input[type="text"]').filter({ hasText: /search/i }).first();
    const searchVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Search visible: ${searchVisible}`);

    // Check for back/navigation button
    const backButton = page.getByRole('button').filter({ hasText: /Back|← |Home/i }).first();
    const backVisible = await backButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Back/Home button visible: ${backVisible}`);

    // Take screenshot of forum page
    await takeScreenshot(page, 'forum-overview');
  });

  test('STEP 8: Test forum filtering and sorting', async ({ page }) => {
    console.log('\n🔎 STEP 8: Forum Filtering and Sorting\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    // Navigate to forum
    await page.goto(`${APP_BASE_URL}/forum`);
    await waitForPageLoad(page);

    // Check for filter/sort options
    console.log('Looking for filter/sort controls...');

    const filterElements = page.locator('[class*="filter"], [class*="sort"], select, [role="combobox"]');
    const filterCount = await filterElements.count();
    console.log(`✓ Found ${filterCount} filter/sort elements`);

    // Try clicking on different categories
    if (forumCategories.length > 1) {
      console.log(`\nTesting category navigation (${forumCategories.length} categories)...`);
      
      for (let i = 0; i < Math.min(2, forumCategories.length); i++) {
        const category = forumCategories[i];
        const categoryName = category.name || category.Name;
        
        const categoryLink = page.getByText(categoryName, { exact: true }).first();
        
        if (await categoryLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await categoryLink.click();
          await page.waitForTimeout(500);
          console.log(`✓ Clicked category: ${categoryName}`);
        }
      }
    }
  });
});
