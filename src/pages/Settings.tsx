import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Palette, Bell, Target, PiggyBank, CreditCard, BarChart3, Download, Moon, Sun, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useThemeContext } from '@/components/ThemeProvider';
import { useSecurity } from '@/hooks/useSecurity';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Settings = () => {
  const navigate = useNavigate();
  const { themeSettings, isDarkMode, toggleDarkMode, setAccentColor, accentColorOptions } = useThemeContext();
  const { securitySettings, saveSecuritySettings } = useSecurity();

  const settingsSections = [
    {
      title: 'Aparência',
      icon: <Palette className="h-5 w-5" />,
      items: [
        {
          title: 'Modo Escuro',
          description: 'Alternar entre tema claro e escuro',
          action: (
            <Switch
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          )
        },
        {
          title: 'Cor de Destaque',
          description: 'Personalizar cor principal do app',
          action: (
            <div className="flex gap-2">
              {accentColorOptions.slice(0, 4).map((color) => (
                <button
                  key={color.value}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: color.value }}
                  onClick={() => setAccentColor(color.value)}
                />
              ))}
            </div>
          )
        }
      ]
    },
    {
      title: 'Segurança',
      icon: <Shield className="h-5 w-5" />,
      items: [
        {
          title: 'Bloqueio Automático',
          description: 'Tempo para bloqueio por inatividade',
          action: (
            <Select
              value={securitySettings.autoLockDuration.toString()}
              onValueChange={(value) => saveSecuritySettings({
                ...securitySettings,
                autoLockDuration: parseInt(value)
              })}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="10">10 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
              </SelectContent>
            </Select>
          )
        },
        {
          title: 'Autenticar Exportação',
          description: 'Requer autenticação para exportar dados',
          action: (
            <Switch
              checked={securitySettings.requireAuthForExport}
              onCheckedChange={(checked) => saveSecuritySettings({
                ...securitySettings,
                requireAuthForExport: checked
              })}
            />
          )
        },
        {
          title: 'Autenticar Configurações',
          description: 'Requer autenticação para acessar configurações',
          action: (
            <Switch
              checked={securitySettings.requireAuthForSettings}
              onCheckedChange={(checked) => saveSecuritySettings({
                ...securitySettings,
                requireAuthForSettings: checked
              })}
            />
          )
        }
      ]
    },
    {
      title: 'Orçamentos e Alertas',
      icon: <Bell className="h-5 w-5" />,
      items: [
        {
          title: 'Alertas de Orçamento',
          description: 'Notificações quando próximo do limite',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/budget-alerts')}
            >
              Configurar
            </Button>
          )
        },
        {
          title: 'Lembretes de Contas',
          description: 'Notificações para contas a vencer',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/bill-reminders')}
            >
              Configurar
            </Button>
          )
        }
      ]
    },
    {
      title: 'Metas Financeiras',
      icon: <Target className="h-5 w-5" />,
      items: [
        {
          title: 'Metas de Economia',
          description: 'Definir e acompanhar objetivos',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/savings-goals')}
            >
              Gerenciar
            </Button>
          )
        }
      ]
    },
    {
      title: 'Cartões de Crédito',
      icon: <CreditCard className="h-5 w-5" />,
      items: [
        {
          title: 'Gerenciar Cartões',
          description: 'Configurar cartões e limites',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/credit-cards')}
            >
              Configurar
            </Button>
          )
        }
      ]
    },
    {
      title: 'Investimentos',
      icon: <PiggyBank className="h-5 w-5" />,
      items: [
        {
          title: 'Portfólio',
          description: 'Acompanhar performance dos investimentos',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/investments')}
            >
              Ver Performance
            </Button>
          )
        }
      ]
    },
    {
      title: 'Exportar Dados',
      icon: <Download className="h-5 w-5" />,
      items: [
        {
          title: 'Relatórios',
          description: 'Exportar dados em CSV ou PDF',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/export')}
            >
              Exportar
            </Button>
          )
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Personalize seu app</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <Card key={section.title} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {section.icon}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {item.action}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* App Info */}
        <Card className="mt-8 border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Finance Tracker</h3>
              <p className="text-sm text-muted-foreground">
                Versão 2.0.0 - Build 2025.1
              </p>
              <p className="text-xs text-muted-foreground">
                Desenvolvido com ❤️ para suas finanças
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;