import AfricasTalking from 'africastalking';

let sms = null;

// Only initialize if the API key exists
if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
  const at = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
  });
  sms = at.SMS;
} else {
  console.warn('[SMS] AT_API_KEY or AT_USERNAME is missing. SMS notifications are disabled.');
}

export const sendRegistrationSMS = async (phone, name, referenceNumber) => {
  if (!sms) return; // Skip silently if not configured

  // Format phone to +254...
  let formattedPhone = phone;
  if (phone.startsWith('0')) {
    formattedPhone = '+254' + phone.slice(1);
  }

  const message = `Hello ${name}, your voter registration is successful. Your reference number is ${referenceNumber}. VRS Kenya.`;

  try {
    const result = await sms.send({
      to: [formattedPhone],
      message: message
    });
    console.log('[SMS Sent]', result);
    return result;
  } catch (error) {
    console.error('[SMS Error]', error);
  }
};