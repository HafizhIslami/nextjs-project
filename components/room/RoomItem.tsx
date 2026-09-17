import { IRoom } from "@/backend/models/room";
import Rating from "@/components/ui/Rating";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  room: IRoom;
}
const RoomItem = ({ room }: Props) => {
  console.log("RoomItem room:", room); // Debugging line to check the room prop
  return (
    <article className="col-sm-12 col-md-6 col-lg-4 d-flex">
      <div className="room-card w-100">
        <Link href={`/rooms/${room._id}`} className="room-card-image-link">
          <Image
            className="room-card-image"
            src={normalizeImageUrl(
              room.images[0]?.url,
              "/images/default_room_image.jpg"
            )}
            alt={`${room.name} room`}
            height={240}
            width={420}
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
          />
          <span className="room-category">{room.category}</span>
        </Link>
        <div className="room-card-body">
          <div className="room-card-topline">
            <div>
              <p className="room-location">{room.address}</p>
              <h3 className="room-card-title">
                <Link href={`/rooms/${room._id}`}>{room.name}</Link>
              </h3>
            </div>
            <p className="room-capacity">
              {room.guestCapacity} {room.guestCapacity === 1 ? "guest" : "guests"}
            </p>
          </div>
          <div className="room-card-meta">
            <div className="room-rating">
              <Rating value={room.ratings} />
              <span>{room.numOfReviews} reviews</span>
            </div>
            <p className="room-price">
              <strong>${room.pricePerNight}</strong>
              <span> / night</span>
            </p>
          </div>
          <Link className="btn btn-secondary-roomi w-100" href={`/rooms/${room._id}`}>
            View room details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default RoomItem;
