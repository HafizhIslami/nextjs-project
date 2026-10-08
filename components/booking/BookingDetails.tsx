"use client";

import { IBooking } from "@/backend/models/booking";
import { useAppSelector } from "@/redux/hooks";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import Link from "next/link";
import React from "react";
import Image from "next/image";

interface Props {
  data: {
    booking: IBooking;
  };
}

const BookingDetails = ({ data }: Props) => {
  const booking = data?.booking;
  const { user } = useAppSelector((state) => state.auth);
  const isPaid = booking?.paymentInfo?.status === "paid";

  return (
    <div className="container booking-details-page">
      <div className="row d-flex justify-content-center">
        <div className="col-12 col-lg-9 booking-details">
          <header className="booking-details-header">
            <div>
              <span className="eyebrow">Booking details</span>
              <h1>{isPaid ? "Booking confirmed" : "Booking summary"}</h1>
              <p className="booking-reference">Reference: {booking._id?.toString()}</p>
            </div>
            <Link
              href={`/bookings/invoice/${booking._id?.toString()}`}
              className="btn btn-secondary-roomi"
            >
              View invoice
            </Link>
          </header>

          <section className="booking-info-section">
            <h2>Guest information</h2>
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <tbody>
              <tr>
                <th scope="row">Name:</th>
                <td>{booking?.user?.name}</td>
              </tr>
              <tr>
                <th scope="row">Email:</th>
                <td>{booking?.user?.email}</td>
              </tr>
              <tr>
                <th scope="row">Amount Paid:</th>
                <td>{booking?.amountPaid.toString()}</td>
              </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="booking-info-section">
            <h2>Stay information</h2>
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <tbody>
              <tr>
                <th scope="row">Check In:</th>
                <td>
                  {new Date(booking?.checkInDate).toLocaleString("en-US")}
                </td>
              </tr>
              <tr>
                <th scope="row">Check Out:</th>
                <td>
                  {new Date(booking?.checkOutDate).toLocaleString("en-US")}
                </td>
              </tr>
              <tr>
                <th scope="row">Days of Stay:</th>
                <td>{booking?.daysOfStay.toString()}</td>
              </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="booking-info-section">
            <h2>Payment information</h2>
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <tbody>
              <tr>
                <th scope="row">Status:</th>
                <td>
                  <b className={`status-badge ${isPaid ? "paid" : "unpaid"}`}>
                    {isPaid ? "Paid" : "Not Paid"}
                  </b>
                </td>
              </tr>
              {user?.role === "admin" && (
                <tr>
                  <th scope="row">Stripe ID:</th>
                  <td>
                    <b className="redColor">{booking?.paymentInfo.id}</b>
                  </td>
                </tr>
              )}
                </tbody>
              </table>
            </div>
          </section>

          {booking?.room ? (
            <section className="booked-room-card surface-card">
              <div className="row align-items-center">
                <div className="col-4 col-md-2">
                  <Image
                    src={normalizeImageUrl(
                      booking.room.images[0]?.url,
                      "/images/default_room_image.jpg"
                    )}
                    alt={`${booking?.room?.name} room`}
                    height={96}
                    width={128}
                    className="booked-room-image"
                  />
                </div>

                <div className="col-8 col-md-5">
                  <h2>
                  <Link href={`/rooms/${booking.room._id}`}>
                    {booking?.room?.name}
                  </Link>
                  </h2>
                  <p>{booking.room.address}</p>
                </div>

                <div className="col-6 col-md-2 mt-3 mt-md-0">
                  <p>$ {booking.room.pricePerNight}</p>
                </div>

                <div className="col-6 col-md-3 mt-3 mt-md-0">
                  <p>{booking.daysOfStay.toString()} night(s)</p>
                </div>
              </div>
            </section>
          ) : (
            <div className="alert alert-danger">Room no longer exist</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
