// packages/rbac/policies/engine.ts
// Zero-dependency Casbin-compatible RBAC policy evaluator
// Ponytail: Evaluates (role, resource, action) rules with wildcard '*' support in < 70 lines.
// Works natively in Node.js, Cloudflare Workers, and Edge runtimes.

import { DEFAULT_POLICY_RULES, PlatformRole, PolicyRule } from "../roles/index";

export class PolicyEngine {
  private rules: PolicyRule[];

  constructor(customRules: PolicyRule[] = []) {
    // Merge default system policies with any runtime/tenant custom rules
    this.rules = [...DEFAULT_POLICY_RULES, ...customRules];
  }

  /**
   * Evaluate whether a given role is permitted to perform an action on a resource.
   * Supports '*' wildcard matching on both resource and action.
   */
  public evaluate(role: PlatformRole, resource: string, action: string): boolean {
    for (const rule of this.rules) {
      if (rule.role !== role) {
        continue;
      }

      const resourceMatch = rule.resource === "*" || rule.resource === resource;
      if (!resourceMatch) {
        continue;
      }

      const actionMatch = rule.action === "*" || rule.action === action;
      if (actionMatch) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add a dynamic policy rule at runtime
   */
  public addRule(rule: PolicyRule): void {
    this.rules.push(rule);
  }

  /**
   * Get all permissions granted to a specific role
   */
  public getPermissionsForRole(role: PlatformRole): PolicyRule[] {
    return this.rules.filter((r) => r.role === role);
  }
}

// Singleton policy engine instance for general app use
export const policyEngine = new PolicyEngine();
