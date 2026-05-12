import { getGmbConnection, getGmbReviews } from "../actions";
import { redirect } from "next/navigation";
import { GmbReviewsClient } from "./gmb-reviews-client";

interface ReviewsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function GmbReviewsPage({ searchParams }: ReviewsPageProps) {
  const connection = await getGmbConnection();

  if (!connection) {
    redirect("/gmb/connect");
  }

  const params = await searchParams;
  const filter = params.filter ?? "all";
  const reviews = await getGmbReviews(filter);

  return (
    <div className="p-6">
      <GmbReviewsClient
        reviews={reviews}
        filter={filter}
        connection={connection}
      />
    </div>
  );
}
