export interface SecuritySettings {
  pinEnabled: boolean;
  autoLockDuration: number; // minutes
  requireAuthForExport: boolean;
  requireAuthForSettings: boolean;
  sessionTimeout: number; // minutes
}

export interface AuthResult {
  success: boolean;
  method: 'pin' | 'none';
  error?: string;
}

export interface AppLockState {
  isLocked: boolean;
  lastActivity: Date;
  lockReason: 'timeout' | 'manual' | 'background';
}