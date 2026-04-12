/**
 * @param {string} typedNotes
 * @param {{ id: string; name: string; text: string }[]} uploads
 */
export function buildStudyMaterialText(typedNotes, uploads) {
  const parts = [];
  for (const u of uploads) {
    const body = (u.text || "").trim();
    if (body) {
      parts.push(`### Uploaded file: ${u.name}\n${body}`);
    }
  }
  const typed = (typedNotes || "").trim();
  if (typed) {
    parts.push(`### Typed or pasted notes\n${typed}`);
  }
  return parts.join("\n\n---\n\n");
}
