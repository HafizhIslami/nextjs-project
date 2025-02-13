"use client";

import { IBooking } from "@/backend/models/booking";
import { useDeleteBookingMutation } from "@/redux/api/bookingApi";
import { MDBDataTable } from "mdbreact";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

interface Props {
  data: {
    bookings: IBooking[];
  };
}

const AllBookings = ({ data }: Props) => {
  const bookings = data?.bookings;

  const router = useRouter();

  const [deleteBooking, { error, isLoading, isSuccess }] =
    useDeleteBookingMutation();

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      router.refresh();
      toast.success("Booking deleted");
    }
  }, [error, isSuccess]);

  const setBookings = () => {
    const data: { columns: any[]; rows: any[] } = {
      columns: [
        {
          label: "ID",
          field: "id",
          sort: "asc",
        },
        {
          label: "Check In",
          field: "checkin",
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

    bookings?.forEach((booking) => {
      data?.rows?.push({
        id: booking._id,
        checkin: new Date(booking?.checkInDate).toLocaleString("en-US"),

        actions: (
          <div className="row justify-content-center">
            <Link
              href={`/bookings/${booking._id}`}
              className="btn btn-outline-primary m-1 col-auto"
            >
              {" "}
              <i className="fa fa-eye"></i>{" "}
            </Link>
            <Link
              href={`/bookings/invoice/${booking._id}`}
              className="btn btn-outline-success m-1 col-auto"
            >
              {" "}
              <i className="fa fa-receipt"></i>{" "}
            </Link>
            <button
              className="btn btn-outline-danger m-1 col-auto"
              disabled={isLoading}
              onClick={() => deleteBookingHandler(booking?._id as string)}
            >
              <i className="fa fa-trash"></i>
            </button>
          </div>
        ),
      });
    });

    return data;
  };

  const deleteBookingHandler = (id: string) => {
    deleteBooking(id);
  };

  return (
    <div className="container">
      <h1 className="my-5">{bookings?.length} Bookings</h1>
      <MDBDataTable
        data={setBookings()}
        className="px-3"
        bordered
        striped
        hover
        noBottomColumns
      />
    </div>
  );
};

export default AllBookings;
