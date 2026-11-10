import type { AgentRole } from '../types/firestore';

/**
 * What each staff level can do (the Firestore rules enforce the same limits on the server):
 * - admin: everything, including the platform settings and deleting.
 * - manager: everything except changes to the platform: menu, prices, on/off items, operators, drivers, orders.
 * - operator: works the orders (assign a driver, modify, suspend / reactivate); never deletes an order.
 */
export const isAdmin = (role?: AgentRole) => role === 'admin';
export const isManagerUp = (role?: AgentRole) => role === 'admin' || role === 'manager';

export const can = {
  /** Ajustes (business data, logo, photos). */
  editPlatform: isAdmin,
  /** Add / edit products, change prices, switch products on and off, categories. */
  manageMenu: isManagerUp,
  /** Add operators and delivery drivers. */
  manageStaff: isManagerUp,
  manageDrivers: isManagerUp,
  /** Delete an order: never an operator. */
  deleteOrders: isManagerUp,
};

/** Dashboard routes and the lowest level that may open them. Anything not listed is open to all staff. */
export const routeAccess: { prefix: string; allowed: (role?: AgentRole) => boolean }[] = [
  { prefix: '/dashboard/settings', allowed: can.editPlatform },
  { prefix: '/dashboard/properties', allowed: can.manageMenu },
  { prefix: '/dashboard/categories', allowed: can.manageMenu },
  { prefix: '/dashboard/staff', allowed: can.manageStaff },
];

export const canOpen = (pathname: string, role?: AgentRole) =>
  routeAccess.every((r) => !(pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)) || r.allowed(role));
