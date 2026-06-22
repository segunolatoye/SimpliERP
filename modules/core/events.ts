import { EventBus } from '@/lib/events/bus';

/**
 * Register core module event subscriptions
 */
export function registerCoreEvents() {
  // Example: Listen for new workspace creation
  EventBus.subscribe('core.workspace_created', async (payload) => {
    console.log(`[Core Module] Workspace created: ${payload.orgId} (${payload.slug})`);
    // Here you could trigger welcome emails, default settings initialization, etc.
  });

  // Example: Listen for new users joining
  EventBus.subscribe('core.user_joined', async (payload) => {
    console.log(`[Core Module] User ${payload.userId} joined workspace ${payload.orgId}`);
  });
}
