import { prisma } from '@/lib/db';

/**
 * Checks if a specific feature flag is enabled for an organization.
 * Looks up the org_modules table and its settings JSON.
 */
export async function isFeatureEnabled(flagKey: string, orgId: string): Promise<boolean> {
  // Try to find the module that owns this flag (SimpliERP stores feature settings in org_modules)
  const orgModule = await prisma.org_modules.findFirst({
    where: {
      org_id: orgId,
    }
  });

  if (!orgModule) {
    return false; // Default to false if not found
  }

  // Parse the settings JSON to check the flag
  // Assumes settings is an object like { features: { 'dashboard_builder': true } }
  if (orgModule.settings && typeof orgModule.settings === 'object') {
    const settings = orgModule.settings as Record<string, any>;
    if (settings.features && typeof settings.features === 'object') {
      return Boolean(settings.features[flagKey]);
    }
  }

  // If no explicit tenant flag, fallback to false for risky/new functionality
  return false;
}
