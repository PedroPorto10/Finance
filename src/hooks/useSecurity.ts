import { useState, useEffect, useCallback } from 'react';
import { SecuritySettings, AuthResult, AppLockState } from '@/types/security';
import { SimpleStorage } from '@/lib/simpleStorage';

const SECURITY_STORAGE_KEY = 'security-settings';
const LOCK_STATE_KEY = 'app-lock-state';

const defaultSecuritySettings: SecuritySettings = {
  pinEnabled: false,
  autoLockDuration: 5, // 5 minutes
  requireAuthForExport: true,
  requireAuthForSettings: true,
  sessionTimeout: 15, // 15 minutes
};

const defaultLockState: AppLockState = {
  isLocked: false,
  lastActivity: new Date(),
  lockReason: 'timeout' as const,
};

export const useSecurity = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [lockState, setLockState] = useState<AppLockState>(defaultLockState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load settings on mount
  useEffect(() => {
    let mounted = true;

    const loadSecuritySettings = async () => {
      console.log('useSecurity: Loading security settings...');
      const settings = await SimpleStorage.getObjectAsync(SECURITY_STORAGE_KEY, defaultSecuritySettings);
      const state = await SimpleStorage.getObjectAsync(LOCK_STATE_KEY, defaultLockState);

      if (mounted) {
        // Convert lastActivity back to Date object
        if (state.lastActivity && typeof state.lastActivity === 'string') {
          state.lastActivity = new Date(state.lastActivity);
        }

        console.log('useSecurity: Loaded settings:', settings);
        console.log('useSecurity: Loaded lock state:', state);
        setSecuritySettings(settings);
        setLockState(state);
      }
    };

    loadSecuritySettings();

    return () => {
      mounted = false;
    };
  }, []);

  // Save security settings
  const saveSecuritySettings = useCallback(async (settings: SecuritySettings) => {
    console.log('useSecurity: Saving security settings:', settings);
    const success = await SimpleStorage.setObjectAsync(SECURITY_STORAGE_KEY, settings);
    if (success) {
      setSecuritySettings(settings);
    } else {
      console.error('useSecurity: Failed to save security settings');
    }
  }, []);

  // Save lock state
  const saveLockState = useCallback(async (state: AppLockState) => {
    console.log('useSecurity: Saving lock state:', state);
    const success = await SimpleStorage.setObjectAsync(LOCK_STATE_KEY, state);
    if (success) {
      setLockState(state);
    } else {
      console.error('useSecurity: Failed to save lock state');
    }
  }, []);

  // Update last activity time
  const updateActivity = useCallback(() => {
    const now = new Date();
    try {
      saveLockState({
        ...lockState,
        lastActivity: now,
        isLocked: false,
      });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [lockState, saveLockState]);

  // Authenticate with PIN (simplified implementation)
  const authenticateWithPIN = useCallback(async (pin: string): Promise<AuthResult> => {
    try {
      // In a real implementation, you'd hash and compare the PIN securely
      const storedPIN = await SimpleStorage.getObjectAsync('user-pin-hash', null);

      if (!storedPIN) {
        return { success: false, method: 'pin', error: 'PIN não configurado' };
      }

      // Simple hash comparison (in production, use proper hashing)
      const pinHash = btoa(pin); // Base64 encoding as simple hash

      if (pinHash === storedPIN) {
        setIsAuthenticated(true);
        updateActivity();
        return { success: true, method: 'pin' };
      } else {
        return { success: false, method: 'pin', error: 'PIN incorreto' };
      }
    } catch (error) {
      console.error('PIN authentication failed:', error);
      return {
        success: false,
        method: 'pin',
        error: error instanceof Error ? error.message : 'Falha na autenticação por PIN'
      };
    }
  }, [updateActivity]);

  // Set up PIN
  const setupPIN = useCallback(async (pin: string): Promise<boolean> => {
    try {
      // Simple hash (in production, use proper hashing with salt)
      const pinHash = btoa(pin);
      const success = await SimpleStorage.setObjectAsync('user-pin-hash', pinHash);

      if (success) {
        await saveSecuritySettings({ ...securitySettings, pinEnabled: true });
        return true;
      } else {
        console.error('PIN setup failed: Could not save PIN hash');
        return false;
      }
    } catch (error) {
      console.error('PIN setup failed:', error);
      return false;
    }
  }, [securitySettings, saveSecuritySettings]);


  // Lock the app
  const lockApp = useCallback((reason: AppLockState['lockReason'] = 'manual') => {
    try {
      saveLockState({
        ...lockState,
        isLocked: true,
        lockReason: reason,
      });
    } catch (error) {
      console.error('Error locking app:', error);
    }
    setIsAuthenticated(false);
  }, [lockState, saveLockState]);

  // Unlock the app
  const unlockApp = useCallback(() => {
    setIsAuthenticated(true);
    updateActivity();
  }, [updateActivity]);

  // Check if app should be locked due to inactivity
  const checkForAutoLock = useCallback(() => {
    if (!isAuthenticated || lockState.isLocked) return;

    const now = new Date();
    const timeDiff = now.getTime() - lockState.lastActivity.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff >= securitySettings.autoLockDuration) {
      lockApp('timeout');
    }
  }, [isAuthenticated, lockState, securitySettings.autoLockDuration, lockApp]);

  // Require authentication for sensitive actions
  const requireAuth = useCallback((action: 'export' | 'settings'): boolean => {
    const requiresAuth = action === 'export'
      ? securitySettings.requireAuthForExport
      : securitySettings.requireAuthForSettings;

    if (!requiresAuth) return true;

    if (isAuthenticated) {
      // Check if session is still valid
      const now = new Date();
      const sessionDiff = (now.getTime() - lockState.lastActivity.getTime()) / (1000 * 60);

      if (sessionDiff < securitySettings.sessionTimeout) {
        updateActivity();
        return true;
      }
    }

    // For now, return true as we don't have authentication methods implemented
    // In a real implementation, you would show a PIN dialog
    return true;
  }, [
    securitySettings,
    isAuthenticated,
    lockState.lastActivity,
    updateActivity,
  ]);

  // Auto-check for lock every minute
  useEffect(() => {
    const interval = setInterval(checkForAutoLock, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkForAutoLock]);

  // Update activity on user interaction
  useEffect(() => {
    const handleUserActivity = () => {
      if (isAuthenticated) {
        updateActivity();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [isAuthenticated, updateActivity]);

  return {
    securitySettings,
    lockState,
    isAuthenticated,
    authenticateWithPIN,
    setupPIN,
    updateActivity,
    lockApp,
    unlockApp,
    requireAuth,
    saveSecuritySettings,
  };
};