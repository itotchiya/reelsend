import { EmailDocument, Row, Column, Block } from "./types";

export function exportToHtml(doc: EmailDocument): string {
    const { settings, rows } = doc;

    const rowHtml = rows.map(renderRow).join("\n");

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email</title>
    <style type="text/css">
        body { margin: 0; padding: 0; min-width: 100%; font-family: ${settings.fontFamily}; color: ${settings.textColor}; }
        img { display: block; height: auto; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        @media only screen and (max-width: 600px) {
            .column { display: block !important; width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${settings.backgroundColor};">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: ${settings.padding.top}px ${settings.padding.right}px ${settings.padding.bottom}px ${settings.padding.left}px;">
                <table border="0" cellpadding="0" cellspacing="0" width="${settings.maxWidth}" style="max-width: ${settings.maxWidth}px; background-color: ${settings.canvasColor};">
                    ${rowHtml}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

function renderRow(row: Row): string {
    return `
    <tr>
        <td style="padding: ${row.styles.padding || "20px 0"}; background-color: ${row.styles.backgroundColor || "transparent"};">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    ${row.columns.map(renderColumn).join("")}
                </tr>
            </table>
        </td>
    </tr>
  `;
}

function renderColumn(col: Column): string {
    const blockHtml = col.blocks.map(renderBlock).join("");
    return `
    <td class="column" width="${col.width}%" valign="${col.styles.verticalAlign || "top"}" style="padding: ${col.styles.padding || "0"}; background-color: ${col.styles.backgroundColor || "transparent"};">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            ${blockHtml}
        </table>
    </td>
  `;
}

function renderBlock(block: Block): string {
    let content = "";

    switch (block.type) {
        case "heading":
            content = `<h1 style="margin: 0; font-size: ${block.styles.fontSize || 32}px; text-align: ${block.content.align || "left"};">${block.content.text}</h1>`;
            break;
        case "paragraph":
            content = `<p style="margin: 0; text-align: ${block.content.align || "left"}; line-height: 1.5;">${block.content.text}</p>`;
            break;
        case "button":
            content = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="${block.content.align || "center"}">
                    <a href="${block.content.url || "#"}" style="display: inline-block; padding: 12px 24px; background-color: ${block.content.backgroundColor || "#3b82f6"}; color: ${block.content.textColor || "#ffffff"}; border-radius: ${block.content.borderRadius || 4}px; text-decoration: none; font-weight: 600;">${block.content.text}</a>
                </td>
            </tr>
        </table>
      `;
            break;
        case "image":
            content = `<img src="${block.content.src}" alt="${block.content.alt || ""}" width="${block.content.width || "100"}%" style="display: block; width: ${block.content.width || "100"}%; height: auto; margin: ${block.content.align === "center" ? "0 auto" : "0"};" />`;
            break;
        case "divider":
            content = `<div style="padding: 20px 0;"><hr style="border: none; border-top: ${block.content.thickness || 1}px solid ${block.content.color || "#e5e7eb"};" /></div>`;
            break;
        case "social":
            content = `
        <div style="text-align: ${block.content.align || "center"};">
            ${(block.content.icons || []).map((icon: any) => `
                <a href="${icon.url}" style="display: inline-block; margin: 0 5px; text-decoration: none;">
                    <div style="width: 32px; height: 32px; background-color: #333; color: #ffffff; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">${icon.name.substring(0, 1)}</div>
                </a>
            `).join("")}
        </div>`;
            break;
        case "menu":
            content = `
        <div style="text-align: ${block.content.align || "center"};">
            ${(block.content.items || []).map((item: any) => `
                <a href="${item.url}" style="display: inline-block; margin: 0 10px; color: ${block.content.textColor || "#333"}; text-decoration: none; font-size: 14px;">${item.label}</a>
            `).join("")}
        </div>`;
            break;
        case "video":
            content = `
        <div style="text-align: ${block.content.align || "center"};">
            <a href="${block.content.url || "#"}" style="display: inline-block; position: relative;">
                <img src="${block.content.thumbnail}" alt="Video" width="100%" style="display: block; border-radius: 8px;" />
            </a>
        </div>`;
            break;
        case "html":
            content = `<div>${block.content.html || ""}</div>`;
            break;
    }

    return `
    <tr>
        <td style="padding: ${block.styles.padding || "10px 0"};">
            ${content}
        </td>
    </tr>
  `;
}
