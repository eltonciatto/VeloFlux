// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  Plus, 
  Check, 
  AlertTriangle,
  Building,
  MapPin,
  Edit,
  Trash2,
  Shield
} from 'lucide-react';
import { useBillingAccount, useUpdatePaymentMethod, useUpdateBillingAddress } from '@/hooks/useBilling';

interface PaymentMethodFormProps {
  method?: {
    id: string;
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  onSubmit: (method: any) => void;
  onCancel: () => void;
}

function PaymentMethodForm({ method, onSubmit, onCancel }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState({
    type: method?.type || 'card',
    cardNumber: '',
    expiryMonth: method?.expiryMonth || '',
    expiryYear: method?.expiryYear || '',
    cvv: '',
    holderName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: formData.type,
      cardNumber: formData.cardNumber,
      expiryMonth: parseInt(formData.expiryMonth as string),
      expiryYear: parseInt(formData.expiryYear as string),
      cvv: formData.cvv,
      holderName: formData.holderName,
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month, label: month.toString().padStart(2, '0') };
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Pagamento</Label>
        <RadioGroup 
          value={formData.type} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Cartão de Crédito</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pix" id="pix" />
            <Label htmlFor="pix">PIX</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="boleto" id="boleto" />
            <Label htmlFor="boleto">Boleto</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.type === 'card' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="holderName">Nome no Cartão</Label>
            <Input
              id="holderName"
              value={formData.holderName}
              onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value }))}
              placeholder="Nome como está no cartão"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => {
                // Format card number with spaces
                const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                setFormData(prev => ({ ...prev, cardNumber: value }));
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Mês</Label>
              <Select 
                value={formData.expiryMonth.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, expiryMonth: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">Ano</Label>
              <Select 
                value={formData.expiryYear.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, expiryYear: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="AAAA" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={formData.cvv}
                onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value }))}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
        </>
      )}

      {formData.type === 'pix' && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Com PIX, você receberá um código QR ou chave PIX para efetuar o pagamento das faturas.
          </p>
        </div>
      )}

      {formData.type === 'boleto' && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Com boleto bancário, você receberá o código de barras para pagamento em bancos ou internet banking.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {method ? 'Atualizar' : 'Adicionar'} Método
        </Button>
      </DialogFooter>
    </form>
  );
}

interface BillingAddressFormProps {
  address?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  onSubmit: (address: any) => void;
  onCancel: () => void;
}

function BillingAddressForm({ address, onSubmit, onCancel }: BillingAddressFormProps) {
  const [formData, setFormData] = useState({
    name: address?.name || '',
    line1: address?.line1 || '',
    line2: address?.line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || 'BR',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome/Empresa</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Nome ou razão social"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="line1">Endereço</Label>
        <Input
          id="line1"
          value={formData.line1}
          onChange={(e) => setFormData(prev => ({ ...prev, line1: e.target.value }))}
          placeholder="Rua, número"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="line2">Complemento (opcional)</Label>
        <Input
          id="line2"
          value={formData.line2}
          onChange={(e) => setFormData(prev => ({ ...prev, line2: e.target.value }))}
          placeholder="Apartamento, sala, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Cidade"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Select 
            value={formData.state} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {brazilianStates.map(state => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">CEP</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => {
              // Format CEP
              const value = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
              setFormData(prev => ({ ...prev, postalCode: value }));
            }}
            placeholder="12345-678"
            maxLength={9}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Select 
            value={formData.country} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BR">Brasil</SelectItem>
              <SelectItem value="US">Estados Unidos</SelectItem>
              <SelectItem value="CA">Canadá</SelectItem>
              <SelectItem value="MX">México</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {address ? 'Atualizar' : 'Adicionar'} Endereço
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PaymentMethodsAndBilling() {
  const { data: account, refetch } = useBillingAccount();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const updateBillingAddress = useUpdateBillingAddress();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);

  const handleAddPaymentMethod = async (methodData: any) => {
    try {
      await updatePaymentMethod.mutateAsync(methodData);
      setShowPaymentForm(false);
      refetch();
    } catch (error) {
      console.error('Failed to add payment method:', error);
    }
  };

  const handleUpdateAddress = async (addressData: any) => {
    try {
      await updateBillingAddress.mutateAsync(addressData);
      setShowAddressForm(false);
      refetch();
    } catch (error) {
      console.error('Failed to update billing address:', error);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you'd return the appropriate brand icon
    return <CreditCard className="h-4 w-4" />;
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (!account) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Carregando informações de pagamento...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>
              Gerencie seus métodos de pagamento para faturas automáticas
            </CardDescription>
          </div>
          <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Método
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                <DialogDescription>
                  Configure um novo método de pagamento para suas faturas.
                </DialogDescription>
              </DialogHeader>
              <PaymentMethodForm
                onSubmit={handleAddPaymentMethod}
                onCancel={() => setShowPaymentForm(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {account.paymentMethods && account.paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {account.paymentMethods.map((method, index) => (
                <Card key={method.id || index} className={`${method.isDefault ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getPaymentMethodIcon(method.type)}
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            {method.type === 'credit_card' ? (
                              <>
                                <span className="capitalize">{method.brand}</span>
                                <span>**** **** **** {method.last4}</span>
                              </>
                            ) : (
                              <span className="capitalize">{method.type}</span>
                            )}
                            {method.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                <Check className="h-2 w-2 mr-1" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                          {method.type === 'credit_card' && method.expiryMonth && method.expiryYear && (
                            <div className="text-sm text-muted-foreground">
                              Expira em {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingMethod(method)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        {!method.isDefault && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum método de pagamento
              </h3>
              <p className="text-gray-500 mb-4">
                Adicione um método de pagamento para automatizar suas faturas.
              </p>
              <Button onClick={() => setShowPaymentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Método
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Address Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Endereço de Cobrança</CardTitle>
            <CardDescription>
              Endereço que aparecerá nas suas faturas
            </CardDescription>
          </div>
          <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                {account.billingAddress ? 'Editar' : 'Adicionar'} Endereço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {account.billingAddress ? 'Editar' : 'Adicionar'} Endereço de Cobrança
                </DialogTitle>
                <DialogDescription>
                  Este endereço será usado para suas faturas e comunicações.
                </DialogDescription>
              </DialogHeader>
              <BillingAddressForm
                address={{
                  name: account.billingAddress?.name || '',
                  line1: account.billingAddress?.line1 || account.billingAddress?.address1 || '',
                  line2: account.billingAddress?.line2 || account.billingAddress?.address2 || '',
                  city: account.billingAddress?.city || '',
                  state: account.billingAddress?.state || '',
                  postalCode: account.billingAddress?.postalCode || '',
                  country: account.billingAddress?.country || '',
                }}
                onSubmit={handleUpdateAddress}
                onCancel={() => setShowAddressForm(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {account.billingAddress ? (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <div className="font-medium">{account.billingAddress.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <div>{account.billingAddress.line1}</div>
                      {account.billingAddress.line2 && <div>{account.billingAddress.line2}</div>}
                      <div>
                        {account.billingAddress.city}, {account.billingAddress.state} {account.billingAddress.postalCode}
                      </div>
                      <div>{account.billingAddress.country}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum endereço cadastrado
              </h3>
              <p className="text-gray-500 mb-4">
                Adicione um endereço de cobrança para suas faturas.
              </p>
              <Button onClick={() => setShowAddressForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Endereço
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Criptografia SSL/TLS</h4>
                <p className="text-sm text-muted-foreground">
                  Todas as informações de pagamento são protegidas por criptografia de 256 bits.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Conformidade PCI DSS</h4>
                <p className="text-sm text-muted-foreground">
                  Nosso processamento de pagamentos segue os mais altos padrões de segurança da indústria.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Não armazenamos dados sensíveis</h4>
                <p className="text-sm text-muted-foreground">
                  Números de cartão completos e CVV não são armazenados em nossos servidores.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Payment Method Dialog */}
      <Dialog open={!!editingMethod} onOpenChange={() => setEditingMethod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Método de Pagamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do seu método de pagamento.
            </DialogDescription>
          </DialogHeader>
          {editingMethod && (
            <PaymentMethodForm
              method={editingMethod}
              onSubmit={async (data) => {
                await handleAddPaymentMethod({ ...data, id: editingMethod.id });
                setEditingMethod(null);
              }}
              onCancel={() => setEditingMethod(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
