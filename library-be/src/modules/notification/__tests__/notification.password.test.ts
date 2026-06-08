import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../service/notification.service';
import * as mailer from '../../../config/mailer';

// Mock mailer
vi.mock('../../../config/mailer', () => ({
  sendEmail: vi.fn(),
}));

describe('NotificationService - Reset Password', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationService = new NotificationService();
  });

  it('should call sendEmail with correct parameters for reset password', async () => {
    const email = 'test@example.com';
    const name = 'Test User';
    const resetUrl = 'http://localhost:5173/reset-password?token=123';

    await notificationService.sendResetPasswordEmail(email, name, resetUrl);

    expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
    
    // Parameter pertama: email
    expect(mailer.sendEmail).toHaveBeenCalledWith(
      email,
      expect.stringContaining('Reset Password'),
      expect.stringContaining(resetUrl) // HTML harus mengandung URL reset
    );
    
    // HTML harus mengandung nama user
    const htmlCallArg = (mailer.sendEmail as any).mock.calls[0][2];
    expect(htmlCallArg).toContain('Test User');
    expect(htmlCallArg).toContain('http://localhost:5173/reset-password?token=123');
  });

  it('should throw error if sendEmail fails', async () => {
    const error = new Error('Failed to send email');
    (mailer.sendEmail as any).mockRejectedValueOnce(error);

    await expect(
      notificationService.sendResetPasswordEmail('test@test.com', 'Test', 'url')
    ).rejects.toThrow('Failed to send email');
  });
});
