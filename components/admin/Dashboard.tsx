"use client";

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import SalesStat from "./SalesStat";
import { SalesChart } from "../charts/SalesCharts";
import { TopPerformingChart } from "../charts/TopPerformingChart";
import { useLazyGetSalesStatsQuery } from "@/redux/api/bookingApi";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [getSalesStats, { error, data, isLoading }] =
    useLazyGetSalesStatsQuery();

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }
    if (startDate && endDate && !data) {
      getSalesStats({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }
  }, [error, data]);

  const submitHandler = () => {
    getSalesStats({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };
  
  return (
    <div className="ps-4 my-5">
      <div className="d-flex justify-content-start align-items-center">
        <div className="mb-3 me-4">
          <label className="form-label d-block">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date: any) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="form-control"
          />
        </div>
        <div className="mb-3 me-4">
          <label className="form-label d-block">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(date: any) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="form-control"
          />
        </div>
        <button className="btn form-btn ms-4 mt-3 px-5" onClick={submitHandler}>
          Fetch
        </button>
      </div>
      <SalesStat data={data} />
      <div className="row m-auto">
        <div className="col-12 col-lg-7">
          <h4 className="my-5 text-center">Sales History</h4>
          <SalesChart salesData={data?.sixMonthSalesData} />
        </div>

        <div className="col-12 col-lg-5 text-center">
          <h4 className="my-5">Top Performing Rooms</h4>
          {data?.topThreeRooms != 0 ? (
            <TopPerformingChart rooms={data?.topThreeRooms} />
          ) : (
            <h6 className="pt-5">There's no booking room at range of date</h6>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
