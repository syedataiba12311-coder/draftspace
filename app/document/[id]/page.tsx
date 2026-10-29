import Link from "next/link";
import {
    notFound,
    redirect,
} from "next/navigation";
import type { JSONContent } from "@tiptap/core";

import { createClient } from "@/lib/supabase/server";
import DocumentEditor from "@/components/document-editor";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function DocumentPage({
    params,
}: PageProps) {
    const { id } = await params;

    const supabase =
        await createClient();

    // -----------------------------
    // Authentication
    // -----------------------------

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // -----------------------------
    // Fetch document
    // -----------------------------

    const {
        data: document,
        error,
    } = await supabase
        .from("documents")
        .select(
            `
        id,
        title,
        content,
        owner_id,
        created_at,
        updated_at
      `
        )
        .eq("id", id)
        .single();

    if (error || !document) {
        notFound();
    }

    // -----------------------------
    // Ownership / permission
    // -----------------------------

    const isOwner =
        document.owner_id === user.id;

    let canEdit = isOwner;

    if (!isOwner) {
        const { data: share } =
            await supabase
                .from("document_shares")
                .select("permission")
                .eq(
                    "document_id",
                    document.id
                )
                .eq("shared_with", user.id)
                .maybeSingle();

        canEdit =
            share?.permission === "edit";
    }

    const content =
        (document.content as JSONContent) ??
        { type: "doc", content: [] };

    return (
        <main className="min-h-screen bg-zinc-100">
            {/* TOP NAVIGATION */}

            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
                    >
                        ← Documents
                    </Link>

                    <Link
                        href="/dashboard"
                        className="font-semibold text-zinc-900"
                    >
                        DraftSpace
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-7xl">
                <DocumentEditor
                    documentId={
                        document.id
                    }
                    initialTitle={
                        document.title
                    }
                    initialContent={content}
                    canEdit={canEdit}
                    isOwner={isOwner}
                />
            </div>
        </main>
    );
}

