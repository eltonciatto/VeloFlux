// Utility functions and interfaces for WAFConfig component
export interface WAFRule {
  id: string;
  name: string;
  pattern: string;
  description: string;
  severity: string;
  action: 'block' | 'log' | 'allow';
}

export interface WAFConfigType {
  enabled: boolean;
  level: string;
  customRules: WAFRule[];
  blockingMode: boolean;
  logging: boolean;
}

export interface WAFConfigProps {
  tenantId?: string;
}
