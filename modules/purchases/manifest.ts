export const manifest = {
  name: 'purchases',
  version: '1.0.0',
  label: 'Purchasing',
  icon: 'shopping-cart',
  dependencies: ['inventory'],
  permissions: [
    { action: 'purchases.view', description: 'View purchase orders and vendors' },
    { action: 'purchases.manage', description: 'Create and edit purchase orders' },
    { action: 'purchases.approve', description: 'Approve purchase orders' }
  ]
};
