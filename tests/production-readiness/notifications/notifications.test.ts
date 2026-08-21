import { describe, it, expect, beforeEach } from 'vitest';

// --- Notifications Simulator ---
class NotificationService {
  private emailProviderOutage = false;
  private emailHardBounce = false;
  
  public databaseState = {
    bookingCommitted: false,
    queuedEmailEvent: false
  };

  public smsDispatchLog: string[] = [];

  public simulateEmailOutage(outage: boolean) {
    this.emailProviderOutage = outage;
  }

  public simulateHardBounce(bounce: boolean) {
    this.emailHardBounce = bounce;
  }

  async createBookingWithNotification(userId: string) {
    try {
      // 1. Transaction Starts: Save Booking
      this.databaseState.bookingCommitted = true;
      
      // 2. Dispatch Notification (Synchronously awaited for test simplicity)
      await this.dispatchEmailNotification(userId);
      
    } catch (error: any) {
      // The architecture MUST catch notification errors to prevent rolling back the booking
      // It should enqueue the notification for a background retry
      if (error.message === '500 SES Internal Server Error') {
        this.databaseState.queuedEmailEvent = true;
      } else if (error.message === '400 SES Hard Bounce') {
        // SMS Fallback
        await this.dispatchSMSFallback(userId);
      } else {
        // Unknown fatal error, bubble up
        throw error;
      }
    }
  }

  private async dispatchEmailNotification(userId: string) {
    if (this.emailProviderOutage) {
      throw new Error('500 SES Internal Server Error');
    }
    if (this.emailHardBounce) {
      throw new Error('400 SES Hard Bounce');
    }
    // Success
    return true;
  }

  private async dispatchSMSFallback(userId: string) {
    this.smsDispatchLog.push(`Sent SMS to ${userId}`);
    return true;
  }
}

describe('Category 9: Notifications & Fallback Resilience', () => {
  let notifier: NotificationService;

  beforeEach(() => {
    notifier = new NotificationService();
  });

  it('Scenario 9A: Graceful Degradation - Booking succeeds even if email provider throws 500', async () => {
    // Simulate AWS SES Outage
    notifier.simulateEmailOutage(true);
    
    // Perform Booking
    await notifier.createBookingWithNotification('user_123');

    // Assert the core business logic (Booking) STILL succeeded
    expect(notifier.databaseState.bookingCommitted).toBe(true);

    // Assert that the system gracefully trapped the error and queued it for background retry
    expect(notifier.databaseState.queuedEmailEvent).toBe(true);
  });

  it('Scenario 9B: SMS Fallback - Attempt SMS dispatch if email hard-bounces', async () => {
    // Simulate invalid email / bounced domain
    notifier.simulateHardBounce(true);
    
    // Perform Booking
    await notifier.createBookingWithNotification('user_456');

    // Assert the booking succeeded
    expect(notifier.databaseState.bookingCommitted).toBe(true);

    // Assert that the system correctly fell back to Twilio/SMS dispatch
    expect(notifier.smsDispatchLog.length).toBe(1);
    expect(notifier.smsDispatchLog[0]).toBe('Sent SMS to user_456');
  });
});
