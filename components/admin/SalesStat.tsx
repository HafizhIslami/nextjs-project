import { addCommasToAmount } from "@/helpers/helpers";
import React  from "react";

interface Props {
  data: {
    numberOfBookings: string;
    totalSales: string;
  };
}

const SalesStat = ({ data }: Props) => {
  return (
    <div className="row dashboard-stats">
      <div className="col-12 col-lg-6">
        <div className="surface-card metric-card">
          <p>Total sales</p>
          <strong>${addCommasToAmount(data?.totalSales) || 0}</strong>
          <span>For the selected period</span>
        </div>
      </div>
      <div className="col-12 col-lg-6">
        <div className="surface-card metric-card">
          <p>Total bookings</p>
          <strong>{data?.numberOfBookings || 0}</strong>
          <span>For the selected period</span>
        </div>
      </div>
    </div>
  );
};

export default SalesStat;
