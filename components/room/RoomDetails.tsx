"use client";

import { IRoom } from "@/backend/models/room";
import React, { useEffect, useState } from "react";
import RoomImageSlider from "./RoomImageSider";
import RoomFeatures from "./RoomFeatures";
import BookingDatePicker from "./BookingDatePicker";
import NewReview from "../review/NewReview";
import ListReviews from "../review/ListReviews";
import StarRatings from "react-star-ratings";
import mapboxgl from "mapbox-gl/dist/mapbox-gl.js";
import "mapbox-gl/dist/mapbox-gl.css";

interface Props {
  data: { room: IRoom };
}

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;

const RoomDetails = ({ data }: Props) => {
  useEffect(() => {
    const setMap = () => {
      const coordinates = room?.location.coordinates;

      const map = new mapboxgl.Map({
        container: "room-map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: coordinates,
        zoom: 12,
      });

      new mapboxgl.Marker().setLngLat(coordinates).addTo(map)
    };

    setMap();
  }, []);

  const { room } = data;

  return (
    <div className="container container-fluid">
      <h2 className="mt-5">{room.name}</h2>
      <p>{room.address}</p>

      <div className="ratings mt-auto mb-3">
        <StarRatings
          rating={room?.ratings}
          starRatedColor="orange"
          numberOfStars={5}
          name="rating"
          starDimension="48px"
          starSpacing="2px"
        />
      </div>

      <div className="row">
        <div className="col-10 col-md-8 col-lg-8 mx-auto">
          <RoomImageSlider images={room?.images} />
        </div>

        <div className="col-8 col-md-6 col-lg-4 d-none d-lg-block align-content-center">
          <BookingDatePicker room={room} />
        </div>
      </div>

      <div className="my-5">
        <div className="row">
          <div className="col-12 col-lg-7">
            <h3>Description</h3>
            <p>{room.description}</p>

            <RoomFeatures room={room} />
          </div>
          <div className="col-12 col-md-7 col-sm-9 col-lg-5">
            {room?.location && (
              <div>
                <h3>Room Location:</h3>
                <div
                  id="room-map"
                  className="shadow rounded"
                  style={{ height: 350, width: "100%" }}
                ></div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 col-md-7 col-sm-9 d-block d-lg-none booking-sidebar">
          <BookingDatePicker room={room} />
        </div>
      </div>

      <NewReview roomId={String(room?._id)} />

      <ListReviews reviews={room?.reviews} />
    </div>
  );
};

export default RoomDetails;
