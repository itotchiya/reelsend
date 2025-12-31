export type BlockType =
    | "heading"
    | "paragraph"
    | "image"
    | "gif"
    | "button"
    | "divider"
    | "social"
    | "menu"
    | "table"
    | "video"
    | "html";

export interface Block {
    id: string;
    type: BlockType;
    content: any;
    styles: Record<string, any>;
    responsive?: Record<string, any>;
}

export interface Column {
    id: string;
    width: number; // Percentage
    blocks: Block[];
    styles: Record<string, any>;
}

export interface Row {
    id: string;
    columns: Column[];
    styles: Record<string, any>;
}

export interface EmailSettings {
    backgroundColor: string;
    canvasColor: string;
    maxWidth: number;
    fontFamily: string;
    textColor: string;
    padding: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

export interface EmailDocument {
    settings: EmailSettings;
    rows: Row[];
}
