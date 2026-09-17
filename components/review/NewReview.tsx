import {
  useAllowReviewQuery,
  usePostReviewMutation,
} from "@/redux/api/roomApi";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import toast from "react-hot-toast";

const NewReview = ({ roomId }: { roomId: string }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [show, setShow] = useState(false);

  const router = useRouter();

  const [postReview, { error, isSuccess }] = usePostReviewMutation();
  const { data: { allowReview } = {} } = useAllowReviewQuery(roomId);

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error?.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      toast.success("Review posted");
      router.refresh();
    }
  }, [error, isSuccess, router]);

  const submitHandler = () => {
    const reviewData = {
      rating,
      comment,
      roomId,
    };

    postReview(reviewData);
    setShow(false);
  };
  return (
    <>
      {allowReview && (
        <button
          type="button"
          className="btn btn-secondary-roomi"
          onClick={() => setShow(true)}
        >
          Write a review
        </button>
      )}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Write a review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <fieldset className="rating-fieldset">
            <legend>Your rating</legend>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= rating ? "selected" : ""}
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                >
                  <span className="review-star-icon" aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-4">
            <label className="form-label" htmlFor="review_field">Comment</label>
            <textarea
              id="review_field"
              className="form-control"
              placeholder="Tell future guests about your stay"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-light" onClick={() => setShow(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary-roomi"
            onClick={submitHandler}
            disabled={!rating || !comment.trim()}
          >
            Submit review
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NewReview;
