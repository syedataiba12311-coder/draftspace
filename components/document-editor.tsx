"use client";

import {
    EditorContent,
    useEditor,
    useEditorState,
} from "@tiptap/react";
import type {
    Editor,
    JSONContent,
} from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { saveDocument } from "@/app/document/actions";

type SaveStatus =
    | "saved"
    | "saving"
    | "error";

type DocumentEditorProps = {
    documentId: string;
    initialTitle: string;
    initialContent: JSONContent;
    canEdit: boolean;
    isOwner: boolean;
};

function ToolbarButton({
    active = false,
    disabled = false,
    title,
    children,
    onClick,
}: {
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`
        flex h-9 min-w-9 items-center justify-center
        rounded-md px-2 text-sm font-medium transition
        ${active
                    ? "bg-blue-100 text-blue-700"
                    : "text-zinc-700 hover:bg-zinc-100"
                }
        disabled:cursor-not-allowed
        disabled:opacity-40
      `}
        >
            {children}
        </button>
    );
}

function EditorToolbar({
    editor,
    canEdit,
}: {
    editor: Editor;
    canEdit: boolean;
}) {
    const state = useEditorState({
        editor,

        selector: ({ editor }) => ({
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),

            heading1: editor.isActive(
                "heading",
                { level: 1 }
            ),

            heading2: editor.isActive(
                "heading",
                { level: 2 }
            ),

            bulletList:
                editor.isActive("bulletList"),

            orderedList:
                editor.isActive("orderedList"),
        }),
    });

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-white px-4 py-2">
            <ToolbarButton
                title="Bold"
                active={state.bold}
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleBold()
                        .run()
                }
            >
                <strong>B</strong>
            </ToolbarButton>

            <ToolbarButton
                title="Italic"
                active={state.italic}
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleItalic()
                        .run()
                }
            >
                <em>I</em>
            </ToolbarButton>

            <ToolbarButton
                title="Underline"
                active={state.underline}
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleUnderline()
                        .run()
                }
            >
                <u>U</u>
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-zinc-200" />

            <ToolbarButton
                title="Heading 1"
                active={state.heading1}
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleHeading({
                            level: 1,
                        })
                        .run()
                }
            >
                H1
            </ToolbarButton>

            <ToolbarButton
                title="Heading 2"
                active={state.heading2}
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleHeading({
                            level: 2,
                        })
                        .run()
                }
            >
                H2
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-zinc-200" />

            <ToolbarButton
                title="Bulleted List"
                active={state.bulletList}
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleBulletList()
                        .run()
                }
            >
                • List
            </ToolbarButton>

            <ToolbarButton
                title="Numbered List"
                active={state.orderedList}
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .toggleOrderedList()
                        .run()
                }
            >
                1. List
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-zinc-200" />

            <ToolbarButton
                title="Undo"
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .undo()
                        .run()
                }
            >
                ↶
            </ToolbarButton>

            <ToolbarButton
                title="Redo"
                disabled={!canEdit}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .redo()
                        .run()
                }
            >
                ↷
            </ToolbarButton>
        </div>
    );
}

export default function DocumentEditor({
    documentId,
    initialTitle,
    initialContent,
    canEdit,
    isOwner,
}: DocumentEditorProps) {
    const [title, setTitle] =
        useState(initialTitle);

    const [saveStatus, setSaveStatus] =
        useState<SaveStatus>("saved");

    const titleRef = useRef(initialTitle);

    const contentRef =
        useRef<JSONContent>(initialContent);

    const saveTimerRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    const saveQueueRef =
        useRef<Promise<void>>(
            Promise.resolve()
        );

    const changeVersionRef =
        useRef(0);

    const lastSavedRef = useRef(
        JSON.stringify({
            title: initialTitle,
            content: initialContent,
        })
    );

    const scheduleSave = useCallback(
        (
            nextTitle: string,
            nextContent: JSONContent
        ) => {
            if (!canEdit) {
                return;
            }

            const payload = JSON.stringify({
                title:
                    nextTitle.trim() ||
                    "Untitled Document",
                content: nextContent,
            });

            if (
                payload === lastSavedRef.current
            ) {
                return;
            }

            const version =
                ++changeVersionRef.current;

            if (saveTimerRef.current) {
                clearTimeout(
                    saveTimerRef.current
                );
            }

            queueMicrotask(() => {
                setSaveStatus("saving");
            });

            saveTimerRef.current =
                setTimeout(() => {
                    const titleToSave =
                        nextTitle.trim() ||
                        "Untitled Document";

                    const contentToSave =
                        nextContent;

                    saveQueueRef.current =
                        saveQueueRef.current.then(
                            async () => {
                                const result =
                                    await saveDocument(
                                        documentId,
                                        titleToSave,
                                        contentToSave
                                    );

                                if (!result.success) {
                                    if (
                                        version ===
                                        changeVersionRef.current
                                    ) {
                                        setSaveStatus(
                                            "error"
                                        );
                                    }

                                    return;
                                }

                                lastSavedRef.current =
                                    JSON.stringify({
                                        title: titleToSave,
                                        content:
                                            contentToSave,
                                    });

                                if (
                                    version ===
                                    changeVersionRef.current
                                ) {
                                    setSaveStatus(
                                        "saved"
                                    );
                                }
                            }
                        );
                }, 800);
        },
        [canEdit, documentId]
    );

    const editor = useEditor({
        extensions: [StarterKit],

        content: initialContent,

        editable: canEdit,

        immediatelyRender: false,

        shouldRerenderOnTransaction:
            false,

        onUpdate: ({ editor }) => {
            const content =
                editor.getJSON();

            contentRef.current = content;

            scheduleSave(
                titleRef.current,
                content
            );
        },
    });

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(
                    saveTimerRef.current
                );
            }
        };
    }, []);

    const handleTitleChange = (
        value: string
    ) => {
        setTitle(value);

        titleRef.current = value;

        scheduleSave(
            value,
            contentRef.current
        );
    };

    const handleTitleBlur = () => {
        if (!title.trim()) {
            const fallback =
                "Untitled Document";

            setTitle(fallback);

            titleRef.current = fallback;

            scheduleSave(
                fallback,
                contentRef.current
            );
        }
    };

    if (!editor) {
        return (
            <div className="p-10 text-center text-sm text-zinc-500">
                Loading editor...
            </div>
        );
    }

    return (
        <div>
            {/* DOCUMENT HEADER */}

            <div className="border-b border-zinc-200 bg-white px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        value={title}
                        disabled={!canEdit}
                        maxLength={120}
                        onChange={(event) =>
                            handleTitleChange(
                                event.target.value
                            )
                        }
                        onBlur={handleTitleBlur}
                        className="
              w-full bg-transparent
              text-xl font-semibold
              text-zinc-900 outline-none
              placeholder:text-zinc-400
              disabled:cursor-default
              sm:max-w-xl
            "
                        placeholder="Untitled Document"
                    />

                    <div className="flex items-center gap-3">
                        <span
                            className={`
                text-xs font-medium
                ${saveStatus ===
                                    "error"
                                    ? "text-red-600"
                                    : "text-zinc-500"
                                }
              `}
                        >
                            {!canEdit
                                ? "View only"
                                : saveStatus ===
                                    "saving"
                                    ? "Saving..."
                                    : saveStatus ===
                                        "error"
                                        ? "Save failed"
                                        : "Saved ✓"}
                        </span>

                        <span
                            className={`
                rounded-full px-3
                py-1 text-xs
                font-medium
                ${isOwner
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-violet-50 text-violet-700"
                                }
              `}
                        >
                            {isOwner
                                ? "Owner"
                                : canEdit
                                    ? "Can edit"
                                    : "Can view"}
                        </span>
                    </div>
                </div>
            </div>

            {/* TOOLBAR */}

            <EditorToolbar
                editor={editor}
                canEdit={canEdit}
            />

            {/* EDITOR */}

            <div className="bg-zinc-100 px-4 py-8 sm:px-8">
                <div className="mx-auto min-h-[700px] max-w-4xl rounded-sm border border-zinc-200 bg-white shadow-sm">
                    <EditorContent
                        editor={editor}
                        className="document-editor"
                    />
                </div>
            </div>
        </div>
    );
}
