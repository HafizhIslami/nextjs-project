"use client";

import React, { useState } from "react";
import RoomItem from "./room/RoomItem";
import { IRoom } from "@/backend/models/room";
import CustomPagination from "./layout/CustomPagination";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DropdownPage from "./layout/DropdownPage";

interface Props {
  data: {
    success: boolean;
    resPerPage: number;
    filteredRoomsCount: number;
    rooms: IRoom[];
  };
}

// this script still defect by allRooms fn. check later in roomControllers.ts
const Home = ({ data }: Props) => {
  // const [reqEntries, setReqEntries] = useState(4);
  const { rooms, resPerPage, filteredRoomsCount } = data;
  const searchParams = useSearchParams();
  const filter =
    searchParams.has("location") ||
    searchParams.has("category") ||
    searchParams.has("guests");

  // const reqEntriesHandler = (totalEntry: number) => {
  //   setReqEntries(totalEntry);
  //   console.log(totalEntry);
  // };
  return (
    <div>
      <section id="rooms" className="container mt-5">
        <h2 className="mb-3 ml-2 stays-heading">
          {!filter
            ? "All Rooms"
            : filteredRoomsCount > 1
            ? `${filteredRoomsCount} rooms found` //better only use "found in ${location}" if use fix location name
            : `${filteredRoomsCount} room found`}
        </h2>
        <Link href="/search" className="ml-2 back-to-search">
          <i className="fa fa-arrow-left me-2"></i> Back to Search
        </Link>
        {/* <div className="container">
          <DropdownPage reqEntries={reqEntriesHandler}/>
        </div> */}
        <div className="row mt-4">
          {rooms?.length === 0 ? (
            <div className="alert alert-danger mt-5 w-100">
              <b>No Rooms</b>
            </div>
          ) : (
            rooms?.map((room: any) => <RoomItem key={room._id} room={room} />)
          )}
        </div>
      </section>
      <CustomPagination
        resPerPage={resPerPage}
        filteredRoomsCount={filteredRoomsCount}
      />
    </div>
  );
};

export default Home;
