export interface SMSProvider {
  sendOTP(phone: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
  verifyOTP(phone: string, code: string): Promise<{ success: boolean; error?: string }>;
}

class MockSMSProvider implements SMSProvider {
  async sendOTP(phone: string) {
    console.log(`[Mock SMS] Sending OTP to ${phone}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, messageId: 'mock-12345' };
  }

  async verifyOTP(phone: string, code: string) {
    console.log(`[Mock SMS] Verifying OTP ${code} for ${phone}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // In mock mode, any 6 digit code starting with '1' works, or '123456'
    if (code === '123456') {
      return { success: true };
    }
    return { success: false, error: 'Invalid or expired OTP' };
  }
}

class TermiiSMSProvider implements SMSProvider {
  async sendOTP(phone: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // TODO: Implement actual Termii API call here
    // const response = await fetch('https://api.ng.termii.com/api/sms/otp/send', {...})
    return { success: false, error: "Termii Provider not fully implemented yet" };
  }

  async verifyOTP(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement actual Termii API call here
    // const response = await fetch('https://api.ng.termii.com/api/sms/otp/verify', {...})
    return { success: false, error: "Termii Provider not fully implemented yet" };
  }
}

// Factory to get the active SMS provider
export function getSMSProvider(): SMSProvider {
  // Use Termii in production when keys are available, otherwise Mock
  if (process.env.TERMII_API_KEY) {
    return new TermiiSMSProvider();
  }
  return new MockSMSProvider();
}
