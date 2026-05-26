export const makeQrDetailUrl = (asset: {
  id?: number | null;
  assetTag?: string;
  serial?: string | null;
  specs?: string | null;
}, employee?: {
  userId?: string | null;
  name?: string | null;
  department?: string | null;
}): string => {
  const parts = [];

  // Asset information
  if (asset.serial) parts.push(`Serial: ${asset.serial}`);
  if (asset.specs) {
    const flatSpecs = asset.specs.replace(/\n/g, ' | ');
    parts.push(`Specs: ${flatSpecs}`);
  }
  console.log('employee: ', employee);
  // Employee information
  if (employee?.userId) parts.push(`User ID: ${employee?.userId}`);
  if (employee?.name) parts.push(`Name: ${employee?.name}`);
  if (employee?.department) parts.push(`Department: ${employee?.department}`);

  return parts.join('\n---\n');
};