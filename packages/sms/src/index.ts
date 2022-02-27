import { SMSConfig } from './SMSController';
import { TwilioController } from './twilio';
import type { Console, Logger } from '@lightshow/core';

export * from './SMSController';

export default function SMSCOntrollerInit({
  config,
  console,
  logger,
}: {
  config: SMSConfig;
  console: Console;
  logger: Logger;
}) {
  if (config.provider === 'twilio') {
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_NUMBER,
      TWILIO_WEBHOOK_URL,
      CC_NUMBER,
    } = process.env;

    const twilioConfig: SMSConfig = {
      accountId: TWILIO_ACCOUNT_SID,
      authToken: TWILIO_AUTH_TOKEN,
      telNumber: TWILIO_NUMBER,
      webhookUrl: TWILIO_WEBHOOK_URL,
      ccNumber: CC_NUMBER,
      ...config,
    };

    return new TwilioController({ config: twilioConfig, console, logger });
  }
}
