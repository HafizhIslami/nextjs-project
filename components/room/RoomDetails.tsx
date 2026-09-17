"use client";

import { IRoom } from "@/backend/models/room";
import dynamic from "next/dynamic";
import React from "react";
import RoomImageSlider from "./RoomImageSider";
import RoomFeatures from "./RoomFeatures";
import BookingDatePicker from "./BookingDatePicker";
import NewReview from "../review/NewReview";
import ListReviews from "../review/ListReviews";
import Rating from "../ui/Rating";

interface Props {
  data: { room: IRoom };
}

const RoomMap = dynamic(() => import("./RoomMap"), {
  ssr: false,
  loading: () => <div className="map-placeholder">Loading map...</div>,
});

const RoomDetails = ({ data }: Props) => {
  const { room } = data;
  const hasMapboxToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);

  return (
    <div className="container room-detail-page">
      <header className="room-detail-header">
        <div>
          <span className="eyebrow">{room.category} room</span>
          <h1>{room.name}</h1>
          <p>{room.address}</p>
        </div>
        <div className="room-detail-rating">
          <Rating value={room.ratings} size="large" />
          <span>
            {room.ratings.toFixed(1)} - {room.numOfReviews}{" "}
            {room.numOfReviews === 1 ? "review" : "reviews"}
          </span>
        </div>
      </header>

      <div className="row room-detail-primary">
        <div className="col-12 col-lg-8">
          <RoomImageSlider images={room.images} roomName={room.name} />
        </div>

        <aside className="col-12 col-lg-4 mt-4 mt-lg-0" aria-label="Book this room">
          <BookingDatePicker room={room} />
        </aside>
      </div>

      <div className="row room-detail-secondary">
        <div className="col-12 col-lg-7">
          <section className="detail-section" aria-labelledby="description-heading">
            <span className="eyebrow">About this stay</span>
            <h2 id="description-heading">Room overview</h2>
            <p className="room-description">{room.description}</p>
          </section>
          <RoomFeatures room={room} />
        </div>
        <div className="col-12 col-lg-5">
          <section className="detail-section" aria-labelledby="location-heading">
            <span className="eyebrow">Location</span>
            <h2 id="location-heading">Where you&apos;ll stay</h2>
            {hasMapboxToken ? (
              <RoomMap
                coordinates={room.location.coordinates}
                address={room.location.formattedAddress || room.address}
              />
            ) : (
              <div className="map-placeholder" role="img" aria-label={`Map location: ${room.address}`}>
                <span aria-hidden="true">Location</span>
                <strong>{room.location.formattedAddress || room.address}</strong>
                <small>Map preview is unavailable in this environment.</small>
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="room-reviews-section" aria-labelledby="reviews-heading">
        <div className="reviews-heading-row">
          <div>
            <span className="eyebrow">Guest feedback</span>
            <h2 id="reviews-heading">Reviews</h2>
          </div>
          <NewReview roomId={String(room._id)} />
        </div>
        <ListReviews reviews={room.reviews} />
      </section>
    </div>
  );
};

export default RoomDetails;
