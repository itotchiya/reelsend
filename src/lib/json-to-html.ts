
export function renderJsonToHtml(template: any): string {
    if (!template || !template.root) {
        return "<p>Invalid template data</p>";
    }

    const { root } = template;
    // Basic style extraction from root
    const rootStyles = root.data?.style || {};
    const backgroundColor = rootStyles.backgroundColor || "#ffffff";
    const fontFamily = rootStyles.fontFamily === "SERIF" ? "serif" : "sans-serif";
    const textColor = rootStyles.textColor || "#000000";

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                background-color: ${backgroundColor}; 
                font-family: ${fontFamily}; 
                color: ${textColor};
                width: 100%;
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
            }
            img { max-width: 100%; height: auto; display: block; border: 0; outline: none; text-decoration: none; }
            a { color: inherit; text-decoration: underline; }
            .btn { text-decoration: none; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="email-container">
    `;

    // Recursively render children
    const childrenIds = root.data?.childrenIds || [];
    html += renderBlocks(childrenIds, template);

    html += `
        </div>
    </body>
    </html>
    `;

    return html;
}

function renderBlocks(blockIds: string[], template: any): string {
    if (!Array.isArray(blockIds)) return "";

    return blockIds.map(id => {
        const block = template[id];
        if (!block) return "";
        return renderBlock(block, template);
    }).join("");
}

function renderBlock(block: any, template: any): string {
    const { type, data } = block;
    const props = data?.props || {};
    const style = data?.style || {};

    const padding = style.padding ?
        `padding: ${style.padding.top}px ${style.padding.right}px ${style.padding.bottom}px ${style.padding.left}px;` :
        "";

    const blockStyle = [
        padding,
        style.textAlign ? `text-align: ${style.textAlign};` : "",
        style.backgroundColor ? `background-color: ${style.backgroundColor};` : "",
        style.color ? `color: ${style.color};` : "",
        style.fontSize ? `font-size: ${style.fontSize}px;` : "",
        style.fontWeight ? `font-weight: ${style.fontWeight};` : "",
    ].join(" ");

    switch (type) {
        case "Heading":
            const level = props.level || "h2";
            return `<div style="${blockStyle}"><${level} style="margin: 0;">${props.text || ""}</${level}></div>`;

        case "Text":
            return `<div style="${blockStyle} line-height: 1.5;">${props.text || ""}</div>`;

        case "Button":
            const btnBg = props.buttonBackgroundColor || "#000000";
            const btnColor = props.buttonTextColor || "#ffffff";
            const btnStyle = `
                background-color: ${btnBg}; 
                color: ${btnColor}; 
                padding: 12px 24px; 
                border-radius: ${props.buttonStyle === "pill" ? "50px" : props.buttonStyle === "rounded" ? "4px" : "0px"};
                text-decoration: none;
                display: inline-block;
                font-weight: bold;
            `;
            return `
                <div style="${blockStyle}">
                    <a href="${props.url || "#"}" class="btn" style="${btnStyle}">${props.text || "Button"}</a>
                </div>
            `;

        case "Image":
            const imgAlign = props.contentAlignment === "center" ? "margin: 0 auto;" :
                props.contentAlignment === "right" ? "margin-left: auto;" : "";
            return `
                <div style="${blockStyle}">
                    <img src="${props.url}" alt="${props.alt || ""}" style="${imgAlign} max-width: 100%; height: auto;" />
                </div>
            `;

        case "Divider":
            const lineColor = props.lineColor || "#e5e7eb";
            const lineHeight = props.lineHeight || 1;
            return `
                <div style="${blockStyle}">
                    <hr style="border: 0; border-top: ${lineHeight}px solid ${lineColor}; margin: 0;" />
                </div>
            `;

        case "Spacer":
            return `<div style="height: ${props.height || 16}px;"></div>`;

        case "Avatar":
            const size = props.size || 64;
            const radius = props.shape === "circle" ? "50%" : "4px";
            return `
                <div style="${blockStyle}">
                   <img src="${props.imageUrl || `https://placehold.co/${size}x${size}`}" 
                        style="width: ${size}px; height: ${size}px; border-radius: ${radius}; object-fit: cover; display: inline-block;" />
                </div>
            `;

        case "Container":
            return `
                <div style="${blockStyle}">
                    ${renderBlocks(props.childrenIds || [], template)}
                </div>
            `;

        case "ColumnsContainer":
            const cols = props.columns || [];
            if (cols.length === 0) return "";

            // Simplified table-based layout for better email compatibility in preview
            const colWidth = 100 / cols.length;

            let colsHtml = `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="${blockStyle}">
                    <tr>
            `;

            cols.forEach((col: any) => {
                colsHtml += `
                    <td width="${colWidth}%" valign="top" style="padding: 0 ${props.columnsGap ? props.columnsGap / 2 : 0}px;">
                        ${renderBlocks(col.childrenIds || [], template)}
                    </td>
                `;
            });

            colsHtml += `
                    </tr>
                </table>
            `;
            return colsHtml;

        default:
            return "";
    }
}
