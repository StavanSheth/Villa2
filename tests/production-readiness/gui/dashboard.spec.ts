import { test, expect } from '@playwright/test';

test.describe('GUI-001: Owner Dashboard Navigation', () => {
  test('should render dashboard and contain critical navigation links', async ({ page }) => {
    // Navigate to the Owner Dashboard
    await page.goto('http://localhost:3004/');
    
    // Verify Page Title
    await expect(page).toHaveTitle(/Owner Dashboard - Mavon/i);
    
    // Verify critical navigation elements via stable test IDs
    const villasLink = page.getByTestId('sidebar-nav-properties');
    await expect(villasLink).toBeVisible();

    const bookingsLink = page.getByTestId('sidebar-nav-bookings');
    await expect(bookingsLink).toBeVisible();
    
    // Check for global search input and interact
    const searchInput = page.getByTestId('global-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Chunawala');
    
    // Check for newly added action buttons and simulate clicks
    const createBookingBtn = page.getByTestId('btn-create-booking');
    await expect(createBookingBtn).toBeVisible();
    await createBookingBtn.click(); // Validate button is intractable
    
    const viewReportsBtn = page.getByTestId('btn-view-reports');
    await expect(viewReportsBtn).toBeVisible();
    await viewReportsBtn.click(); // Validate button is intractable
    
    // Check for property card container
    const propertyCard = page.getByTestId('property-card').first();
    await expect(propertyCard).toBeVisible();
    await expect(propertyCard).toContainText('Seven C Villa');
  });
});
