import twilio, { twiml } from 'twilio';
import type { Console, Logger } from '@lightshow/core';
import type { SMSController, SMSConfig } from '../SMSController';
import type Koa from 'koa';
import { URL } from 'url';

export class TwilioController implements SMSController {
  public twilioClient: twilio.Twilio;
  public readonly logger: Logger;
  public readonly console: Console;
  public readonly config: SMSConfig;

  constructor({
    console,
    logger,
    config,
  }: {
    console: Console;
    logger: Logger;
    config: SMSConfig;
  }) {
    this.console = console;
    this.config = config;
    this.logger = logger.getGroupLogger('TwilioSMS');

    if (!config.accountId) {
      this.logger.error('Twilio account configuration missing.');
      throw new Error('Cannot initialize TwilioSMS');
      return;
    } else {
      this.twilioClient = twilio(config.accountId, config.authToken, {
        lazyLoading: true,
      });
    }
  }
  getResponse(message: string) {
    const twlMessage = new twiml.MessagingResponse();
    twlMessage.message(message);
    return twlMessage.toString();
  }

  async sendMessage(message: string) {
    await this.twilioClient.messages
      .create({
        body: message,
        from: this.config.telNumber,
        to: this.config.ccNumber!,
      })
      .then((message) => this.logger.debug(`Message sent: ${message.sid}`))
      .catch((err) => this.logger.error(err));
  }

  validateRequest(request: any) {
    // Alias express method
    const requestObj = {
      header: (key: string) => request.get(key),
      body: request.body,
      originalUrl: request.originalUrl,
    };

    return twilio.validateExpressRequest(
      requestObj as any,
      this.config.authToken!,
      {
        url: this.config.webhookUrl,
      }
    );
  }

  webhookPost = (ctx: Koa.Context) => {
    const { console } = this;
    if (this.validateRequest(ctx.request)) {
      const ip =
        ctx.request.headers['x-forwarded-for'] ||
        ctx.request.socket.remoteAddress;
      this.sendMessage(`Bad request from ${ip}`);
      ctx.status = 404;
      return;
    }

    const { Body: query, From: from } = ctx.request.body;
    ctx.type = 'text/xml';
    if (/^.?song/i.test(query)) {
      const playlistMessage = console.playlist.getPlaylistTextMessage();
      ctx.body = this.getResponse(playlistMessage);
      return;
    }

    const songMatch = console.playlist.findTrack(query);
    if (!songMatch) {
      ctx.body = this.getResponse(
        'Happy Holidays!\nText "songs" to get the playlist.'
      );
      return;
    }

    const canPlay = console.playlist.canPlayTrack(songMatch);
    if (!canPlay) {
      ctx.body = this.getResponse(console.playlist.getCurrentMessage());
      return;
    }

    console.playTrack({ track: songMatch, delay: 500 });

    this.logger.debug({
      msg: `Playing ${songMatch.name}`,
      songMatch,
    });
    this.sendMessage(`${from} played ${songMatch.name}`);
    ctx.body = this.getResponse(console.playlist.getCurrentMessage());
  };

  getWebhookHandler(): ReturnType<SMSController['getWebhookHandler']> {
    return {
      method: 'POST',
      path: new URL(this.config.webhookUrl!).pathname,
      handler: this.webhookPost,
    };
  }
}
