// ====================================================================
// TaskFlow Manager — Client-Side Image Compression & Optimization Engine
// Reduces 10-15MB construction site photos down to ~200-400KB without detail loss
// ====================================================================

export interface CompressionResult {
  file_name: string;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  original_size_kb: number;
  compressed_size_kb: number;
  saved_percent: number;
  is_compressed: boolean;
}

/**
 * Compresses an uploaded image file on the browser client before storage
 * @param file The raw browser File
 * @param maxWidth Max dimension width in pixels (default 1600)
 * @param maxHeight Max dimension height in pixels (default 1600)
 * @param quality Compression quality 0.0 to 1.0 (default 0.82)
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  // If not an image (e.g. PDF, CAD, Excel), return file as Base64 data URL directly
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = reader.result as string;
        let fileType = "other";
        if (file.type.includes("pdf") || file.name.endsWith(".pdf")) fileType = "pdf";
        else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx") || file.name.endsWith(".csv")) fileType = "spreadsheet";
        else if (file.name.endsWith(".dwg") || file.name.endsWith(".dxf")) fileType = "cad";

        resolve({
          file_name: file.name,
          file_type: fileType,
          file_url: fileUrl,
          original_size_kb: originalSizeKb,
          compressed_size_kb: originalSizeKb,
          saved_percent: 0,
          is_compressed: false,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Optimize and compress image using Canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            file_name: file.name,
            file_type: "image",
            file_url: event.target?.result as string,
            original_size_kb: originalSizeKb,
            compressed_size_kb: originalSizeKb,
            saved_percent: 0,
            is_compressed: false,
          });
          return;
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP / JPEG
        const outputMime = file.type === "image/png" ? "image/png" : "image/jpeg";
        const compressedDataUrl = canvas.toDataURL(outputMime, quality);

        // Estimate compressed size from Base64
        const stringLength = compressedDataUrl.length - "data:image/jpeg;base64,".length;
        const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383415;
        const compressedSizeKb = Math.max(1, Math.round(sizeInBytes / 1024));

        const savedPercent = Math.max(
          0,
          Math.round(((originalSizeKb - compressedSizeKb) / (originalSizeKb || 1)) * 100)
        );

        resolve({
          file_name: file.name,
          file_type: "image",
          file_url: compressedDataUrl,
          thumbnail_url: compressedDataUrl,
          original_size_kb: originalSizeKb,
          compressed_size_kb: compressedSizeKb,
          saved_percent: savedPercent,
          is_compressed: true,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
