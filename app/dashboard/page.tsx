import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDocument } from "./actions";

type Document = {
    id: string;
    title: string;
    owner_id: string;
    updated_at: string;
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

function DocumentCard({
    document,
    shared = false,
}: {
    document: Document;
    shared?: boolean;
}) {
    return (
        <Link
            href={`/document/${document.id}`}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
        >
            <div className="mb-8 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg">
                    📄
                </div>

                {shared && (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                        Shared
                    </span>
                )}
            </div>

            <h3 className="truncate font-semibold text-zinc-900 group-hover:text-blue-600">
                {document.title || "Untitled Document"}
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
                Updated {formatDate(document.updated_at)}
            </p>
        </Link>
    );
}

export default async function DashboardPage() {
    const supabase = await createClient();

    // ----------------------------
    // Get logged-in user
    // ----------------------------

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // ----------------------------
    // Load profile
    // ----------------------------

    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .single();

    // ----------------------------
    // Load accessible documents
    // ----------------------------

    const { data: documents, error } = await supabase
        .from("documents")
        .select("id, title, owner_id, updated_at")
        .order("updated_at", {
            ascending: false,
        });

    if (error) {
        console.error("Failed to load documents:", error);
    }

    const safeDocuments = (documents ?? []) as Document[];

    // ----------------------------
    // Separate owned and shared
    // ----------------------------

    const ownedDocuments = safeDocuments.filter(
        (document) => document.owner_id === user.id
    );

    const sharedDocuments = safeDocuments.filter(
        (document) => document.owner_id !== user.id
    );

    const name =
        profile?.display_name ||
        profile?.email?.split("@")[0] ||
        user.email?.split("@")[0] ||
        "User";

    return (
        <main className="min-h-screen bg-zinc-50">
            {/* HEADER */}

            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                            D
                        </div>

                        <div>
                            <h1 className="font-bold text-zinc-900">
                                DraftSpace
                            </h1>

                            <p className="text-xs text-zinc-500">
                                Collaborative documents
                            </p>
                        </div>
                    </Link>

                    <div className="text-right">
                        <p className="text-sm font-medium text-zinc-900">
                            {name}
                        </p>

                        <p className="text-xs text-zinc-500">
                            {user.email}
                        </p>
                    </div>
                </div>
            </header>

            {/* CONTENT */}

            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* WELCOME */}

                <section className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-2 text-sm font-medium text-blue-600">
                            Workspace
                        </p>

                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                            Your documents
                        </h2>

                        <p className="mt-2 text-zinc-500">
                            Create, edit and share documents from one workspace.
                        </p>
                    </div>

                    <form action={createDocument}>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            + New Document
                        </button>
                    </form>
                </section>

                {/* OWNED DOCUMENTS */}

                <section>
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900">
                                My Documents
                            </h3>

                            <p className="text-sm text-zinc-500">
                                Documents you created and own.
                            </p>
                        </div>

                        <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700">
                            {ownedDocuments.length}
                        </span>
                    </div>

                    {ownedDocuments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
                            <div className="mb-4 text-4xl">
                                📝
                            </div>

                            <h4 className="font-semibold text-zinc-900">
                                No documents yet
                            </h4>

                            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                                Create your first document to start writing,
                                formatting and collaborating.
                            </p>

                            <form
                                action={createDocument}
                                className="mt-6"
                            >
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    Create first document
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {ownedDocuments.map((document) => (
                                <DocumentCard
                                    key={document.id}
                                    document={document}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* SHARED DOCUMENTS */}

                <section className="mt-14">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900">
                                Shared With Me
                            </h3>

                            <p className="text-sm text-zinc-500">
                                Documents other people have shared with you.
                            </p>
                        </div>

                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                            {sharedDocuments.length}
                        </span>
                    </div>

                    {sharedDocuments.length === 0 ? (
                        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center">
                            <p className="text-sm text-zinc-500">
                                No documents have been shared with you yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {sharedDocuments.map((document) => (
                                <DocumentCard
                                    key={document.id}
                                    document={document}
                                    shared
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
