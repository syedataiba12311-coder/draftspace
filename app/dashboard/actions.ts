"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createDocument() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: "Untitled Document",
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create document:", error);
    throw new Error("Unable to create document.");
  }

  redirect(`/document/${data.id}`);
}
