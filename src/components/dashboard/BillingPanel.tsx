import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { safeApiFetch } from '@/lib/csrfToken';

const BillingPanel = () => {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);
  const [plans, setPlans] = useState([]);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [usageData, setUsageData] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const fetchBillingInfo = async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBillingInfo(response);
    } catch (error) {
      console.error('Error fetching billing info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPlans = async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/plans`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPlans(response);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };
  
  const fetchUsageData = async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/usage`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsageData(response);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };
  
  const createCheckoutSession = async (planType) => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_type: planType,
          is_yearly: billingPeriod === 'yearly'
        })
      });
      
      // Redirect to Stripe checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create checkout session',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (tenantId && token) {
      fetchBillingInfo();
      fetchPlans();
      fetchUsageData();
    }
  }, [tenantId, token]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'trialing':
        return 'text-blue-600';
      case 'past_due':
        return 'text-amber-600';
      case 'canceled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const renderPlanDetails = () => {
    if (!billingInfo) {
      return (
        <Alert>
          <AlertTitle>No subscription</AlertTitle>
          <AlertDescription>
            You don't have an active subscription. Choose a plan below to get started.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Current Plan</p>
            <p className="text-xl font-bold">{billingInfo.plan || 'Free'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className={`text-xl font-bold ${getStatusColor(billingInfo.status)}`}>
              {billingInfo.status || 'no_subscription'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Current Period Start</p>
            <p className="text-base">{formatDate(billingInfo.current_period_start)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Current Period End</p>
            <p className="text-base">{formatDate(billingInfo.current_period_end)}</p>
          </div>
        </div>
        
        {billingInfo.cancel_at_period_end && (
          <Alert>
            <AlertTitle>Subscription will end</AlertTitle>
            <AlertDescription>
              Your subscription will end on {formatDate(billingInfo.current_period_end)}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end">
          <Button onClick={() => setShowUpgradeModal(true)}>
            {billingInfo.status === 'active' ? 'Change Plan' : 'Choose Plan'}
          </Button>
        </div>
      </div>
    );
  };
  
  const renderUsageOverview = () => {
    if (!usageData) {
      return <p>Loading usage data...</p>;
    }
    
    const percentUsed = Math.min(100, Math.round((usageData.total_usage / usageData.plan_limit) * 100));
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">API Requests</h3>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{usageData.total_usage.toLocaleString()} used</span>
              <span>{usageData.plan_limit.toLocaleString()} included</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 ${percentUsed > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            {percentUsed > 90 && (
              <Alert variant="warning">
                <AlertTitle>Usage Warning</AlertTitle>
                <AlertDescription>
                  You've used {percentUsed}% of your included requests. Consider upgrading your plan.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-medium">Recent Usage</h3>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(usageData.usage).slice(-8).map(([date, count]) => (
              <div key={date} className="bg-gray-50 p-2 rounded text-center">
                <p className="text-xs text-gray-500">{date}</p>
                <p className="font-medium">{count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderPlans = () => {
    if (plans.length === 0) {
      return <p>Loading available plans...</p>;
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-end items-center space-x-2">
          <Label htmlFor="billing-period">Billing Period</Label>
          <Select value={billingPeriod} onValueChange={setBillingPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Monthly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly (20% off)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.plan_type} className="relative">
              {billingInfo?.plan === plan.plan_type && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-bl">
                  Current Plan
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.display_name}</CardTitle>
                <CardDescription>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      ${billingPeriod === 'monthly' 
                        ? (plan.price_monthly / 100).toFixed(2) 
                        : (plan.price_yearly / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button 
                    className="w-full"
                    disabled={loading || billingInfo?.plan === plan.plan_type} 
                    onClick={() => createCheckoutSession(plan.plan_type)}
                  >
                    {billingInfo?.plan === plan.plan_type ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>All plans include a 14-day free trial. Cancel anytime.</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : renderPlanDetails()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>Monitor your usage and quotas</CardDescription>
            </CardHeader>
            <CardContent>
              {renderUsageOverview()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Choose the best plan for your needs</CardDescription>
            </CardHeader>
            <CardContent>
              {renderPlans()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Upgrade Modal could be implemented here */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Choose a Plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderPlans()}
            </CardContent>
            <div className="p-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BillingPanel;
