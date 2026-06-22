export interface InjectionToken<T> extends Symbol {}

type Constructor<T> = new (...args: any[]) => T;

interface Provider<T> {
  useClass?: Constructor<T>;
  useValue?: T;
  useFactory?: () => T;
}

export class Container {
  private providers = new Map<string | symbol, Provider<any>>();
  private instances = new Map<string | symbol, any>();

  /**
   * Register a dependency in the container
   */
  register<T>(token: string | symbol, provider: Provider<T>) {
    this.providers.set(token, provider);
  }

  /**
   * Resolve a dependency from the container
   */
  resolve<T>(token: string | symbol): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`No provider found for token: ${String(token)}`);
    }

    let instance: any;

    if (provider.useValue !== undefined) {
      instance = provider.useValue;
    } else if (provider.useFactory) {
      instance = provider.useFactory();
    } else if (provider.useClass) {
      // Basic instantiation. For full DI, arguments would need to be resolved via metadata reflection.
      instance = new provider.useClass();
    } else {
      throw new Error(`Invalid provider configuration for token: ${String(token)}`);
    }

    // Cache the singleton instance
    this.instances.set(token, instance);
    return instance as T;
  }

  /**
   * Clear all instances (useful for testing)
   */
  clear() {
    this.instances.clear();
  }
}

// Global container singleton
export const container = new Container();
