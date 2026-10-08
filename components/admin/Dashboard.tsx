"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DatePicker from "react-datepicker";
import SalesStat from "./SalesStat";
import { useLazyGetSalesStatsQuery } from "@/redux/api/bookingApi";
import toast from "react-hot-toast";

const SalesChart = dynamic(
  () => import("../charts/SalesCharts").then((module) => module.SalesChart),
  { ssr: false, loading: () => <div className="chart-placeholder">Loading chart...</div> }
);
const TopPerformingChart = dynamic(
  () =>
    import("../charts/TopPerformingChart").then(
      (module) => module.TopPerformingChart
    ),
  { ssr: false, loading: () => <div className="chart-placeholder">Loading chart...</div> }
);

const Dashboard = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [getSalesStats, { error, data }] =
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
  }, [data, endDate, error, getSalesStats, startDate]);

  const submitHandler = () => {
    getSalesStats({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };
  
  return (
    <div className="dashboard-overview">
      <div className="dashboard-section-heading">
        <div>
          <span className="eyebrow">Performance</span>
          <h2>Booking overview</h2>
        </div>
      </div>
      <div className="dashboard-filter surface-card">
        <div>
          <label className="form-label d-block" htmlFor="sales_start_date">Start date</label>
          <DatePicker
            id="sales_start_date"
            selected={startDate}
            onChange={(date: Date | null) => {
              if (date) setStartDate(date);
            }}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="form-control"
            dateFormat="MMM d, yyyy"
          />
        </div>
        <div>
          <label className="form-label d-block" htmlFor="sales_end_date">End date</label>
          <DatePicker
            id="sales_end_date"
            selected={endDate}
            onChange={(date: Date | null) => {
              if (date) setEndDate(date);
            }}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="form-control"
            dateFormat="MMM d, yyyy"
          />
        </div>
        <button className="btn btn-primary-roomi" onClick={submitHandler}>
          Update report
        </button>
      </div>
      <SalesStat data={data} />
      <div className="row dashboard-charts">
        <section className="col-12 col-xl-7" aria-labelledby="sales-history-heading">
          <div className="surface-card chart-card">
          <h3 id="sales-history-heading">Sales history</h3>
          <SalesChart salesData={data?.sixMonthSalesData} />
          </div>
        </section>

        <section className="col-12 col-xl-5" aria-labelledby="top-rooms-heading">
          <div className="surface-card chart-card">
          <h3 id="top-rooms-heading">Top performing rooms</h3>
          {data?.topThreeRooms != 0 ? (
            <TopPerformingChart rooms={data?.topThreeRooms} />
          ) : (
            <p className="empty-chart">No bookings were found in this date range.</p>
          )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
