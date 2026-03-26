/**
 * pdfjsWorker.ts (SAFE for Next 16 + Turbopack)
 * - usa pdfjs-dist/webpack.mjs
 * - configura workerSrc como URL (CDN) em vez de "?url"
 */
export async function getPdfjs() {
  const pdfjs: any = await import("pdfjs-dist/webpack.mjs");

  // Evita erro "No GlobalWorkerOptions.workerSrc specified"
  // e evita o bug do Turbopack com "?url"
  const v = pdfjs?.version || "3.11.174";
  if (pdfjs?.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${v}/pdf.worker.min.js`;
  }

  return pdfjs;
}

