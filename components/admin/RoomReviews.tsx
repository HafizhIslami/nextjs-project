"use client";

import { IReview } from "@/backend/models/room";
import {
  useDeleteReviewMutation,
  useLazyGetRoomReviewsQuery,
} from "@/redux/api/roomApi";
import SimpleDataTable, { DataTableData } from "./SimpleDataTable";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const RoomReviews = () => {
  const [roomId, setRoomId] = useState("");

  const router = useRouter();

  const [getRoomReviews, { data, error }] = useLazyGetRoomReviewsQuery();
  const reviews = data?.reviews || [];

  const [deleteReview, { isSuccess, isLoading }] = useDeleteReviewMutation();

  const getRoomReviewsHandler = () => {
    getRoomReviews(roomId);
  };

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      router.refresh();
      toast.success("Review deleted");
    }
  }, [error, isSuccess, router]);

  const setReviews = () => {
    const data: DataTableData = {
      columns: [
        {
          label: "ID",
          field: "id",
          sort: "asc",
        },
        {
          label: "Rating",
          field: "rating",
          sort: "asc",
        },
        {
          label: "Comment",
          field: "comment",
          sort: "asc",
        },

        {
          label: "Actions",
          field: "actions",
          sort: "asc",
        },
      ],
      rows: [],
    };

    reviews?.forEach((review: IReview) => {
      data?.rows?.push({
        id: review._id?.toString(),
        rating: review?.rating,
        comment: review?.comment,
        actions: (
          <>
            <button
              className="btn btn-outline-danger mx-2"
              disabled={isLoading}
              onClick={() => deleteReviewHandler(review?._id?.toString() ?? "")}
            >
              Delete
            </button>
          </>
        ),
      });
    });

    return data;
  };

  const deleteReviewHandler = (id: string) => {
    if (window.confirm("Delete this review? This action cannot be undone.")) {
      deleteReview({ id, roomId });
    }
  };

  return (
    <div>
      <div className="row justify-content-center mt-5">
        <div className="col-12 col-md-8">
          <div className="surface-card review-lookup">
            <label htmlFor="roomId_field">Room ID</label>
            <input
              type="text"
              id="roomId_field"
              className="form-control"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />

            <button
              className="btn form-btn w-100 py-2 mt-3"
              onClick={getRoomReviewsHandler}
            >
              Find reviews
            </button>
          </div>
        </div>
      </div>

      {reviews?.length > 0 ? (
        <SimpleDataTable data={setReviews()} className="px-3" />
      ) : (
        <p className="empty-state mt-5">No reviews found.</p>
      )}
    </div>
  );
};

export default RoomReviews;
