declare module "cloudflare:workers" {
  export class DurableObject<Env = unknown> {
    protected ctx: {
      storage: {
        get(key: string): Promise<unknown>;
        put(key: string, value: unknown): Promise<void>;
        delete(key: string): Promise<boolean>;
        setAlarm(scheduledTime: number | Date): Promise<void>;
      };
    };
    protected env: Env;

    constructor(
      ctx: {
        storage: {
          get(key: string): Promise<unknown>;
          put(key: string, value: unknown): Promise<void>;
          delete(key: string): Promise<boolean>;
          setAlarm(scheduledTime: number | Date): Promise<void>;
        };
      },
      env: Env,
    );
  }
}
