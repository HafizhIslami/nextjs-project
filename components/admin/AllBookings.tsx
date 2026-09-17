"use client";

import { IBooking } from "@/backend/models/booking";
import { useDeleteBookingMutation } from "@/redux/api/bookingApi";
import SimpleDataTable, { DataTableData } from "./SimpleDataTable";
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
  }, [error, isSuccess, router]);

  const setBookings = () => {
    const data: DataTableData = {
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
        id: booking._id?.toString(),
        checkin: new Date(booking?.checkInDate).toLocaleString("en-US"),

        actions: (
          <div className="table-actions">
            <Link
              href={`/bookings/${booking._id}`}
              className="btn btn-outline-primary btn-sm"
            >
              View
            </Link>
            <Link
              href={`/bookings/invoice/${booking._id}`}
              className="btn btn-outline-success btn-sm"
            >
              Invoice
            </Link>
            <button
              className="btn btn-outline-danger btn-sm"
              disabled={isLoading}
              onClick={() =>
                deleteBookingHandler(booking?._id?.toString() ?? "")
              }
            >
              Delete
            </button>
          </div>
        ),
      });
    });

    return data;
  };

  const deleteBookingHandler = (id: string) => {
    if (window.confirm("Delete this booking? This action cannot be undone.")) {
      deleteBooking(id);
    }
  };

  return (
    <div className="container">
      <h2 className="resource-title">{bookings?.length} Bookings</h2>
      <SimpleDataTable data={setBookings()} className="px-3" />
    </div>
  );
};

export default AllBookings;
