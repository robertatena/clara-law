import * as pdfjsLib from "pdfjs-dist/webpack.mjs";

// evita warning no Node (worker)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = undefined;

export async function extractPdfText(buffer: Buffer) {
  try {
    const loadingTask = (pdfjsLib as any).getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = (content.items || [])
        .map((item: any) => item?.str || "")
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("extractPdfText error", error);
    return "";
  }
}
