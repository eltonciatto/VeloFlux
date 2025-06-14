// Utility functions and interfaces for WAFConfig component
export interface WAFConfigType {
  enabled: boolean;
  level: string;
  customRules: any[];
  blockingMode: boolean;
  logging: boolean;
}

export interface WAFConfigProps {
  tenantId?: string;
}
