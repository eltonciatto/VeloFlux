import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

interface BillingExportManagerProps {
  tenantId: string;
  token: string;
}

interface ExportJob {
  id: string;
  format: 'json' | 'csv' | 'xml';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startDate: string;
  endDate: string;
  createdAt: string;
  downloadUrl?: string;
  fileSize?: number;
}

export function BillingExportManager({ tenantId, token }: BillingExportManagerProps) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const createExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/billing/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: selectedFormat,
          start_date: dateRange.start,
          end_date: dateRange.end,
          include_raw: true
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const newJob = await response.json();
      setExportJobs(prev => [newJob, ...prev]);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [tenantId, token, selectedFormat, dateRange]);

  const downloadExport = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/billing/export/${jobId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-export-${jobId}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  }, [tenantId, token, selectedFormat]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Download className="h-5 w-5" />
          Billing Data Export
        </CardTitle>
        <CardDescription>
          Export billing data in multiple formats for external analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-300">Format</label>
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full mt-1 bg-slate-800 border-slate-600 text-white rounded-md px-3 py-2"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Start Date</label>
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full mt-1 bg-slate-800 border-slate-600 text-white rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">End Date</label>
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full mt-1 bg-slate-800 border-slate-600 text-white rounded-md px-3 py-2"
            />
          </div>
        </div>

        <Button 
          onClick={createExport}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isExporting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Creating Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Create Export
            </>
          )}
        </Button>

        {/* Export Jobs List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Recent Exports</h4>
          {exportJobs.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No exports created yet. Create your first export above.
              </AlertDescription>
            </Alert>
          ) : (
            exportJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {job.format.toUpperCase()} Export
                    </div>
                    <div className="text-xs text-slate-400">
                      {job.startDate} to {job.endDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{job.status}</Badge>
                  {job.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadExport(job.id)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BillingExportManager;
