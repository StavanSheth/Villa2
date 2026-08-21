// packages/database/queries/booking-state-machine.ts
// Ponytail: Finite State Machine for Booking lifecycle.
// Enforces valid transitions and which RBAC roles can trigger each action.

// ---------------------------------------------------------------------------
// Booking States
// ---------------------------------------------------------------------------

export const BOOKING_STATES = [
  "DRAFT",
  "PENDING",
  "AWAITING_PAYMENT",
  "ADVANCE_PAID",
  "FULLY_PAID",
  "CONFIRMED",
  "UPCOMING",
  "CHECKED_IN",
  "CHECKED_OUT",
  "COMPLETED",
  "REVIEWED",
  "ARCHIVED",
  "CANCELLED",
] as const;

export type BookingStatus = (typeof BOOKING_STATES)[number];

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const BOOKING_ACTIONS = [
  "CREATE",
  "SUBMIT",
  "INITIATE_PAYMENT",
  "ADVANCE_PAYMENT_RECEIVED",
  "FULL_PAYMENT_RECEIVED",
  "CONFIRM",
  "MARK_UPCOMING",
  "CHECK_IN",
  "CHECK_OUT",
  "COMPLETE",
  "SUBMIT_REVIEW",
  "ARCHIVE",
  "CANCEL",
  "EDIT_BOOKING",
  "EDIT_DATES",
  "EDIT_GUESTS",
  "ADD_SERVICE",
  "REMOVE_SERVICE",
  "ISSUE_REFUND",
  "COLLECT_REMAINING",
] as const;

export type BookingAction = (typeof BOOKING_ACTIONS)[number];

// ---------------------------------------------------------------------------
// Role Permissions per State
// ---------------------------------------------------------------------------

export type RoleName = "CUSTOMER" | "OWNER" | "ADMIN" | "STAFF" | "SUPER_ADMIN";

interface Transition {
  from: BookingStatus;
  to: BookingStatus;
  action: BookingAction;
  allowedRoles: RoleName[];
}

/**
 * The complete set of valid state transitions.
 * Every booking mutation must match one of these transitions.
 */
export const TRANSITIONS: Transition[] = [
  // --- Creation Flow ---
  { from: "DRAFT", to: "PENDING", action: "SUBMIT", allowedRoles: ["CUSTOMER"] },

  // --- Payment Flow ---
  { from: "PENDING", to: "AWAITING_PAYMENT", action: "INITIATE_PAYMENT", allowedRoles: ["CUSTOMER"] },
  { from: "AWAITING_PAYMENT", to: "ADVANCE_PAID", action: "ADVANCE_PAYMENT_RECEIVED", allowedRoles: ["CUSTOMER", "ADMIN", "OWNER"] },
  { from: "AWAITING_PAYMENT", to: "FULLY_PAID", action: "FULL_PAYMENT_RECEIVED", allowedRoles: ["CUSTOMER", "ADMIN", "OWNER"] },
  { from: "ADVANCE_PAID", to: "FULLY_PAID", action: "COLLECT_REMAINING", allowedRoles: ["OWNER", "ADMIN", "STAFF"] },

  // --- Confirmation ---
  { from: "ADVANCE_PAID", to: "CONFIRMED", action: "CONFIRM", allowedRoles: ["OWNER", "ADMIN"] },
  { from: "FULLY_PAID", to: "CONFIRMED", action: "CONFIRM", allowedRoles: ["OWNER", "ADMIN"] },

  // --- Stay Flow ---
  { from: "CONFIRMED", to: "UPCOMING", action: "MARK_UPCOMING", allowedRoles: ["ADMIN", "OWNER", "STAFF"] },
  { from: "UPCOMING", to: "CHECKED_IN", action: "CHECK_IN", allowedRoles: ["OWNER", "STAFF", "ADMIN"] },
  { from: "CHECKED_IN", to: "CHECKED_OUT", action: "CHECK_OUT", allowedRoles: ["OWNER", "STAFF", "ADMIN"] },
  { from: "CHECKED_OUT", to: "COMPLETED", action: "COMPLETE", allowedRoles: ["OWNER", "ADMIN"] },

  // --- Post-Stay ---
  { from: "COMPLETED", to: "REVIEWED", action: "SUBMIT_REVIEW", allowedRoles: ["CUSTOMER"] },
  { from: "REVIEWED", to: "ARCHIVED", action: "ARCHIVE", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
  { from: "COMPLETED", to: "ARCHIVED", action: "ARCHIVE", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },

  // --- Cancellation (from multiple states) ---
  { from: "PENDING", to: "CANCELLED", action: "CANCEL", allowedRoles: ["CUSTOMER", "OWNER", "ADMIN"] },
  { from: "AWAITING_PAYMENT", to: "CANCELLED", action: "CANCEL", allowedRoles: ["CUSTOMER", "OWNER", "ADMIN"] },
  { from: "ADVANCE_PAID", to: "CANCELLED", action: "CANCEL", allowedRoles: ["CUSTOMER", "OWNER", "ADMIN"] },
  { from: "CONFIRMED", to: "CANCELLED", action: "CANCEL", allowedRoles: ["OWNER", "ADMIN"] },
];

// ---------------------------------------------------------------------------
// Non-State-Changing Actions (allowed per state + role)
// ---------------------------------------------------------------------------

interface SideAction {
  states: BookingStatus[];
  action: BookingAction;
  allowedRoles: RoleName[];
}

export const SIDE_ACTIONS: SideAction[] = [
  { states: ["DRAFT", "PENDING"], action: "EDIT_DATES", allowedRoles: ["CUSTOMER"] },
  { states: ["ADVANCE_PAID", "CONFIRMED"], action: "EDIT_DATES", allowedRoles: ["OWNER", "ADMIN"] },
  { states: ["DRAFT", "PENDING", "ADVANCE_PAID", "CONFIRMED"], action: "EDIT_BOOKING", allowedRoles: ["CUSTOMER", "OWNER", "ADMIN"] },
  { states: ["DRAFT", "PENDING"], action: "EDIT_GUESTS", allowedRoles: ["CUSTOMER"] },
  { states: ["DRAFT", "PENDING", "ADVANCE_PAID", "CONFIRMED"], action: "ADD_SERVICE", allowedRoles: ["CUSTOMER", "OWNER", "ADMIN"] },
  { states: ["DRAFT", "PENDING", "ADVANCE_PAID", "CONFIRMED"], action: "REMOVE_SERVICE", allowedRoles: ["CUSTOMER", "OWNER", "ADMIN"] },
  { states: ["CHECKED_IN"], action: "ADD_SERVICE", allowedRoles: ["CUSTOMER", "OWNER", "STAFF"] },
  { states: ["ADVANCE_PAID", "CONFIRMED", "CANCELLED"], action: "ISSUE_REFUND", allowedRoles: ["OWNER", "ADMIN"] },
];

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

export interface TransitionResult {
  valid: boolean;
  newState?: BookingStatus;
  error?: string;
}

/**
 * Validate whether a state transition is allowed.
 */
export function validateTransition(
  currentState: string,
  action: BookingAction,
  actorRole: RoleName
): TransitionResult {
  const transition = TRANSITIONS.find(
    (t) => t.from === currentState && t.action === action
  );

  if (!transition) {
    return {
      valid: false,
      error: `Action "${action}" is not valid from state "${currentState}".`,
    };
  }

  if (!transition.allowedRoles.includes(actorRole)) {
    return {
      valid: false,
      error: `Role "${actorRole}" is not allowed to perform "${action}" on a "${currentState}" booking.`,
    };
  }

  return {
    valid: true,
    newState: transition.to,
  };
}

/**
 * Validate whether a side action (non-state-changing) is allowed.
 */
export function validateSideAction(
  currentState: string,
  action: BookingAction,
  actorRole: RoleName
): { valid: boolean; error?: string } {
  const sideAction = SIDE_ACTIONS.find(
    (sa) => sa.action === action && sa.states.includes(currentState as BookingStatus)
  );

  if (!sideAction) {
    return {
      valid: false,
      error: `Side action "${action}" is not valid in state "${currentState}".`,
    };
  }

  if (!sideAction.allowedRoles.includes(actorRole)) {
    return {
      valid: false,
      error: `Role "${actorRole}" cannot perform "${action}" on a "${currentState}" booking.`,
    };
  }

  return { valid: true };
}

/**
 * Get all allowed actions for a given state and role.
 */
export function getAllowedActions(
  currentState: string,
  actorRole: RoleName
): BookingAction[] {
  const stateTransitions = TRANSITIONS
    .filter((t) => t.from === currentState && t.allowedRoles.includes(actorRole))
    .map((t) => t.action);

  const sideActions = SIDE_ACTIONS
    .filter((sa) => sa.states.includes(currentState as BookingStatus) && sa.allowedRoles.includes(actorRole))
    .map((sa) => sa.action);

  return Array.from(new Set([...stateTransitions, ...sideActions]));
}
