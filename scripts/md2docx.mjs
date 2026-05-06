import { readFileSync, writeFileSync } from "fs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
} from "docx";

const md = readFileSync("README.md", "utf-8");
const lines = md.split("\n");

const children = [];

function isBold(text) {
  return /\*\*([^*]+)\*\*/.test(text);
}
function parseInline(text) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else if (part.startsWith("`") && part.endsWith("`")) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: "Consolas", size: 20 }));
    } else if (/^\[.*\]\(.*\)$/.test(part)) {
      const m = part.match(/^\[(.*)\]\((.*)\)$/);
      runs.push(new TextRun({ text: m[1], style: "Hyperlink" }));
    } else {
      runs.push(new TextRun({ text: part }));
    }
  }
  return runs;
}

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Empty line
  if (line.trim() === "") {
    i++;
    continue;
  }

  // Code block
  if (line.startsWith("```")) {
    const lang = line.slice(3).trim();
    const codeLines = [];
    i++;
    while (i < lines.length && !lines[i].startsWith("```")) {
      codeLines.push(lines[i]);
      i++;
    }
    i++; // skip closing ```
    for (const cl of codeLines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cl, font: "Consolas", size: 18 })],
          spacing: { before: 0, after: 0 },
        })
      );
    }
    continue;
  }

  // Table: headers
  if (line.startsWith("|") && lines[i + 2] && lines[i + 2].startsWith("|") && lines[i + 2].includes("---")) {
    const headerLine = line;
    const sepLine = lines[i + 2];
    if (sepLine.startsWith("|") && sepLine.includes("---")) {
      const headers = headerLine.split("|").filter(s => s.trim() !== "");
      const alignMap = sepLine.split("|").filter(s => s.trim() !== "").map(s => {
        if (s.startsWith(":") && s.endsWith(":")) return "center";
        if (s.endsWith(":")) return "right";
        return "left";
      });
      const rows = [headers];
      i += 2; // skip header + sep
      i++; // move to first data row
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter(s => s.trim() !== ""));
        i++;
      }
      // Build table
      const tableRows = rows.map((row, ri) => {
        const cells = row.map((cell, ci) => {
          const align = alignMap[ci] === "center" ? AlignmentType.CENTER
            : alignMap[ci] === "right" ? AlignmentType.RIGHT
            : AlignmentType.LEFT;
          return new TableCell({
            children: [new Paragraph({ children: parseInline(cell.trim()), alignment: align })],
            ...(ri === 0 ? { shading: { fill: "D9E2F3" } } : {}),
          });
        });
        return new TableRow({ children: cells });
      });
      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
      continue;
    }
  }

  // Headings
  if (line.startsWith("## ")) {
    children.push(
      new Paragraph({
        children: parseInline(line.slice(3)),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 120 },
      })
    );
    i++;
    continue;
  }
  if (line.startsWith("### ")) {
    children.push(
      new Paragraph({
        children: parseInline(line.slice(4)),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
      })
    );
    i++;
    continue;
  }

  // Unordered list
  if (/^[\s]*[-*]\s/.test(line)) {
    const items = [];
    while (i < lines.length && /^[\s]*[-*]\s/.test(lines[i])) {
      items.push(lines[i].replace(/^[\s]*[-*]\s/, ""));
      i++;
    }
    for (const item of items) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "• " }), ...parseInline(item)],
          spacing: { before: 40, after: 40 },
          bullet: { level: 0 },
        })
      );
    }
    continue;
  }

  // Ordered list
  if (/^\d+\.\s/.test(line)) {
    const items = [];
    while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
      items.push({ num: items.length + 1, text: lines[i].replace(/^\d+\.\s/, "") });
      i++;
    }
    for (const item of items) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${item.num}. ` }), ...parseInline(item.text)],
          spacing: { before: 40, after: 40 },
        })
      );
    }
    continue;
  }

  // Blockquote
  if (line.startsWith("> ")) {
    const quoteLines = [];
    while (i < lines.length && lines[i].startsWith("> ")) {
      quoteLines.push(lines[i].slice(2));
      i++;
    }
    for (const ql of quoteLines) {
      children.push(
        new Paragraph({
          children: parseInline(ql),
          indent: { left: 720 },
          spacing: { before: 40, after: 40 },
          border: { left: { style: BorderStyle.SINGLE, size: 4, color: "4F81BD" } },
        })
      );
    }
    continue;
  }

  // Horizontal rule
  if (/^[-*_]{3,}$/.test(line.trim())) {
    children.push(
      new Paragraph({
        children: [],
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "999999" } },
        spacing: { before: 200, after: 200 },
      })
    );
    i++;
    continue;
  }

  // Regular paragraph
  children.push(
    new Paragraph({
      children: parseInline(line),
      spacing: { before: 60, after: 60 },
    })
  );
  i++;
}

// Title
children.unshift(
  new Paragraph({
    children: [new TextRun({ text: "拼豆图纸生成器", bold: true, size: 48 })],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  })
);

const doc = new Document({ sections: [{ children }] });
const buffer = await Packer.toBuffer(doc);
writeFileSync("README.docx", buffer);
console.log("Done: README.docx created");
