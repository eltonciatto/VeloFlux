// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Download, 
  Eye, 
  FileText, 
  Calendar,
  Filter,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/billingApi';
import { useInvoices, useInvoice, useDownloadInvoice } from '@/hooks/useBilling';

interface InvoiceDetailDialogProps {
  invoiceId: string;
  open: boolean;
  onClose: () => void;
}

function InvoiceDetailDialog({ invoiceId, open, onClose }: InvoiceDetailDialogProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const downloadInvoice = useDownloadInvoice();

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando fatura...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) return null;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const statusIcons = {
    pending: Clock,
    paid: CheckCircle,
    overdue: AlertCircle,
    draft: FileText,
  };

  const StatusIcon = statusIcons[invoice.status as keyof typeof statusIcons];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Fatura #{invoice.number}</span>
            <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Período: {new Date(invoice.period.start).toLocaleDateString()} - {new Date(invoice.period.end).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <DollarSign className="h-5 w-5 mr-1" />
                  {formatCurrency(invoice.amount, invoice.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Data de Vencimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </div>
                {new Date(invoice.dueDate) <= new Date() && invoice.status !== 'paid' && (
                  <p className="text-xs text-red-500 mt-1">Vencida</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {typeof invoice.paymentMethod === 'object' && invoice.paymentMethod?.type === 'credit_card' ? 
                    `**** **** **** ${invoice.paymentMethod.last4}` : 
                    typeof invoice.paymentMethod === 'object' ? invoice.paymentMethod?.type || 'Não definido' :
                    invoice.paymentMethod || 'Não definido'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Itens da Fatura</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice, invoice.currency)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Imposto ({(invoice.taxRate * 100).toFixed(1)}%):</span>
                    <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                  </div>
                )}
                {invoice.credits > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Créditos aplicados:</span>
                    <span>-{formatCurrency(invoice.credits, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          {invoice.billingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Cobrança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div>{invoice.billingAddress.name}</div>
                  <div>{invoice.billingAddress.line1}</div>
                  {invoice.billingAddress.line2 && <div>{invoice.billingAddress.line2}</div>}
                  <div>
                    {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.postalCode}
                  </div>
                  <div>{invoice.billingAddress.country}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline"
              onClick={() => downloadInvoice.mutate(invoice.id)}
              disabled={downloadInvoice.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadInvoice.isPending ? 'Baixando...' : 'Baixar PDF'}
            </Button>
            {invoice.status === 'pending' && (
              <Button>
                Pagar Agora
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InvoiceManagement() {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const { data: invoices, isLoading } = useInvoices(50);
  const downloadInvoice = useDownloadInvoice();

  const filteredInvoices = React.useMemo(() => {
    if (!invoices) return [];

    return invoices.filter(invoice => {
      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm && !invoice.number.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (dateRange !== 'all') {
        const invoiceDate = new Date(invoice.period.end);
        const now = new Date();
        const monthsAgo = parseInt(dateRange);
        const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
        
        if (invoiceDate < cutoffDate) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, statusFilter, searchTerm, dateRange]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const statusIcons = {
    pending: Clock,
    paid: CheckCircle,
    overdue: AlertCircle,
    draft: FileText,
  };

  // Statistics
  const stats = React.useMemo(() => {
    if (!invoices) return { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0 };

    return invoices.reduce((acc, invoice) => {
      acc.total++;
      acc.totalAmount += invoice.amount;
      
      if (invoice.status === 'paid') acc.paid++;
      else if (invoice.status === 'pending') acc.pending++;
      else if (invoice.status === 'overdue') acc.overdue++;
      
      return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0 });
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount, 'BRL')} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por número</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Ex: INV-001"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Período</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Último mês</SelectItem>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                  setDateRange('all');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Faturas ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusIcons[invoice.status as keyof typeof statusIcons];
                  const isOverdue = new Date(invoice.dueDate) <= new Date() && invoice.status !== 'paid';
                  
                  return (
                    <TableRow key={invoice.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">
                        #{invoice.number}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(invoice.period.start).toLocaleDateString()} - {new Date(invoice.period.end).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                          {isOverdue && <div className="text-xs text-red-500">Vencida</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoice.mutate(invoice.id)}
                            disabled={downloadInvoice.isPending}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma fatura encontrada
              </h3>
              <p className="text-gray-500">
                {statusFilter !== 'all' || searchTerm || dateRange !== 'all' 
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Suas faturas aparecerão aqui quando houver uso de recursos.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <InvoiceDetailDialog
          invoiceId={selectedInvoice}
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
