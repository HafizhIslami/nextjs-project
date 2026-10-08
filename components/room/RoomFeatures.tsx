import { IRoom } from "@/backend/models/room";
import React from "react";

interface Props {
  room: IRoom;
}
const RoomFeatures = ({ room }: Props) => {
  const amenities = [
    { label: "Breakfast", available: room.isBreakfast },
    { label: "Internet", available: room.isInternet },
    { label: "Air conditioning", available: room.isAirConditioned },
    { label: "Pets allowed", available: room.isPetsAllowed },
    { label: "Room cleaning", available: room.isRoomCleaning },
  ];

  return (
    <section className="features detail-section" aria-labelledby="amenities-heading">
      <span className="eyebrow">What&apos;s included</span>
      <h2 id="amenities-heading">Amenities</h2>
      <div className="room-feature">
        <p>Guest capacity</p>
        <strong>{room.guestCapacity}</strong>
      </div>
      <div className="room-feature">
        <p>Beds</p>
        <strong>{room.numOfBeds}</strong>
      </div>
      {amenities.map((amenity) => (
        <div className="room-feature" key={amenity.label}>
          <p>{amenity.label}</p>
          <span
            className={`feature-state ${
              amenity.available ? "available" : "unavailable"
            }`}
          >
            {amenity.available ? "Included" : "Not included"}
          </span>
        </div>
      ))}
    </section>
  );
};

export default RoomFeatures;
