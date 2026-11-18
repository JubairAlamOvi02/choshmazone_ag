import React, { useState } from 'react';
import { X, Download, Server, FileText, Database, CheckCircle2, HelpCircle, Layers, Image, FolderUp } from 'lucide-react';
import { downloadServerJson, downloadServerCsv, generateServerJson, generateServerCsv } from '../../lib/serverProductExporter';
import { useToast } from '../../context/ToastContext';

const ExportServerModal = ({ isOpen, onClose, allProducts = [], selectedProductIds = [] }) => {
    const { showToast } = useToast();
    const hasSelected = selectedProductIds && selectedProductIds.length > 0;

    const [scope, setScope] = useState(hasSelected ? 'selected' : 'all');
    const [format, setFormat] = useState('json'); // 'json' | 'csv'
    const [includeInactive, setIncludeInactive] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    if (!isOpen) return null;

    const targetProducts = (scope === 'selected' && hasSelected)
        ? allProducts.filter(p => selectedProductIds.includes(p.id))
        : allProducts;

    const totalCount = targetProducts.filter(p => includeInactive || p.is_active).length;

    const handleDownload = () => {
        try {
            setIsExporting(true);
            let result;
            if (format === 'json') {
                result = downloadServerJson(targetProducts, { includeInactive });
                if (showToast) {
                    showToast(`Exported ${result.totalProducts} products to JSON for Choshmazone Server!`, 'success');
                }
            } else {
                result = downloadServerCsv(targetProducts, { includeInactive });
                if (showToast) {
                    showToast(`Exported ${result.productCount} products to CSV for Choshmazone Server!`, 'success');
                }
            }

            setTimeout(() => {
                setIsExporting(false);
                onClose();
            }, 600);
        } catch (err) {
            console.error('Export failed:', err);
            if (showToast) {
                showToast('Failed to export products for server.', 'error');
            }
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                            <Database size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-text-main font-outfit">Export for Choshmazone Server</h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                    Server VPS
                                </span>
                            </div>
                            <p className="text-xs text-text-muted font-outfit mt-0.5">
                                Export full catalog data tailored 100% for D:\AG_Projects\choshmazone_server.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        title="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Options */}
                <div className="space-y-4 font-outfit">
                    {/* Scope Selector (Only if items are selected) */}
                    {hasSelected && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                                Products to Export
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setScope('selected')}
                                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between ${
                                        scope === 'selected'
                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-bold shadow-sm'
                                            : 'border-border text-text-muted hover:border-gray-300'
                                    }`}
                                >
                                    <span>Selected Only</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
                                        {selectedProductIds.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScope('all')}
                                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between ${
                                        scope === 'all'
                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-bold shadow-sm'
                                            : 'border-border text-text-muted hover:border-gray-300'
                                    }`}
                                >
                                    <span>All Products</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
                                        {allProducts.length}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Format Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                            File Format
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormat('json')}
                                className={`p-3.5 rounded-2xl border text-left transition-all ${
                                    format === 'json'
                                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-400'
                                        : 'border-border hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-text-main">
                                        <Server size={16} className="text-emerald-600" />
                                        <span>JSON Format</span>
                                    </div>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                                        Recommended
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    100% lossless with nested variants, image galleries, and PostgreSQL UUID preservation.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormat('csv')}
                                className={`p-3.5 rounded-2xl border text-left transition-all ${
                                    format === 'csv'
                                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-400'
                                        : 'border-border hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 text-sm font-bold text-text-main mb-1">
                                    <FileText size={16} className="text-emerald-600" />
                                    <span>CSV Spreadsheet</span>
                                </div>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    Spreadsheet table view. Openable in Excel / Google Sheets with serialized variants and image lists.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                        <div>
                            <span className="text-sm font-semibold text-text-main block">Include Inactive / Draft Products</span>
                            <span className="text-xs text-text-muted">Export all catalog items regardless of active status</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={(e) => setIncludeInactive(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                    </div>

                    {/* Preview Summary */}
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 text-xs">
                        <div className="flex items-center justify-between font-bold mb-1 text-emerald-900">
                            <span>Ready to Export:</span>
                            <span className="bg-emerald-200/80 px-2.5 py-0.5 rounded-lg text-emerald-900 font-bold">
                                {totalCount} Products
                            </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-emerald-800 mt-1.5">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span>
                                Formatted directly for <strong className="font-semibold">choshmazone_server</strong>'s PostgreSQL database schema and bulk importer.
                            </span>
                        </div>
                    </div>

                    {/* Walkthrough Instructions */}
                    <div className="border border-border/80 rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowInstructions(!showInstructions)}
                            className="w-full px-4 py-2.5 bg-gray-50/70 hover:bg-gray-100/70 flex items-center justify-between text-xs font-bold text-text-main transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <HelpCircle size={14} className="text-emerald-600" />
                                How to import into choshmazone_server
                            </span>
                            <span className="text-text-muted font-normal">{showInstructions ? 'Hide' : 'Show'}</span>
                        </button>

                        {showInstructions && (
                            <div className="p-4 bg-white text-xs text-text-muted space-y-2.5 border-t border-border/60">
                                <div className="flex gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</div>
                                    <div>
                                        <strong className="text-text-main">Download the file</strong> (.json or .csv) using the button below.
                                    </div>
                                </div>
                                <div className="flex gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</div>
                                    <div>
                                        In your new project <strong className="text-text-main">choshmazone_server</strong> admin page, click the new <strong className="text-text-main">Import Products</strong> button.
                                    </div>
                                </div>
                                <div className="flex gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</div>
                                    <div>
                                        Select your downloaded file and click <strong className="text-text-main">Start Import</strong>. All products and variations are automatically stored in PostgreSQL!
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 font-outfit">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isExporting || totalCount === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                <span>Generating {format.toUpperCase()}...</span>
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                <span>Download for Server ({format.toUpperCase()})</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportServerModal;
