"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveDocument(
    documentId: string,
    title: string,
    content: unknown
) {
    if (!documentId) {
        return {
            success: false,
            error: "Invalid document.",
        };
    }

    const cleanTitle = title.trim() || "Untitled Document";

    if (cleanTitle.length > 120) {
        return {
            success: false,
            error: "Document title is too long.",
        };
    }

    if (
        !content ||
        typeof content !== "object" ||
        Array.isArray(content)
    ) {
        return {
            success: false,
            error: "Invalid document content.",
        };
    }

    const serializedContent = JSON.stringify(content);

    // Prevent unexpectedly huge saves for this exercise.
    if (serializedContent.length > 500_000) {
        return {
            success: false,
            error: "Document is too large.",
        };
    }

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            success: false,
            error: "You must be signed in.",
        };
    }

    const { data, error } = await supabase
        .from("documents")
        .update({
            title: cleanTitle,
            content,
        })
        .eq("id", documentId)
        .select("id")
        .maybeSingle();

    if (error) {
        console.error("Document save failed:", error);

        return {
            success: false,
            error: "Unable to save document.",
        };
    }

    // RLS can cause the update to affect no rows if the user
    // does not have permission.
    if (!data) {
        return {
            success: false,
            error: "You do not have permission to edit this document.",
        };
    }

    return {
        success: true,
    };
}
