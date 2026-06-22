export interface ModuleManifest {
  name: string;               // e.g., 'core', 'inventory', 'sales'
  version: string;            // e.g., '1.0.0'
  label: string;              // e.g., 'Inventory Management'
  icon: string;               // Lucide icon name, e.g., 'Package'
  dependencies: string[];     // Array of module names this depends on (e.g., ['core', 'inventory'])
  permissions: string[];      // Array of distinct permission strings defined by this module
}

export interface EnabledModuleRecord {
  orgId: string;
  moduleName: string;
  enabledAt: Date;
  enabledBy: string; // userId
}
