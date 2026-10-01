import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, CheckCircle2, HelpCircle, Layers, Image, Info, ExternalLink } from 'lucide-react';
import { downloadWooCommerceCsv, generateWooCommerceCsv } from '../../lib/woocommerceExporter';
import { useToast } from '../../context/ToastContext';

const ExportWooCommerceModal = ({ isOpen, onClose, allProducts = [], selectedProductIds = [] }) => {
    const { showToast } = useToast();
    const hasSelected = selectedProductIds && selectedProductIds.length > 0;

    const [scope, setScope] = useState(hasSelected ? 'selected' : 'all');
    const [mode, setMode] = useState('variable');
    const [includeInactive, setIncludeInactive] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    if (!isOpen) return null;

    const targetProducts = (scope === 'selected' && hasSelected)
        ? allProducts.filter(p => selectedProductIds.includes(p.id))
        : allProducts;

    // Calculate preview counts
    const previewData = generateWooCommerceCsv(targetProducts, {
        mode,
        includeInactive
    });

    const handleDownload = () => {
        try {
            setIsExporting(true);
            const result = downloadWooCommerceCsv(targetProducts, {
                mode,
                includeInactive
            });

            if (showToast) {
                showToast(`Exported ${result.productCount} products (${result.totalRows} rows) for WooCommerce!`, 'success');
            }
            setTimeout(() => {
                setIsExporting(false);
                onClose();
            }, 600);
        } catch (err) {
            console.error('Export failed:', err);
            if (showToast) {
                showToast('Failed to export WooCommerce CSV.', 'error');
            }
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header Badge & Close */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-text-main font-outfit">Export to WordPress / WooCommerce</h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                    WooCommerce
                                </span>
                            </div>
                            <p className="text-xs text-text-muted font-outfit mt-0.5">
                                Download an import-ready CSV with all specifications, variants, and image URLs.
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
                                            ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
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
                                            ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
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

                    {/* Mode Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                            Product Type Structure
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('variable')}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    mode === 'variable'
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 text-sm font-bold text-text-main mb-1">
                                    <Layers size={15} className="text-primary" />
                                    <span>Variable Products</span>
                                </div>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    Parent items with color/size variation dropdowns in WooCommerce. (Recommended)
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode('simple')}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    mode === 'simple'
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 text-sm font-bold text-text-main mb-1">
                                    <CheckCircle2 size={15} className="text-primary" />
                                    <span>Standalone Products</span>
                                </div>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    Each variation is exported as an independent, individual simple product.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                            <span className="text-sm font-semibold text-text-main block">Include Inactive / Draft Products</span>
                            <span className="text-xs text-text-muted">Export all catalog items regardless of active status</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={(e) => setIncludeInactive(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                    </div>

                    {/* Preview Summary */}
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-emerald-950 text-xs">
                        <div className="flex items-center justify-between font-bold mb-1.5 text-emerald-900">
                            <span>Ready to Export:</span>
                            <span className="bg-emerald-200/60 px-2 py-0.5 rounded-lg text-emerald-800">
                                {previewData.productCount} Products ({previewData.totalRows} CSV Rows)
                            </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-emerald-800 mt-1">
                            <Image size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span>
                                All product image URLs are hosted online. WordPress will automatically download and add them to your WP Media Library during import.
                            </span>
                        </div>
                    </div>

                    {/* Quick Walkthrough Collapsible */}
                    <div className="border border-border/80 rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowInstructions(!showInstructions)}
                            className="w-full px-4 py-2.5 bg-gray-50/70 hover:bg-gray-100/70 flex items-center justify-between text-xs font-bold text-text-main transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <HelpCircle size={14} className="text-primary" />
                                How to import in WordPress (3 Steps)
                            </span>
                            <span className="text-text-muted font-normal">{showInstructions ? 'Hide' : 'Show'}</span>
                        </button>

                        {showInstructions && (
                            <div className="p-4 bg-white text-xs text-text-muted space-y-2.5 border-t border-border/60">
                                <div className="flex gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">1</div>
                                    <div>
                                        <strong className="text-text-main">Download the CSV file</strong> by clicking the button below.
                                    </div>
                                </div>
                                <div className="flex gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">2</div>
                                    <div>
                                        In WordPress Admin, go to <strong className="text-text-main">Products → All Products</strong> and click the <strong className="text-text-main">Import</strong> button at the top.
                                    </div>
                                </div>
                                <div className="flex gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">3</div>
                                    <div>
                                        Choose your CSV file, click <strong className="text-text-main">Continue</strong>, leave column mapping as default (all columns match automatically), and click <strong className="text-text-main">Run the importer</strong>.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
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
                        disabled={isExporting || previewData.productCount === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                <span>Generating CSV...</span>
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                <span>Download WooCommerce CSV</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportWooCommerceModal;
