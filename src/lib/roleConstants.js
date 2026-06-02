// Role IDs
export const ROLES = {
    ADMIN: 1,
    SUPER_AGENT: 2,
    AGENT: 3,
};

// Role names for reference
export const ROLE_NAMES = {
    [ROLES.ADMIN]: "Admin",
    [ROLES.SUPER_AGENT]: "Super Agent",
    [ROLES.AGENT]: "Agent",
};

// Menu items accessible by each role
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        "dashboard",
        "users",
        "profils",
        "stocks",
        "history",
        "subscriptions",
        "clients",
        "payments",
    ],
    [ROLES.SUPER_AGENT]: ["clients", "payments", "subscriptions"],
    [ROLES.AGENT]: ["stocks", "history"],
};

// Default redirect path for each role when accessing restricted areas
export const ROLE_DEFAULT_REDIRECT = {
    [ROLES.ADMIN]: "/",
    [ROLES.SUPER_AGENT]: "/clients",
    [ROLES.AGENT]: "/stocks",
};
