import { IImage } from "@/backend/models/room";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import Image from "next/image";
import React from "react";
import { Carousel } from "react-bootstrap";

interface Props {
  images: IImage[];
  roomName: string;
}
const RoomImageSlider = ({ images, roomName }: Props) => {
  return (
    <Carousel fade data-bs-theme="dark" className="room-gallery">
      {images.length > 0 ? (
        images.map((image, index) => (
          <Carousel.Item key={image.public_id}>
            <div className="room-gallery-frame">
              <Image
                fill
                priority={index === 0}
                sizes="(max-width: 991px) 100vw, 66vw"
                src={normalizeImageUrl(image.url, "/images/default_room_image.jpg")}
                alt={`${roomName}, photo ${index + 1} of ${images.length}`}
              />
            </div>
          </Carousel.Item>
        ))
      ) : (
        <Carousel.Item>
          <div className="room-gallery-frame">
            <Image
              fill
              priority
              sizes="(max-width: 991px) 100vw, 66vw"
              src="/images/default_room_image.jpg"
              alt={`${roomName} placeholder photo`}
            />
          </div>
        </Carousel.Item>
      )}
    </Carousel>
  );
};

export default RoomImageSlider;
