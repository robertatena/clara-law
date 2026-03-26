export async function extractPdfTextClient(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text || "";
  } catch {
    return "";
  }
}
