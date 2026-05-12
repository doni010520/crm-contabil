import { getGmbConnection, getGmbPosts } from "../actions";
import { redirect } from "next/navigation";
import { GmbPostsClient } from "./gmb-posts-client";

interface PostsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function GmbPostsPage({ searchParams }: PostsPageProps) {
  const connection = await getGmbConnection();

  if (!connection) {
    redirect("/gmb/connect");
  }

  const params = await searchParams;
  const status = params.status ?? "all";
  const posts = await getGmbPosts(status);

  return (
    <div className="p-6">
      <GmbPostsClient
        posts={posts}
        status={status}
        connection={connection}
      />
    </div>
  );
}
