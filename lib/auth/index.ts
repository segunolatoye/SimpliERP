import { createClient } from '@/lib/supabase/server';
import { AuthError, ForbiddenError } from '@/lib/errors/appError';
import { prisma } from '@/lib/db';

/**
 * Asserts that the current request has a valid authenticated session.
 * Optionally checks if the user has a specific global role.
 * 
 * NOTE: This is the ONLY sanctioned way to check identity.
 */
export async function requireAuth(globalRole?: string) {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new AuthError('Authentication required to access this resource.');
  }

  const user = session.user;

  if (globalRole) {
    const userRole = user.user_metadata?.role || 'user';
    // is_superadmin check if they need global 'admin' override
    if (userRole !== globalRole && !user.user_metadata?.is_superadmin) {
      throw new ForbiddenError(`Global role ${globalRole} is required.`);
    }
  }

  return { session, user };
}

/**
 * Asserts that the currently authenticated user has the necessary permission
 * within the specified organization/tenant.
 * 
 * NOTE: This is the ONLY sanctioned way to check RBAC permissions.
 */
export async function requirePermission(orgIdentifier: string, permissionCode: string) {
  const { user } = await requireAuth();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdentifier);

  const orgMember = await prisma.org_members.findFirst({
    where: {
      user_id: user.id,
      ...(isUUID ? { org_id: orgIdentifier } : { organisations: { slug: orgIdentifier } })
    }
  });

  if (!orgMember) {
    throw new ForbiddenError('You are not a member of this organization.');
  }

  if (orgMember.role.toLowerCase() === 'owner') {
    return { user, orgMember };
  }

  // Permissions are aggregated centrally at login and stored in the org_members table
  // Ensure it's an array to prevent TypeError when it's an empty object {}
  const permissions = Array.isArray(orgMember.permissions) ? orgMember.permissions : [];
  
  const hasPermission = permissions.includes(permissionCode) || permissions.includes('*');

  if (!hasPermission) {
    throw new ForbiddenError(`You lack the required permission: ${permissionCode}`);
  }

  return { user, orgMember };
}
