interface VapiCallRequest {
  assistantId: string;
  phoneNumber: {
    twilioPhoneNumber: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
  };
  customer: {
    number: string;
  };
  assistantOverrides: {
    variableValues: {
      customerName: string;
      productName: string;
    };
  };
}

interface VapiCallResponse {
  success: boolean;
  callId?: string;
  error?: string;
}

export class VapiService {
  private apiKey: string;
  private baseUrl = 'https://api.vapi.ai';

  constructor() {
    this.apiKey = process.env.VAPI_API_KEY!;
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY is required');
    }
  }

  async makeCall(
    customerPhone: string,
    customerName: string = 'Customer',
    productName: string = 'Product'
  ): Promise<VapiCallResponse> {
    try {
      const callRequest: VapiCallRequest = {
        assistantId: process.env.VAPI_ASSISTANT_ID!,
        phoneNumber: {
          twilioPhoneNumber: process.env.VAPI_TWILIO_PHONE_NUMBER!,
          twilioAccountSid: process.env.VAPI_TWILIO_ACCOUNT_SID!,
          twilioAuthToken: process.env.VAPI_TWILIO_AUTH_TOKEN!,
        },
        customer: {
          number: customerPhone,
        },
        assistantOverrides: {
          variableValues: {
            customerName,
            productName,
          },
        },
      };

      const response = await fetch(`${this.baseUrl}/call/phone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to make call',
        };
      }

      return {
        success: true,
        callId: data.id,
      };
    } catch (error) {
      console.error('VAPI call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const vapiService = new VapiService();