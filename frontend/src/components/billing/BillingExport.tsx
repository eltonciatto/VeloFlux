import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useBillingExport, BillingExportOptions, BillingReport } from '@/hooks/useBillingExport';
import { 
  Download, 
  FileText, 
  Calendar, 
  Clock, 
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Send,
  Webhook,
  Mail,
  Eye
} from 'lucide-react';

const BillingExport = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('export');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  
  const [exportOptions, setExportOptions] = useState<BillingExportOptions>({
    format: 'pdf',
    date_range: {
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    },
    include_details: true,
    include_usage: true,
    include_transactions: true,
    include_invoices: false,
    group_by: 'day'
  });

  const [newReport, setNewReport] = useState<{
    name: string;
    description: string;
    format: 'pdf' | 'csv' | 'excel' | 'json';
    schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    options: BillingExportOptions;
  }>({
    name: '',
    description: '',
    format: 'pdf',
    schedule: 'monthly',
    recipients: [''],
    options: exportOptions
  });

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['invoice.created', 'payment.completed'],
    enabled: true,
    retry_config: {
      max_retries: 3,
      retry_delay: 1000,
      exponential_backoff: true
    },
    headers: {}
  });

  const {
    reports,
    transactions,
    webhooks,
    exportProgress,
    loading,
    generateExport,
    getExportStatus,
    downloadExport,
    exportTransactionSummary,
    fetchReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    fetchTransactions,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    refreshAll
  } = useBillingExport(tenantId!, token!);

  // Initialize data
  useEffect(() => {
    if (tenantId && token) {
      refreshAll();
    }
  }, [tenantId, token, refreshAll]);

  // Handle export generation
  const handleGenerateExport = async () => {
    try {
      await generateExport(exportOptions);
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Error generating export:', error);
    }
  };

  // Handle quick export
  const handleQuickExport = async (format: 'pdf' | 'csv' | 'excel') => {
    const quickOptions: BillingExportOptions = {
      ...exportOptions,
      format
    };
    
    try {
      await exportTransactionSummary(quickOptions);
    } catch (error) {
      console.error('Error with quick export:', error);
    }
  };

  // Handle create scheduled report
  const handleCreateReport = async () => {
    try {
      await createScheduledReport(newReport);
      setNewReport({
        name: '',
        description: '',
        format: 'pdf',
        schedule: 'monthly',
        recipients: [''],
        options: exportOptions
      });
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  // Handle create webhook
  const handleCreateWebhook = async () => {
    try {
      await createWebhook(newWebhook);
      setNewWebhook({
        name: '',
        url: '',
        events: ['invoice.created', 'payment.completed'],
        enabled: true,
        retry_config: {
          max_retries: 3,
          retry_delay: 1000,
          exponential_backoff: true
        },
        headers: {}
      });
      setIsWebhookDialogOpen(false);
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing':
      case 'queued':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paused':
      case 'inactive':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Billing Export & Reports</h1>
          <p className="text-slate-400">
            Export billing data, create scheduled reports, and configure webhooks
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={refreshAll}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-500/20 cursor-pointer hover:border-red-500/40 transition-all"
                onClick={() => handleQuickExport('pdf')}>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Export PDF</h3>
              <p className="text-slate-400 text-sm">Generate comprehensive PDF report</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/20 cursor-pointer hover:border-green-500/40 transition-all"
                onClick={() => handleQuickExport('csv')}>
            <CardContent className="p-6 text-center">
              <Download className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Export CSV</h3>
              <p className="text-slate-400 text-sm">Download data for analysis</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/20 cursor-pointer hover:border-blue-500/40 transition-all"
                onClick={() => handleQuickExport('excel')}>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Export Excel</h3>
              <p className="text-slate-400 text-sm">Advanced spreadsheet format</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
          <TabsTrigger value="export" className="data-[state=active]:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-slate-700">
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled Reports
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-slate-700">
            <DollarSign className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-slate-700">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Custom Export Configuration
                </CardTitle>
                <CardDescription>
                  Configure detailed export options for your billing data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Export Format</Label>
                    <Select 
                      value={exportOptions.format} 
                      onValueChange={(value: 'pdf' | 'csv' | 'excel' | 'json') => 
                        setExportOptions(prev => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                        <SelectItem value="csv">CSV Data</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="json">JSON Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Group By</Label>
                    <Select 
                      value={exportOptions.group_by} 
                      onValueChange={(value: 'day' | 'week' | 'month') => 
                        setExportOptions(prev => ({ ...prev, group_by: value }))
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Start Date</Label>
                    <Input
                      type="date"
                      value={exportOptions.date_range.start_date}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        date_range: { ...prev.date_range, start_date: e.target.value }
                      }))}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-white">End Date</Label>
                    <Input
                      type="date"
                      value={exportOptions.date_range.end_date}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        date_range: { ...prev.date_range, end_date: e.target.value }
                      }))}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Include Data</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-details"
                        checked={exportOptions.include_details}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, include_details: checked }))}
                      />
                      <Label htmlFor="include-details" className="text-white">Detailed Breakdown</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-usage"
                        checked={exportOptions.include_usage}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, include_usage: checked }))}
                      />
                      <Label htmlFor="include-usage" className="text-white">Usage Metrics</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-transactions"
                        checked={exportOptions.include_transactions}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, include_transactions: checked }))}
                      />
                      <Label htmlFor="include-transactions" className="text-white">Transaction History</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-invoices"
                        checked={exportOptions.include_invoices}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, include_invoices: checked }))}
                      />
                      <Label htmlFor="include-invoices" className="text-white">Invoice Data</Label>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateExport}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Custom Export
                </Button>
              </CardContent>
            </Card>

            {/* Export Progress */}
            {Object.keys(exportProgress).length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Export Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(exportProgress).map(([id, progress]) => (
                      <div key={id} className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">Export {id}</span>
                          <Badge className={getStatusColor(progress.status)}>
                            {progress.status}
                          </Badge>
                        </div>
                        <Progress value={progress.progress_percentage} className="mb-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">
                            {progress.progress_percentage}% complete
                          </span>
                          {progress.status === 'completed' && progress.file_url && (
                            <Button
                              size="sm"
                              onClick={() => downloadExport(id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Scheduled Reports</h3>
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Report
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Scheduled Report</DialogTitle>
                  <DialogDescription>
                    Set up automated billing reports delivered on schedule
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Report Name</Label>
                      <Input
                        value={newReport.name}
                        onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Monthly billing report"
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Schedule</Label>
                      <Select 
                        value={newReport.schedule} 
                        onValueChange={(value: 'manual' | 'daily' | 'weekly' | 'monthly') => 
                          setNewReport(prev => ({ ...prev, schedule: value }))
                        }
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="manual">Manual Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={newReport.description}
                      onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this report contains..."
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Recipients (one email per line)</Label>
                    <Textarea
                      value={newReport.recipients.join('\n')}
                      onChange={(e) => setNewReport(prev => ({ 
                        ...prev, 
                        recipients: e.target.value.split('\n').filter(Boolean) 
                      }))}
                      placeholder="admin@company.com"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateReport} className="bg-blue-600 hover:bg-blue-700">
                    Create Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Schedule</TableHead>
                    <TableHead className="text-slate-300">Last Generated</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-slate-700">
                      <TableCell>
                        <div>
                          <div className="text-white font-medium">{report.name}</div>
                          <div className="text-sm text-slate-400">{report.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {report.schedule}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {report.last_generated ? new Date(report.last_generated).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {/* Handle edit */}}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteScheduledReport(report.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <CardDescription>
                View and export transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{transaction.description}</span>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400">
                        {transaction.tenant_name} • {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        transaction.transaction_type === 'charge' ? 'text-red-400' :
                        transaction.transaction_type === 'refund' ? 'text-green-400' :
                        'text-blue-400'
                      }`}>
                        {transaction.transaction_type === 'refund' ? '+' : ''}
                        ${transaction.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-400">
                        {transaction.currency.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Webhook Configuration</h3>
            <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Webhook</DialogTitle>
                  <DialogDescription>
                    Configure webhook to receive billing events
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Webhook Name</Label>
                    <Input
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Payment processor webhook"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-white">URL</Label>
                    <Input
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://api.example.com/webhook"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateWebhook} className="bg-blue-600 hover:bg-blue-700">
                    Create Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">URL</TableHead>
                    <TableHead className="text-slate-300">Events</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id} className="border-slate-700">
                      <TableCell className="text-white">{webhook.name}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{webhook.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event) => (
                            <Badge key={event} className="bg-blue-500/20 text-blue-400 text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge className="bg-gray-500/20 text-gray-400 text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(webhook.status)}>
                          {webhook.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => testWebhook(webhook.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteWebhook(webhook.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingExport;
