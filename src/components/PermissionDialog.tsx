import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, Check, AlertCircle } from 'lucide-react';
import { HybridBankNotifications } from '../lib/hybridBankNotifications';

interface PermissionDialogProps {
  onComplete?: () => void;
}

export const PermissionDialog = ({ onComplete }: PermissionDialogProps) => {
  const [step, setStep] = useState<'initial' | 'notification' | 'accessibility' | 'complete'>('initial');
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);
  const [checking, setChecking] = useState(false);

  console.log('PermissionDialog rendered with step:', step, 'checking:', checking);

  useEffect(() => {
    // Check current permissions on mount
    checkPermissions();
  }, [checkPermissions]);

  const checkPermissions = useCallback(async () => {
    try {
      const status = await HybridBankNotifications.isEnabled();
      setNotificationGranted(status.notificationEnabled);
      setAccessibilityGranted(status.accessibilityEnabled);
      
      if (status.enabled) {
        setStep('complete');
        onComplete?.();
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  }, [onComplete]);

  const requestNotificationPermission = async () => {
    alert('🔧 DEBUG: Configurar Agora button clicked!');
    setStep('notification');
    setChecking(true);
    
    try {
      alert('🔧 DEBUG: Calling HybridBankNotifications.requestNotificationPermission()');
      await HybridBankNotifications.requestNotificationPermission();
      alert('🔧 DEBUG: Native dialog should appear now!');
      
      // Start checking permissions periodically while user is in settings
      const checkInterval = setInterval(async () => {
        const status = await HybridBankNotifications.isEnabled();
        setNotificationGranted(status.notificationEnabled);
        setAccessibilityGranted(status.accessibilityEnabled);
        
        if (status.notificationEnabled || status.accessibilityEnabled) {
          clearInterval(checkInterval);
          alert('🎉 DEBUG: Permission granted! Setup complete!');
          setStep('complete');
          onComplete?.();
        }
      }, 2000);
      
      // Stop checking after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        setChecking(false);
        alert('⏰ DEBUG: Stopped checking after 30 seconds');
      }, 30000);
    } catch (error) {
      alert('❌ DEBUG: Error - ' + error);
      setChecking(false);
    }
  };

  const requestAccessibilityPermission = async () => {
    setStep('accessibility');
    try {
      await HybridBankNotifications.requestAccessibilityPermission();
      // Start checking permissions periodically while user is in settings
      const checkInterval = setInterval(async () => {
        const status = await HybridBankNotifications.isEnabled();
        setNotificationGranted(status.notificationEnabled);
        setAccessibilityGranted(status.accessibilityEnabled);
        
        if (status.accessibilityEnabled || status.notificationEnabled) {
          clearInterval(checkInterval);
          setStep('complete');
          onComplete?.();
        }
      }, 2000);
      
      // Stop checking after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        setChecking(false);
      }, 30000);
    } catch (error) {
      console.error('Failed to request accessibility permission:', error);
      setChecking(false);
    }
  };

  const skip = () => {
    alert('🔧 DEBUG: Pular button clicked!');
    setStep('complete');
    onComplete?.();
  };

  if (step === 'complete') {
    return (
      <Card className="max-w-md mx-auto bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Configuração Completa!</h3>
            <p className="text-green-600">Seu app agora pode detectar transações PIX automaticamente.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <CardTitle className="text-xl">Configurar Permissões</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Para detectar transações PIX automaticamente</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'initial' && (
          <>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800">Acesso a Notificações</h4>
                  <p className="text-sm text-blue-600">Para capturar notificações de PIX do seu banco</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <h4 className="font-medium text-orange-800">Acessibilidade (Backup)</h4>
                  <p className="text-sm text-orange-600">Para detectar transações quando notificações falham</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Native button clicked - calling requestNotificationPermission');
                  requestNotificationPermission();
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                disabled={checking}
              >
                {checking ? 'Configurando...' : 'Configurar Agora'}
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Native skip button clicked - calling skip');
                  skip();
                }}
                disabled={checking}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Pular
              </button>
            </div>
          </>
        )}

        {step === 'notification' && (
          <>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ativar Acesso a Notificações</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Nas configurações que abriram, encontre seu app e ative a permissão de notificações.
                </p>
                {checking && (
                  <p className="text-blue-600 text-sm">Verificando permissões...</p>
                )}
              </div>
            </div>
            
            {!checking && (
              <div className="flex gap-3">
                <Button onClick={checkPermissions} variant="outline" className="flex-1">
                  Já Ativei
                </Button>
                <Button onClick={requestAccessibilityPermission} className="flex-1">
                  Próximo
                </Button>
              </div>
            )}
          </>
        )}

        {step === 'accessibility' && (
          <>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ativar Acessibilidade</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Encontre seu app nas configurações de acessibilidade e ative o serviço como backup.
                </p>
                {checking && (
                  <p className="text-orange-600 text-sm">Verificando permissões...</p>
                )}
              </div>
            </div>
            
            {!checking && (
              <div className="flex gap-3">
                <Button onClick={checkPermissions} variant="outline" className="flex-1">
                  Já Ativei
                </Button>
                <Button onClick={skip} className="flex-1">
                  Finalizar
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};