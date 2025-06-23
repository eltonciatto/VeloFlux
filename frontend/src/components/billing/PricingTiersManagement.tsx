// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  Star, 
  Zap, 
  TrendingUp, 
  Users,
  Globe,
  Database,
  Bot,
  Crown,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, recommendTier } from '@/lib/billingApi';
import { useBillingAccount, usePricingTiers, useCurrentUsage, useUpdateTier } from '@/hooks/useBilling';

interface FeatureListProps {
  features: string[];
  highlight?: boolean;
}

function FeatureList({ features, highlight = false }: FeatureListProps) {
  return (
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start space-x-2">
          <Check className={`h-4 w-4 mt-0.5 ${highlight ? 'text-blue-500' : 'text-green-500'}`} />
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

interface TierCardProps {
  tier: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    billingPeriod: string;
    features: string[];
    limits: {
      requests: number;
      dataTransferGB: number;
      aiPredictions: number;
      storageGB: number;
      users: number;
    };
    overage: {
      requests: number;
      dataTransferGB: number;
      aiPredictions: number;
      storageGB: number;
    };
    popular?: boolean;
    recommended?: boolean;
  };
  currentTier?: {
    id: string;
    name: string;
    price?: number;
  };
  usage?: {
    requestCount: number;
    dataTransferMB: number;
    aiPredictions: number;
    storageMB: number;
  };
  onSelectTier: (tierId: string) => void;
  isLoading?: boolean;
}

function TierCard({ tier, currentTier, usage, onSelectTier, isLoading }: TierCardProps) {
  const isCurrentTier = currentTier?.id === tier.id;
  const isUpgrade = currentTier && tier.price && currentTier.price && tier.price > currentTier.price;
  const isDowngrade = currentTier && tier.price && currentTier.price && tier.price < currentTier.price;

  // Calculate usage percentages for current tier
  const usagePercentages = usage ? {
    requests: (usage.requestCount / tier.limits.requests) * 100,
    dataTransfer: (usage.dataTransferMB / 1024 / tier.limits.dataTransferGB) * 100,
    aiPredictions: (usage.aiPredictions / tier.limits.aiPredictions) * 100,
    storage: (usage.storageMB / 1024 / tier.limits.storageGB) * 100,
  } : null;

  const wouldExceedLimits = usagePercentages && (
    usagePercentages.requests > 100 ||
    usagePercentages.dataTransfer > 100 ||
    usagePercentages.aiPredictions > 100 ||
    usagePercentages.storage > 100
  );

  const getTierIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'starter':
      case 'básico':
        return <Zap className="h-5 w-5" />;
      case 'professional':
      case 'profissional':
        return <TrendingUp className="h-5 w-5" />;
      case 'enterprise':
      case 'empresarial':
        return <Crown className="h-5 w-5" />;
      case 'custom':
      case 'personalizado':
        return <Star className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  return (
    <Card className={`relative ${
      tier.popular ? 'border-blue-500 shadow-lg' : ''
    } ${
      tier.recommended ? 'border-green-500 shadow-lg' : ''
    } ${
      isCurrentTier ? 'border-purple-500 bg-purple-50' : ''
    }`}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}
      
      {tier.recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-green-500 text-white">
            <TrendingUp className="h-3 w-3 mr-1" />
            Recomendado
          </Badge>
        </div>
      )}

      {isCurrentTier && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-purple-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Atual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {getTierIcon(tier.name)}
          <CardTitle className="text-xl">{tier.name}</CardTitle>
        </div>
        <CardDescription>{tier.description}</CardDescription>
        <div className="mt-4">
          <div className="text-3xl font-bold">
            {tier.price === 0 ? 'Grátis' : formatCurrency(tier.price, tier.currency)}
          </div>
          {tier.price > 0 && (
            <div className="text-sm text-muted-foreground">
              por {tier.billingPeriod === 'monthly' ? 'mês' : 'ano'}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Limits */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Limites Incluídos:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                Requisições
              </span>
              <span className="font-medium">
                {tier.limits.requests.toLocaleString()}/mês
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Transferência
              </span>
              <span className="font-medium">
                {tier.limits.dataTransferGB}GB/mês
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center">
                <Bot className="h-3 w-3 mr-1" />
                Predições AI
              </span>
              <span className="font-medium">
                {tier.limits.aiPredictions.toLocaleString()}/mês
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Armazenamento
              </span>
              <span className="font-medium">
                {tier.limits.storageGB}GB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                Usuários
              </span>
              <span className="font-medium">
                {tier.limits.users === -1 ? 'Ilimitado' : tier.limits.users}
              </span>
            </div>
          </div>
        </div>

        {/* Current usage for current tier */}
        {isCurrentTier && usage && usagePercentages && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium text-sm">Uso Atual:</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Requisições</span>
                  <span>{usage.requestCount.toLocaleString()} ({usagePercentages.requests.toFixed(1)}%)</span>
                </div>
                <Progress value={Math.min(usagePercentages.requests, 100)} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Transferência</span>
                  <span>{(usage.dataTransferMB / 1024).toFixed(1)}GB ({usagePercentages.dataTransfer.toFixed(1)}%)</span>
                </div>
                <Progress value={Math.min(usagePercentages.dataTransfer, 100)} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Predições AI</span>
                  <span>{usage.aiPredictions.toLocaleString()} ({usagePercentages.aiPredictions.toFixed(1)}%)</span>
                </div>
                <Progress value={Math.min(usagePercentages.aiPredictions, 100)} />
              </div>
            </div>
          </div>
        )}

        {/* Overage pricing */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Preços de Excesso:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Requisições: {formatCurrency(tier.overage.requests, tier.currency)}/1k extra</div>
            <div>Transferência: {formatCurrency(tier.overage.dataTransferGB, tier.currency)}/GB extra</div>
            <div>Predições AI: {formatCurrency(tier.overage.aiPredictions, tier.currency)}/1k extra</div>
            <div>Armazenamento: {formatCurrency(tier.overage.storageGB, tier.currency)}/GB extra</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Recursos:</h4>
          <FeatureList features={tier.features} highlight={tier.popular || tier.recommended} />
        </div>

        {/* Warning if current usage would exceed this tier */}
        {!isCurrentTier && wouldExceedLimits && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800">Uso atual excede os limites</div>
                <div className="text-yellow-700">
                  Haverá cobrança por excesso se você mudar para este plano.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full"
          variant={isCurrentTier ? 'secondary' : tier.popular || tier.recommended ? 'default' : 'outline'}
          onClick={() => onSelectTier(tier.id)}
          disabled={isCurrentTier || isLoading}
        >
          {isCurrentTier ? (
            'Plano Atual'
          ) : isUpgrade ? (
            <>
              Fazer Upgrade
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          ) : isDowngrade ? (
            'Fazer Downgrade'
          ) : (
            'Selecionar Plano'
          )}
        </Button>

        {/* Change description */}
        {!isCurrentTier && currentTier && (
          <div className="text-xs text-center text-muted-foreground">
            {isUpgrade ? 
              'Mudança efetiva imediatamente' : 
              'Mudança efetiva no próximo ciclo'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PricingTiersManagement() {
  const { data: account } = useBillingAccount();
  const { data: tiers, isLoading: tiersLoading } = usePricingTiers();
  const { data: usage } = useCurrentUsage();
  const updateTier = useUpdateTier();

  const handleSelectTier = async (tierId: string) => {
    if (account?.currentTier.id === tierId) return;
    
    try {
      await updateTier.mutateAsync(tierId);
    } catch (error) {
      console.error('Failed to update tier:', error);
    }
  };

  // Get recommended tier based on current usage
  const recommendedTier = React.useMemo(() => {
    if (!usage || !tiers) return null;
    return recommendTier(usage, tiers);
  }, [usage, tiers]);

  if (tiersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mt-4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!tiers || !account) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Não foi possível carregar os planos de preços.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Add recommended flag to tiers
  const enhancedTiers = tiers.map(tier => ({
    ...tier,
    recommended: recommendedTier?.id === tier.id
  }));

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-lg">{account.currentTier.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(account.currentTier.price, account.currency)}/mês
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Próxima Cobrança</p>
              <p className="text-sm text-muted-foreground">
                {new Date(account.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Créditos Disponíveis</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(account.credits, account.currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Banner */}
      {recommendedTier && recommendedTier.id !== account.currentTier.id && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900">
                  Recomendação Baseada no Seu Uso
                </h3>
                <p className="text-sm text-green-800 mt-1">
                  Baseado no seu padrão de uso atual, o plano <strong>{recommendedTier.name}</strong> seria mais adequado.
                  {recommendedTier.price > account.currentTier.price ? 
                    ' Você economizaria nas cobranças de excesso.' :
                    ' Você economizaria na mensalidade.'
                  }
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleSelectTier(recommendedTier.id)}
                disabled={updateTier.isPending}
              >
                Ver Detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Tiers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enhancedTiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={{
              ...tier,
              price: tier.price || tier.pricing.basePrice,
              currency: tier.currency || 'USD',
              billingPeriod: tier.billingPeriod || 'monthly',
              features: tier.features || ['Basic features'],
              overage: tier.overage || {
                requests: tier.pricing.overageRates.requests,
                dataTransferGB: tier.pricing.overageRates.dataTransferGB,
                aiPredictions: tier.pricing.overageRates.aiPredictions,
                geoQueries: tier.pricing.overageRates.geoQueries,
                storageGB: tier.pricing.overageRates.storageGB,
                bandwidthGB: tier.pricing.overageRates.bandwidthGB,
                computeHours: tier.pricing.overageRates.computeHours,
                edgeLocations: tier.pricing.overageRates.edgeLocations,
              },
              limits: {
                ...tier.limits,
                users: tier.limits.users || 1,
              }
            }}
            currentTier={account.currentTier}
            usage={usage}
            onSelectTier={handleSelectTier}
            isLoading={updateTier.isPending}
          />
        ))}
      </div>

      {/* Enterprise/Custom Tier Call-to-Action */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="pt-6">
          <div className="text-center">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Precisa de Algo Personalizado?
            </h3>
            <p className="text-gray-500 mb-4">
              Para empresas com necessidades específicas, oferecemos planos personalizados
              com recursos dedicados, SLA garantido e suporte premium.
            </p>
            <div className="space-y-2">
              <Button variant="outline" asChild>
                <a href="/contact" target="_blank">
                  Falar com Vendas
                </a>
              </Button>
              <div className="text-xs text-muted-foreground">
                • Recursos dedicados • SLA 99.9% • Suporte 24/7 • Integração personalizada
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ or Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Posso mudar de plano a qualquer momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Upgrades são aplicados imediatamente, downgrades no próximo ciclo de cobrança.
              </p>
            </div>
            <div>
              <h4 className="font-medium">O que acontece se eu exceder os limites?</h4>
              <p className="text-sm text-muted-foreground">
                Cobramos apenas o excesso utilizado com base nos preços de overage de cada plano.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Oferecemos reembolso?</h4>
              <p className="text-sm text-muted-foreground">
                Sim, oferecemos reembolso total em até 30 dias para novos clientes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
