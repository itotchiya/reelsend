"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { EmailDocument, Row, Block, Column } from "./types";
import { createInitialRow, createInitialBlock } from "./utils";

interface EditorState {
    document: EmailDocument;
    selectedId: string | null;
    draggedId: string | null;
    history: EmailDocument[];
    future: EmailDocument[];
}

type EditorAction =
    | { type: "SET_DOCUMENT"; document: EmailDocument }
    | { type: "SELECT_ELEMENT"; id: string | null }
    | { type: "SET_DRAGGED"; id: string | null }
    | { type: "UPDATE_GLOBAL_SETTINGS"; settings: Partial<EmailDocument["settings"]> }
    | { type: "ADD_ROW"; layout: string }
    | { type: "ADD_BLOCK"; blockType: string; targetColumnId?: string }
    | { type: "UNDO" }
    | { type: "REDO" };

const initialState: EditorState = {
    document: {
        settings: {
            backgroundColor: "#f5f5f5",
            canvasColor: "#ffffff",
            maxWidth: 600,
            fontFamily: "Inter, sans-serif",
            textColor: "#333333",
            padding: { top: 40, bottom: 40, left: 20, right: 20 },
        },
        rows: [],
    },
    selectedId: null,
    draggedId: null,
    history: [],
    future: [],
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case "SET_DOCUMENT":
            return {
                ...state,
                document: action.document,
                history: [...state.history.slice(-19), state.document],
                future: [],
            };
        case "SELECT_ELEMENT":
            return { ...state, selectedId: action.id };
        case "SET_DRAGGED":
            return { ...state, draggedId: action.id };
        case "UPDATE_GLOBAL_SETTINGS":
            return {
                ...state,
                document: {
                    ...state.document,
                    settings: { ...state.document.settings, ...action.settings },
                },
                history: [...state.history.slice(-19), state.document],
                future: [],
            };
        case "UNDO":
            if (state.history.length === 0) return state;
            const prev = state.history[state.history.length - 1];
            return {
                ...state,
                document: prev,
                history: state.history.slice(0, -1),
                future: [state.document, ...state.future.slice(0, 19)],
            };
        case "REDO":
            if (state.future.length === 0) return state;
            const next = state.future[0];
            return {
                ...state,
                document: next,
                history: [...state.history.slice(-19), state.document],
                future: state.future.slice(1),
            };
        case "ADD_ROW": {
            const colCount = parseInt(action.layout.split("-")[0]) || 1;
            const newRow = createInitialRow(colCount);
            return {
                ...state,
                document: {
                    ...state.document,
                    rows: [...state.document.rows, newRow],
                },
                history: [...state.history.slice(-19), state.document],
                future: [],
            };
        }
        case "ADD_BLOCK": {
            const newDoc = { ...state.document };
            // If no target column, find the last one or create a 1-col row
            let targetCol: any = null;
            if (action.targetColumnId) {
                newDoc.rows.forEach(r => r.columns.forEach(c => {
                    if (c.id === action.targetColumnId) targetCol = c;
                }));
            }

            if (!targetCol && newDoc.rows.length > 0) {
                const lastRow = newDoc.rows[newDoc.rows.length - 1];
                targetCol = lastRow.columns[0];
            }

            if (!targetCol) {
                const newRow = createInitialRow(1);
                newDoc.rows.push(newRow);
                targetCol = newRow.columns[0];
            }

            targetCol.blocks.push(createInitialBlock(action.blockType as any));

            return {
                ...state,
                document: newDoc,
                history: [...state.history.slice(-19), state.document],
                future: [],
            };
        }
        default:
            return state;
    }
}

const EditorContext = createContext<{
    state: EditorState;
    dispatch: React.Dispatch<EditorAction>;
} | null>(null);

export function EmailEditorProvider({ children }: { children: ReactNode }): React.ReactNode {
    const [state, dispatch] = useReducer(editorReducer, initialState);

    return (
        <EditorContext.Provider value={{ state, dispatch }}>
            {children}
        </EditorContext.Provider>
    );
}

export function useEmailEditorStore() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useEmailEditorStore must be used within an EmailEditorProvider");
    }

    const { state, dispatch } = context;

    const updateGlobalSettings = (settings: Partial<EmailDocument["settings"]>) => {
        dispatch({ type: "UPDATE_GLOBAL_SETTINGS", settings });
    };

    return {
        ...state,
        email: state.document,
        updateGlobalSettings,
        dispatch,
    };
}
