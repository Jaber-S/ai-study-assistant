const MAX_FILE_BYTES = 12 * 1024 * 1024;

function assertSupported(file) {
  const n = file.name.toLowerCase();
  if (!n.endsWith(".pdf") && !n.endsWith(".txt")) {
    throw new Error("Only .pdf and .txt files are supported.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `“${file.name}” is too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`
    );
  }
}

async function extractPdfText(file) {
  const { pdfjsLib } = await import("./pdfjsClient.js");
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(line);
  }
  return parts.join("\n\n");
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  assertSupported(file);
  if (file.name.toLowerCase().endsWith(".txt")) {
    return file.text();
  }
  return extractPdfText(file);
}

export function isSupportedExtension(filename) {
  const n = filename.toLowerCase();
  return n.endsWith(".pdf") || n.endsWith(".txt");
}
