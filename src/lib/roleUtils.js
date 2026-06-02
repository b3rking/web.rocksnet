import { ROLE_PERMISSIONS, ROLE_DEFAULT_REDIRECT } from "./roleConstants";

/**
 * Check if a user has permission to access a specific page
 * @param {number} roleId - The user's role ID
 * @param {string} pageKey - The page key (e.g., 'dashboard', 'users', 'stocks')
 * @returns {boolean} - True if user has access
 */
export const hasPageAccess = (roleId, pageKey) => {
    const permissions = ROLE_PERMISSIONS[roleId] || [];
    return permissions.includes(pageKey);
};

/**
 * Get the default redirect path for a user based on their role
 * @param {number} roleId - The user's role ID
 * @returns {string} - The default redirect path
 */
export const getDefaultRedirectPath = (roleId) => {
    return ROLE_DEFAULT_REDIRECT[roleId] || "/";
};

/**
 * Filter menu items based on user role
 * @param {array} menuItems - Array of menu items
 * @param {number} roleId - The user's role ID
 * @param {object} keyMap - Object mapping menu item urls to permission keys
 * @returns {array} - Filtered menu items
 */
export const filterMenuByRole = (menuItems, roleId, keyMap = {}) => {
    return menuItems.filter((item) => {
        // Use keyMap to find the permission key, or derive from URL
        const key = keyMap[item.url] || item.url.replace(/^\//, "");
        return hasPageAccess(roleId, key);
    });
};
