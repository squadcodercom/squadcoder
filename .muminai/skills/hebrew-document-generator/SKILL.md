---
name: hebrew-document-generator
description: Generate professional Hebrew documents (PDF, DOCX, PPTX) with correct right-to-left layout and bidirectional text. Use whenever the user asks for a Hebrew PDF/document/invoice/contract/presentation.
---

# Hebrew Document Generator

Produce polished Hebrew documents that are correctly **right-to-left (RTL)** with proper
bidirectional handling of mixed Hebrew/Latin/numbers. Never emit a left-to-right Hebrew document.

> This is original MuminAI guidance. Skills-IL publishes a richer MIT-licensed
> `hebrew-document-generator`; see `SKILLS_ATTRIBUTION.md` to vendor it.

## Choose the path by output format

### PDF (recommended: HTML → WeasyPrint)
The most reliable RTL path. Build an HTML document with `dir="rtl"` and render with WeasyPrint —
the browser bidi algorithm handles Hebrew correctly, and Hebrew fonts embed cleanly.

```python
# pip install weasyprint
from weasyprint import HTML

html = """
<!doctype html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: "Heebo", "Rubik", "Noto Sans Hebrew", sans-serif; direction: rtl; text-align: right; line-height: 1.6; }
  /* keep numbers, codes, emails left-to-right inside RTL text */
  .ltr { unicode-bidi: isolate; direction: ltr; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
</style></head>
<body>
  <h1>חשבונית</h1>
  <p>שלום, להלן פירוט החיוב עבור מספר הזמנה <span class="ltr">#10293</span>.</p>
</body></html>
"""
HTML(string=html).write_pdf("output.pdf")
```

Rules: set `dir="rtl"` + `text-align: right` on the body; wrap numbers / order-IDs / emails /
URLs / code in `<span class="ltr">` (`unicode-bidi: isolate`) so they don't reorder; use a
Hebrew-capable font.

### PDF (alternative: ReportLab)
If you must use ReportLab, shape the text first, because ReportLab does not do bidi:
```python
# pip install reportlab python-bidi
from bidi.algorithm import get_display
shaped = get_display("שלום עולם")   # logical -> visual order
# draw `shaped` right-aligned with a registered Hebrew TTF (e.g. Heebo)
```

### DOCX (python-docx)
```python
# pip install python-docx
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
doc = Document()
p = doc.add_paragraph("שלום עולם")
p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
# set paragraph bidi so Word treats it as RTL
p.paragraph_format.element.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bidi', '1')
doc.save("output.docx")
```

### PPTX (python-pptx)
Right-align text frames and set paragraph direction to RTL; use a Hebrew font on each run.

## Always
- Right-align body text; keep LTR islands (numbers, codes, URLs, Latin) isolated.
- Use a Hebrew-capable font and embed it in PDFs.
- For invoices/contracts, mirror the layout (labels on the right, values flowing right-to-left).
- Verify visually: open the result and confirm punctuation sits at the correct (left) end of lines.
