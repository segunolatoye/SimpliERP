import { prisma } from '@/lib/db';
import { MODULE_REGISTRY } from './registry';

/**
 * Checks if a specific module is enabled for a given organization.
 * 
 * @param orgId - The ID of the organization
 * @param moduleName - The name of the module (e.g., 'inventory')
 * @returns boolean indicating if the module is enabled
 */
export async function isModuleEnabled(orgId: string, moduleName: string): Promise<boolean> {
  // 'core' module is always enabled by default
  if (moduleName === 'core') return true;

  if (!MODULE_REGISTRY[moduleName]) {
    return false;
  }

  const moduleRecord = await prisma.org_modules.findUnique({
    where: {
      org_id_module_name: {
        org_id: orgId,
        module_name: moduleName
      }
    }
  });

  return moduleRecord?.enabled ?? false;
}

/**
 * Retrieves a list of all enabled modules for a given organization.
 * 
 * @param orgId - The ID of the organization
 * @returns Array of enabled module names
 */
export async function getEnabledModules(orgId: string): Promise<string[]> {
  const enabledRecords = await prisma.org_modules.findMany({
    where: {
      org_id: orgId,
      enabled: true
    },
    select: {
      module_name: true
    }
  });

  const modules = enabledRecords.map(r => r.module_name);
  
  // Ensure 'core' is always included
  if (!modules.includes('core')) {
    modules.unshift('core');
  }

  return modules;
}
