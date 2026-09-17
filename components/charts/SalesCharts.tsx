import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SalesData {
  monthName: string;
  totalSales: number;
  numOfBookings: number;
}

interface Props {
  salesData: SalesData[];
}

export function SalesChart({ salesData }: Props) {
  const options = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: "Last 6 Months Performance",
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const data = {
    labels: salesData?.map((data) => data.monthName).reverse(),
    datasets: [
      {
        label: "Sales ($)",
        data: salesData?.map((data) => data.totalSales).reverse(),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "y",
      },
      {
        label: "Bookings (Qty)",
        data: salesData?.map((data) => data.numOfBookings).reverse(),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        yAxisID: "y1",
      },
    ],
  };
  return (
    <figure className="chart-figure">
      <Line
        options={options}
        data={data}
        role="img"
        aria-label="Sales and booking totals for the last six months"
      />
      <figcaption className="visually-hidden">
        {salesData?.map((item) => (
          <span key={item.monthName}>
            {item.monthName}: ${item.totalSales} in sales and {item.numOfBookings}{" "}
            bookings. {" "}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
