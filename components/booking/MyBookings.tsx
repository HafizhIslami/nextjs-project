"use client";

import { IBooking } from "@/backend/models/booking";
import SimpleDataTable, {
  DataTableData,
} from "@/components/admin/SimpleDataTable";
import Link from "next/link";
import React from "react";

interface Props {
  data: {
    bookings: IBooking[];
  };
}

const MyBookings = ({ data }: Props) => {
  const bookings = data?.bookings;

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
          label: "Check Out",
          field: "checkout",
          sort: "asc",
        },
        {
          label: "Amount Paid",
          field: "amountpaid",
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
        checkout: new Date(booking?.checkOutDate).toLocaleString("en-US"),
        amountpaid: `$${booking?.amountPaid}`,
        actions: (
          <div className="table-actions">
            <Link href={`/bookings/${booking._id}`} className="btn btn-outline-primary btn-sm">
              View
            </Link>
            <Link
              href={`/bookings/invoice/${booking._id}`}
              className="btn btn-outline-success btn-sm"
            >
              Invoice
            </Link>
          </div>
        ),
      });
    });

    return data;
  };

  return (
    <div className="container">
      <h1 className="my-5">My Bookings</h1>
      <SimpleDataTable
        data={setBookings()}
        className="px-3"
      />
    </div>
  );
};

export default MyBookings;
