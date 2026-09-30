/**
 * Browser-side, page-aware PDF text extraction (pdf.js).
 * Each page keeps its page number so answers can cite evidence.
 */

export type PdfPage = {
  page_number: number;
  text: string;
  empty: boolean;
};

export type PdfDocumentText = {
  fileName: string;
  pageCount: number;
  pages: PdfPage[];
  rawData?: Uint8Array;
};

export const NO_TEXT = "No extractable text";

export async function extractPdfPages(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfDocumentText> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await file.arrayBuffer();
  // Clone a copy for extraction so worker transfer does not detach the viewer buffer
  const dataForExtraction = new Uint8Array(arrayBuffer.slice(0));
  const dataForViewer = new Uint8Array(arrayBuffer);

  const verbosityLevel = pdfjs.VerbosityLevel?.ERRORS ?? 0;
  const doc = await pdfjs.getDocument({
    data: dataForExtraction,
    verbosity: verbosityLevel,
  }).promise;

  const pages: PdfPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/[ \t\u00a0]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .trim();
      const empty = text.length < 2;
      pages.push({ page_number: i, text: empty ? NO_TEXT : text, empty });
    } catch {
      pages.push({ page_number: i, text: NO_TEXT, empty: true });
    }
    onProgress?.(i, doc.numPages);
  }

  return { fileName: file.name, pageCount: doc.numPages, pages, rawData: dataForViewer };
}
