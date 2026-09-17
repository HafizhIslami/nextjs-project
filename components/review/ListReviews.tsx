import { IReview } from "@/backend/models/room";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import Image from "next/image";
import React from "react";
import Rating from "../ui/Rating";

interface Props {
  reviews: IReview[];
}
const ListReviews = ({ reviews }: Props) => {
  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        <h3>No guest reviews yet</h3>
        <p>Be the first guest to share an experience of this room.</p>
      </div>
    );
  }

  return (
    <div className="reviews mb-5">
      <p className="reviews-count">
        {reviews.length} {reviews.length === 1 ? "verified review" : "verified reviews"}
      </p>
      {reviews.map((review) => (
        <div className="review-card my-3" key={review._id?.toString()}>
          <div className="row">
            <div className="col-3 col-lg-1">
              <Image
                src={normalizeImageUrl(
                  review.user?.avatar?.url,
                  "/images/default_avatar.jpg"
                )}
                alt={review?.user?.name}
                width={60}
                height={60}
                sizes="60px"
                className="rounded-circle"
              />
            </div>
            <div className="col-9 col-lg-11">
              <Rating value={review.rating} size="large" />
              <p className="review_user mt-1">by {review.user.name}</p>
              <p className="review_comment">{review.comment}</p>
            </div>
            <hr />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListReviews;
