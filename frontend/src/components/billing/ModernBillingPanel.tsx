import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Star,
  Zap,
  Shield,
  Crown,
  Loader2,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

const ModernBillingPanel = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);

  // Carregar dados de billing
  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Carregar assinaturas, faturas e planos em paralelo
      const [subscriptionsData, invoicesData, plansData] = await Promise.all([
        apiFetch('/api/billing/subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        apiFetch('/api/billing/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        apiFetch('/api/billing/plans', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ items: [] })) // Fallback se planos não existirem
      ]);

      setSubscriptions(subscriptionsData.items || []);
      setInvoices(invoicesData.items || []);
      setPlans(plansData.items || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações de billing.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar nova assinatura
  const createSubscription = async (planType) => {
    setProcessingUpgrade(true);
    try {
      const response = await apiFetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: planType,
          billing_cycle: 'monthly'
        })
      });

      toast({
        title: 'Assinatura criada!',
        description: `Plano ${planType} ativado com sucesso.`,
      });

      setShowUpgradeDialog(false);
      loadBillingData(); // Recarregar dados
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Erro ao criar assinatura',
        description: 'Não foi possível criar a assinatura. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setProcessingUpgrade(false);
    }
  };

  // Atualizar plano existente
  const updateSubscription = async (subscriptionId, newPlan) => {
    setProcessingUpgrade(true);
    try {
      const response = await apiFetch(`/api/billing/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: newPlan
        })
      });

      toast({
        title: 'Plano atualizado!',
        description: `Seu plano foi alterado para ${newPlan}.`,
      });

      setShowUpgradeDialog(false);
      loadBillingData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Erro ao atualizar plano',
        description: 'Não foi possível atualizar o plano. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setProcessingUpgrade(false);
    }
  };

  // Função para lidar com seleção de plano
  const handlePlanSelect = (planType) => {
    const currentSubscription = subscriptions[0];
    
    if (currentSubscription) {
      updateSubscription(currentSubscription.subscription_id, planType);
    } else {
      createSubscription(planType);
    }
  };

  // Configuração dos planos
  const planIcons = {
    free: Shield,
    pro: Zap,
    enterprise: Crown
  };

  const planColors = {
    free: 'from-gray-500 to-gray-600',
    pro: 'from-blue-500 to-blue-600',
    enterprise: 'from-purple-500 to-purple-600'
  };

  // Componente para status da assinatura
  const SubscriptionStatus = ({ subscription }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      incomplete: 'bg-gray-100 text-gray-800'
    };

    const statusIcons = {
      active: CheckCircle,
      trialing: Calendar,
      past_due: AlertCircle,
      canceled: AlertCircle,
      incomplete: AlertCircle
    };

    const StatusIcon = statusIcons[subscription.status] || AlertCircle;

    return (
      <Badge className={`${statusColors[subscription.status]} flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {subscription.status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Overview da assinatura atual
  const renderSubscriptionOverview = () => {
    const subscription = subscriptions[0];

    if (!subscription) {
      return (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma assinatura ativa</h3>
              <p className="text-gray-500 mb-4">Escolha um plano para começar a usar o VeloFlux.</p>
              <Button onClick={() => setShowUpgradeDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Escolher Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Plano Atual */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${planColors[subscription.plan]} flex items-center justify-center`}>
                {React.createElement(planIcons[subscription.plan] || Shield, { className: "w-5 h-5 text-white" })}
              </div>
              <div>
                <p className="text-sm text-gray-500">Plano Atual</p>
                <p className="font-semibold capitalize">{subscription.plan}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <SubscriptionStatus subscription={subscription} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próxima cobrança */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Próxima Cobrança</p>
                <p className="font-semibold text-sm">
                  {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <Button 
                size="sm" 
                onClick={() => setShowUpgradeDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <ArrowUp className="w-4 h-4 mr-1" />
                Alterar Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Lista de faturas
  const renderInvoices = () => {
    if (invoices.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma fatura encontrada</h3>
            <p className="text-gray-500">Suas faturas aparecerão aqui quando geradas.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Faturas Recentes
          </CardTitle>
          <CardDescription>Histórico de cobranças da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    invoice.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <DollarSign className={`w-4 h-4 ${
                      invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">${(invoice.amount_due / 100).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                  {invoice.status === 'paid' ? 'Paga' : 'Pendente'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Dialog para seleção de planos
  const renderPlanSelectionDialog = () => {
    const currentPlan = subscriptions[0]?.plan || 'free';
    
    const plansData = [
      {
        type: 'free',
        name: 'Free',
        price: 0,
        icon: Shield,
        features: ['10 requests/sec', 'Basic support'],
        color: 'from-gray-500 to-gray-600'
      },
      {
        type: 'pro',
        name: 'Pro',
        price: 29,
        icon: Zap,
        features: ['100 requests/sec', 'Priority support', 'Advanced analytics'],
        color: 'from-blue-500 to-blue-600',
        popular: true
      },
      {
        type: 'enterprise',
        name: 'Enterprise',
        price: 99,
        icon: Crown,
        features: ['Unlimited requests', '24/7 support', 'Custom integrations', 'SLA guarantee'],
        color: 'from-purple-500 to-purple-600'
      }
    ];

    return (
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Escolha seu plano</DialogTitle>
            <DialogDescription>
              Selecione o plano que melhor se adapta às suas necessidades
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {plansData.map((plan) => {
              const IconComponent = plan.icon;
              const isCurrentPlan = currentPlan === plan.type;
              
              return (
                <Card 
                  key={plan.type} 
                  className={`relative transition-all duration-200 ${
                    plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  } ${isCurrentPlan ? 'bg-gray-50 border-green-500' : 'hover:shadow-md cursor-pointer'}`}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan.type)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-3">
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Atual
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-500">/mês</span>
                    </div>

                    <ul className="space-y-2 mb-6 text-sm">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        isCurrentPlan 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : plan.popular 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                      disabled={isCurrentPlan || processingUpgrade}
                      onClick={() => !isCurrentPlan && handlePlanSelect(plan.type)}
                    >
                      {processingUpgrade && selectedPlan === plan.type ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : isCurrentPlan ? (
                        'Plano Atual'
                      ) : (
                        'Selecionar'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando dados de billing...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Assinaturas</h1>
          <p className="text-gray-600">Gerencie seus planos e pagamentos</p>
        </div>
        <Button onClick={() => setShowUpgradeDialog(true)} className="bg-purple-600 hover:bg-purple-700">
          <CreditCard className="w-4 h-4 mr-2" />
          Gerenciar Plano
        </Button>
      </div>

      {/* Overview da assinatura */}
      {renderSubscriptionOverview()}

      {/* Abas principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
          <TabsTrigger value="usage">Uso</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card de informações da assinatura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informações da Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptions[0] ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID da Assinatura:</span>
                      <span className="font-mono text-sm">{subscriptions[0].subscription_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Criada em:</span>
                      <span>{new Date(subscriptions[0].created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Última atualização:</span>
                      <span>{new Date(subscriptions[0].updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhuma assinatura ativa</p>
                )}
              </CardContent>
            </Card>

            {/* Card de estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total de faturas:</span>
                    <span className="font-semibold">{invoices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor total pago:</span>
                    <span className="font-semibold">
                      ${invoices.reduce((total, invoice) => total + (invoice.amount_due / 100), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tempo como cliente:</span>
                    <span className="font-semibold">
                      {subscriptions[0] ? 
                        Math.ceil((Date.now() - new Date(subscriptions[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) 
                        : 0} dias
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          {renderInvoices()}
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Uso de Recursos</CardTitle>
              <CardDescription>Monitor seu uso atual e limites do plano</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Em desenvolvimento</AlertTitle>
                <AlertDescription>
                  As métricas de uso estarão disponíveis em breve.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de seleção de planos */}
      {renderPlanSelectionDialog()}
    </div>
  );
};

export default ModernBillingPanel;
