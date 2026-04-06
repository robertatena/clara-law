import pdf from "pdf-parse";

export const runtime = "nodejs";

type DocOut = {
  name: string;
  ok: boolean;
  pages?: number;
  chars?: number;
  text?: string;
  error?: string;
};

function capText(s: string, maxChars = 200000) {
  if (!s) return "";
  return s.length > maxChars ? s.slice(0, maxChars) : s;
}

async function extractWithPdfParse(buf: Buffer) {
  const result = await pdf(buf);
  const text = (result.text || "").trim();
  return { text, pages: result.numpages ?? undefined };
}

// Fallback mais tolerante para PDFs "quebrados" (bad XRef entry etc.)
async function extractWithPdfJs(buf: Buffer) {
  const pdfjs = await import("pdfjs-dist/webpack.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
  const doc = await loadingTask.promise;

  let full = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
  .map((it) => ("str" in it && typeof (it as any).str === "string" ? (it as any).str : ""))
  .filter(Boolean);
    full += strings.join(" ") + "\n";
  }

  return { text: full.trim(), pages: doc.numPages };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const files = (form.getAll("files") as File[]) || [];
    const single = form.get("file") as File | null;
    const list: File[] = files.length ? files : (single ? [single] : []);

    if (!list.length) {
      return Response.json(
        { ok: false, error: "Nenhum arquivo enviado. Use 'files' (mï¿½ltiplos) ou 'file' (ï¿½nico)." },
        { status: 400 }
      );
    }

    const documents: DocOut[] = [];

    for (const f of list) {
      try {
        if (!f || f.type !== "application/pdf") {
          documents.push({ name: f?.name ?? "arquivo", ok: false, error: "Arquivo nï¿½o ï¿½ PDF." });
          continue;
        }

        const ab = await f.arrayBuffer();
        const buf = Buffer.from(ab);

        let text = "";
        let pages: number | undefined;

        // 1) tenta pdf-parse (rï¿½pido)
        try {
          const r1 = await extractWithPdfParse(buf);
          text = r1.text;
          pages = r1.pages;
        } catch (e1) {
          // 2) fallback pdfjs (tolerante)
          const r2 = await extractWithPdfJs(buf);
          text = r2.text;
          pages = r2.pages;
        }

        if (!text) {
          documents.push({
            name: f.name,
            ok: false,
            pages,
            chars: 0,
            error: "PDF sem texto extraï¿½vel (provavelmente escaneado). Envie um PDF pesquisï¿½vel ou rode OCR."
          });
          continue;
        }

        const capped = capText(text);
        documents.push({
          name: f.name,
          ok: true,
          pages,
          chars: capped.length,
          text: capped
        });
      } catch (e: unknown) {
        documents.push({
          name: f?.name ?? "arquivo",
          ok: false,
          error: e instanceof Error ? e.message : String(e) ?? "Falha ao processar PDF."
        });
      }
    }

    return Response.json({ ok: true, documents }, { status: 200 });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) ?? "Erro interno em /api/extract" }, { status: 500 });
  }
}

export async function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}



