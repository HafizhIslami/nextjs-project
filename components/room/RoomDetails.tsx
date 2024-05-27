"use client";

import { IRoom } from "@/backend/models/room";
import React from "react";
import RoomImageSlider from "./RoomImageSider";
import RoomFeatures from "./RoomFeatures";
import BookingDatePicker from "./BookingDatePicker";
import NewReview from "../review/NewReview";
import ListReviews from "../review/ListReviews";

interface Props {
  data: { room: IRoom };
}
const RoomDetails = ({ data }: Props) => {
  const { room } = data;

  return (
    <div className="container container-fluid">
      <h2 className="mt-5">Lorem Ipsum Room</h2>
      <p>1234 Lorem Ipsum Street, Lorem City</p>

      <div className="ratings mt-auto mb-3">
        <div className="star-ratings">
          <i className="fa fa-star"></i>
          <i className="fa fa-star"></i>
          <i className="fa fa-star"></i>
          <i className="fa fa-star"></i>
          <i className="fa fa-star-half"></i>
          <span className="no-of-reviews">(50 Reviews)</span>
        </div>
      </div>

      <RoomImageSlider images={room?.images} />

      <div className="row my-5">
        <div className="col-12 col-md-6 col-lg-8">
          <h3>Description</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            fermentum nulla sit amet eros iaculis, id venenatis purus tempor.
            Sed bibendum bibendum tellus, sed suscipit elit condimentum nec.
            Aliquam id venenatis ipsum. Sed vel lorem vitae leo sodales iaculis.
            Sed vehicula, tellus in ultrices vestibulum, erat quam fermentum
            tortor, quis feugiat erat dolor in est.
          </p>

          <RoomFeatures room={room} />
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <BookingDatePicker room={room}/>
          {/* TODO: Room Map */}
        </div>
      </div>

      
      <NewReview />
      
      <ListReviews />
    </div>
  );
};

export default RoomDetails;
