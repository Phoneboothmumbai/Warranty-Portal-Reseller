import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Download, Eye } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

/**
 * BulkImport Component
 * 
 * Reusable component for CSV/Excel bulk imports across admin pages.
 * 
 * Props:
 * - entityName: string (e.g., "Companies", "Devices", "Sites")
 * - columns: array of { key: string, label: string, required: boolean, example: string }
 * - onImport: async function(data: array) => { success: number, errors: array }
 * - sampleData: array of sample rows for template download
 */

const BulkImport = ({ entityName, columns, onImport, sampleData = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('upload'); // upload, preview, importing, complete
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    setIsImporting(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetState, 300);
  };

  const downloadTemplate = () => {
    // Create CSV content
    const headers = columns.map(c => c.key).join(',');
    const sampleRows = sampleData.length > 0 
      ? sampleData.map(row => columns.map(c => `"${row[c.key] || ''}"`).join(',')).join('\n')
      : columns.map(c => `"${c.example || ''}"`).join(',');
    
    const csvContent = `${headers}\n${sampleRows}`;
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityName.toLowerCase().replace(/\s+/g, '_')}_import_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      // Create object from values
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.replace(/^"|"$/g, '') || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const validateData = (data) => {
    const errors = [];
    const requiredColumns = columns.filter(c => c.required).map(c => c.key);
    
    data.forEach((row, index) => {
      requiredColumns.forEach(col => {
        if (!row[col] || row[col].trim() === '') {
          errors.push({
            row: index + 2, // +2 for 1-based index and header row
            column: col,
            message: `Missing required field: ${columns.find(c => c.key === col)?.label || col}`
          });
        }
      });
    });
    
    return errors;
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    // Read and parse file
    const text = await selectedFile.text();
    const data = parseCSV(text);
    
    if (data.length === 0) {
      setValidationErrors([{ row: 0, column: '', message: 'No valid data found in file' }]);
      return;
    }
    
    setParsedData(data);
    const errors = validateData(data);
    setValidationErrors(errors);
    setStep('preview');
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) return;
    
    setIsImporting(true);
    setStep('importing');
    
    try {
      const result = await onImport(parsedData);
      setImportResult(result);
      setStep('complete');
    } catch (error) {
      setImportResult({
        success: 0,
        errors: [{ message: error.message || 'Import failed' }]
      });
      setStep('complete');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        data-testid="bulk-import-btn"
      >
        <Upload className="h-4 w-4 mr-2" />
        Bulk Import
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Bulk Import {entityName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['upload', 'preview', 'complete'].map((s, idx) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s 
                      ? 'bg-emerald-600 text-white' 
                      : idx < ['upload', 'preview', 'complete'].indexOf(step)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < 2 && (
                    <div className={`w-12 h-1 mx-1 rounded ${
                      idx < ['upload', 'preview', 'complete'].indexOf(step)
                        ? 'bg-emerald-200'
                        : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Upload Step */}
            {step === 'upload' && (
              <div className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                >
                  <Upload className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-700 mb-1">
                    Click to upload CSV file
                  </p>
                  <p className="text-sm text-slate-500">
                    or drag and drop
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-700">Required Columns</h4>
                    <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-1" />
                      Download Template
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {columns.map(col => (
                      <div key={col.key} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${col.required ? 'bg-red-500' : 'bg-slate-300'}`} />
                        <span className="text-slate-600">{col.label}</span>
                        {col.required && <span className="text-red-500 text-xs">*</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{file?.name}</p>
                    <p className="text-sm text-slate-500">{parsedData.length} rows found</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetState}>
                    <X className="h-4 w-4 mr-1" />
                    Change File
                  </Button>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">{validationErrors.length} validation errors</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {validationErrors.slice(0, 10).map((err, idx) => (
                        <p key={idx} className="text-sm text-red-600">
                          Row {err.row}: {err.message}
                        </p>
                      ))}
                      {validationErrors.length > 10 && (
                        <p className="text-sm text-red-500 font-medium">
                          ...and {validationErrors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Data Preview Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Preview (first 5 rows)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">#</th>
                          {columns.slice(0, 5).map(col => (
                            <th key={col.key} className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                              {col.label}
                            </th>
                          ))}
                          {columns.length > 5 && (
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">...</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                            {columns.slice(0, 5).map(col => (
                              <td key={col.key} className="px-3 py-2 text-slate-700 max-w-[150px] truncate">
                                {row[col.key] || <span className="text-slate-300">—</span>}
                              </td>
                            ))}
                            {columns.length > 5 && (
                              <td className="px-3 py-2 text-slate-400">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Importing Step */}
            {step === 'importing' && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-700">Importing {parsedData.length} records...</p>
                <p className="text-sm text-slate-500 mt-1">This may take a moment</p>
              </div>
            )}

            {/* Complete Step */}
            {step === 'complete' && importResult && (
              <div className="space-y-4">
                {importResult.success > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">
                        Successfully imported {importResult.success} {entityName.toLowerCase()}
                      </span>
                    </div>
                  </div>
                )}

                {importResult.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">{importResult.errors.length} errors occurred</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 10).map((err, idx) => (
                        <p key={idx} className="text-sm text-red-600">
                          {err.row ? `Row ${err.row}: ` : ''}{err.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={handleClose}>
              {step === 'complete' ? 'Close' : 'Cancel'}
            </Button>
            
            {step === 'preview' && (
              <Button 
                onClick={handleImport}
                disabled={validationErrors.length > 0 || isImporting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import {parsedData.length} Records
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { BulkImport };
