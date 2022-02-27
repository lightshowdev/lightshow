export type LogLevel = 'debug' | 'info' | 'error' | '*';
export type LogPayload =
  | string
  | Error
  | Record<string, any>
  | { [key: string]: any };

export class Logger {
  public levels: LogLevel[];

  constructor({ level }: { level: LogLevel | LogLevel[] }) {
    if (level === '*') {
      level = ['debug', 'info', 'error'];
    }
    this.levels = Array.isArray(level) ? level : [level];
  }

  log({
    level,
    payload,
    group,
  }: {
    level: LogLevel;
    payload: LogPayload;
    group?: string;
  }) {
    if (!this.levels.includes(level)) {
      return;
    }

    let logPayload = payload;
    if (group) {
      logPayload = { group, payload };
    }

    if (level === 'error') {
      console.error(logPayload);
      return;
    }

    if (level === 'info') {
      console.info(logPayload);
      return;
    }

    console.log(logPayload);
  }

  debug(payload: LogPayload) {
    this.log({ level: 'debug', payload });
  }

  info(payload: LogPayload) {
    this.log({ level: 'info', payload });
  }

  error(payload: LogPayload) {
    this.log({ level: 'error', payload });
  }

  getGroupLogger(group: string) {
    const proxyProps = ['debug', 'error', 'info'];
    const groupHandler = {
      get: function (target: Logger, prop: LogLevel, args: any) {
        if (!proxyProps.includes(prop)) {
          return Reflect.get(target, prop, args);
        }

        return (payload: LogPayload) => {
          target.log({ level: prop, payload, group });
        };
      },
    };

    return new Proxy(this, groupHandler);
  }
}
