import { ModuleManifest } from '@/lib/modules/types';
import { CORE_PERMISSIONS } from './permissions';

const coreManifest: ModuleManifest = {
  name: 'core',
  version: '1.0.0',
  label: 'Core System',
  icon: 'Settings', // Lucide icon name
  dependencies: [], // Core depends on nothing
  permissions: Object.values(CORE_PERMISSIONS),
};

export default coreManifest;
