import type { Console, Logger } from '@lightshow/core';
import type Koa from 'koa';

export interface SMSConfig {
  provider: 'twilio' | 'custom' | 'none';
  accountId?: string;
  authToken?: string;
  telNumber?: string;
  webhookUrl?: string;
  ccNumber?: string;
  raw?: any;
}

export interface SMSController {
  readonly logger: Logger;
  readonly console: Console;
  readonly config: SMSConfig;

  constructor: Function;

  getWebhookHandler(): {
    method: 'GET' | 'POST';
    path: string;
    handler: Koa.Middleware;
  };
}
