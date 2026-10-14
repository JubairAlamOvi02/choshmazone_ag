/**
 * Automatic Client-Side WebP Image Compressor
 * Reduces images to WebP under target size (default ~100 KB) before uploading to Supabase.
 * Drastically reduces Supabase Storage Cached Egress bandwidth.
 */

export async function compressImage(file, options = {}) {
    // If not a file or blob, or is an SVG / GIF, pass through
    if (!file || !(file instanceof Blob)) return file;
    
    const type = file.type || '';
    if (type === 'image/svg+xml' || type === 'image/gif') {
        return file;
    }

    const {
        maxSizeBytes = 100 * 1024, // 100 KB target
        maxWidth = 1200,
        maxHeight = 1200,
        initialQuality = 0.82,
        minQuality = 0.55,
        format = 'image/webp'
    } = options;

    // If file is already webp and smaller than target size, return it
    if (type === 'image/webp' && file.size <= maxSizeBytes) {
        return file;
    }

    try {
        const img = await loadImage(file);
        
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio-preserved dimensions
        let scale = Math.min(1, maxWidth / width, maxHeight / height);
        let targetWidth = Math.max(1, Math.round(width * scale));
        let targetHeight = Math.max(1, Math.round(height * scale));

        let canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        let ctx = canvas.getContext('2d', { alpha: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Iterative compression to stay under maxSizeBytes
        let currentQuality = initialQuality;
        let blob = await canvasToBlob(canvas, format, currentQuality);

        // Quality reduction steps if over max size
        const qualitySteps = [0.75, 0.68, 0.60, minQuality];
        let stepIdx = 0;

        while (blob.size > maxSizeBytes && stepIdx < qualitySteps.length) {
            currentQuality = qualitySteps[stepIdx];
            blob = await canvasToBlob(canvas, format, currentQuality);
            stepIdx++;
        }

        // If still over 100KB after lowest quality, scale down slightly
        if (blob.size > maxSizeBytes) {
            const downscaleFactor = 0.82;
            targetWidth = Math.max(1, Math.round(targetWidth * downscaleFactor));
            targetHeight = Math.max(1, Math.round(targetHeight * downscaleFactor));

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx = canvas.getContext('2d', { alpha: true });
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            blob = await canvasToBlob(canvas, format, minQuality);
        }

        // Generate clean webp filename
        const originalName = file.name || 'image.jpg';
        const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const newFileName = `${baseName}.webp`;

        const compressedFile = new File([blob], newFileName, {
            type: format,
            lastModified: Date.now()
        });

        const savedPct = file.size > 0 ? Math.round((1 - compressedFile.size / file.size) * 100) : 0;
        console.log(
            `%c[ImageCompressor] %c${file.name} (${(file.size / 1024).toFixed(1)} KB) ➔ %c${newFileName} (${(compressedFile.size / 1024).toFixed(1)} KB) %c[${savedPct}% saved]`,
            'color: #3b82f6; font-weight: bold;',
            'color: #ef4444;',
            'color: #10b981; font-weight: bold;',
            'color: #8b5cf6;'
        );

        return compressedFile;
    } catch (err) {
        console.warn('[ImageCompressor] Compression skipped due to error, using original file:', err);
        return file;
    }
}

export async function compressImages(files, options = {}) {
    if (!Array.isArray(files)) return [];
    return Promise.all(files.map(f => compressImage(f, options)));
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
}

function canvasToBlob(canvas, format, quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, format, quality);
    });
}
