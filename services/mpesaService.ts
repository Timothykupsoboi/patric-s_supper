export interface MpesaStkPushResponse {
  success: boolean;
  checkoutRequestId?: string;
  referenceNumber?: string;
  message: string;
}

export const mpesaService = {
  async triggerStkPush(phoneNumber: string, amount: number): Promise<MpesaStkPushResponse> {
    // Format phone number to standard 2547XXXXXXXX
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }

    if (formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
      return {
        success: false,
        message: 'Invalid Kenyan phone number format. Must be e.g. 0712345678 or 254712345678.',
      };
    }

    // Simulate STK Push prompt to phone
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const refNumber = `MP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return {
      success: true,
      checkoutRequestId: `ws_CO_${Date.now()}`,
      referenceNumber: refNumber,
      message: `STK Push prompt sent successfully to +${formattedPhone}. Waiting for customer PIN input...`,
    };
  },
};
