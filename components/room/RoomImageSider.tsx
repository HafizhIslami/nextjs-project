import { IImage } from "@/backend/models/room";
import React from "react";
import { Carousel, Image } from "react-bootstrap";

interface Props {
  images: IImage[];
}
const RoomImageSlider = ({ images }: Props) => {
  return (
    <Carousel fade data-bs-theme="dark">
      {images.length > 0 ? (
        images.map((image) => (
          <Carousel.Item key={image.public_id}>
            <div
              style={{
                height: "460px",
              }}
              className="carousel-content d-flex justify-content-center align-items-center"
            >
              <Image
                className="d-block m-auto h-100"
                src={image?.url}
                alt={image?.url}
              />
            </div>
          </Carousel.Item>
        ))
      ) : (
        <Carousel.Item>
          <div
            style={{
              height: "460px",
              alignContent: "center",
            }}
          >
            <Image
              className="d-block m-auto w-100"
              src={`/public/images/default_room_image.jpg`}
              alt="images/default_room_image.jpg"
            />
          </div>
        </Carousel.Item>
      )}
    </Carousel>
    // <div className={"w-100 h-100"}>

    // </div>
  );
};

export default RoomImageSlider;
