/**
 * Права според роля и profile.permissions.
 * Ако permissions има стойности, те надвишават role.
 */
export function getPermissions(profile) {
  if (!profile) {
    return {
      canViewAllDentists: true,
      canBookAnyDentist: true,
      canEditDentists: true,
      canManageProfiles: true,
      canManageSettings: true,
      canViewAdmin: true,
      myDentistId: null,
    };
  }
  const p = profile.permissions || {};
  const role = profile.role || 'receptionist';

  const byRole = {
    admin: {
      canViewAllDentists: true,
      canBookAnyDentist: true,
      canEditDentists: true,
      canManageProfiles: true,
      canManageSettings: true,
      canViewAdmin: true,
      myDentistId: null,
    },
    receptionist: {
      canViewAllDentists: true,
      canBookAnyDentist: true,
      canEditDentists: false,
      canManageProfiles: false,
      canManageSettings: false,
      canViewAdmin: false,
      myDentistId: null,
    },
    dentist: {
      canViewAllDentists: true,
      canBookAnyDentist: false,
      canEditDentists: false,
      canManageProfiles: false,
      canManageSettings: false,
      canViewAdmin: false,
      myDentistId: profile.dentist_id || null,
    },
  };

  const base = byRole[role] || byRole.receptionist;
  return {
    ...base,
    ...(p.can_view_all !== undefined && { canViewAllDentists: !!p.can_view_all }),
    ...(p.can_book_all !== undefined && { canBookAnyDentist: !!p.can_book_all }),
    ...(p.can_edit_dentists !== undefined && { canEditDentists: !!p.can_edit_dentists }),
    ...(p.can_manage_profiles !== undefined && { canManageProfiles: !!p.can_manage_profiles }),
    ...(p.can_manage_settings !== undefined && { canManageSettings: !!p.can_manage_settings }),
    ...(p.can_view_admin !== undefined && { canViewAdmin: !!p.can_view_admin }),
  };
}
