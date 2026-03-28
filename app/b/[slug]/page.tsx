import { notFound } from "next/navigation";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

export default async function BusinessPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;

  console.log("Business page hit with slug:", slug);

  const supabase = createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("Supabase error:", error);
  }

  if (!business) {
    console.warn("Business not found for slug:", slug);
    return notFound();
  }

  console.log("Business found:", business.name);

  return (
    <div style={{ padding: "40px" }}>
      <h1>{business.name}</h1>
      <p>{business.website}</p>
    </div>
  );
}
