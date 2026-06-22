import { ModuleManifest } from './types';

// We manually import manifests to ensure they are bundled correctly by Webpack/Turbopack
import coreManifest from '@/modules/core/manifest';
// import inventoryManifest from '@/modules/inventory/manifest';

export const MODULE_REGISTRY: Record<string, ModuleManifest> = {
  core: coreManifest,
  // inventory: inventoryManifest,
};

/**
 * Validates if a list of requested module names satisfies all dependencies.
 * If module A depends on module B, module B must be present.
 */
export function validateDependencies(enabledModules: string[]): { valid: boolean; missingDependencies: string[] } {
  const enabledSet = new Set(enabledModules);
  const missing = new Set<string>();

  for (const moduleName of enabledModules) {
    const manifest = MODULE_REGISTRY[moduleName];
    if (!manifest) {
      console.warn(`[Module Registry] Module '${moduleName}' is enabled but not found in the codebase.`);
      continue;
    }

    for (const dep of manifest.dependencies) {
      if (!enabledSet.has(dep)) {
        missing.add(`'${moduleName}' requires '${dep}'`);
      }
    }
  }

  return {
    valid: missing.size === 0,
    missingDependencies: Array.from(missing)
  };
}
