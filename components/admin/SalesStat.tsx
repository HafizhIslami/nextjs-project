import React  from "react";

interface Props {
  data: {
    numberOfBookings: string;
    totalSales: string;
    currency?: string;
  };
}

const SalesStat = ({ data }: Props) => {
  return (
    <div className="row dashboard-stats">
      <div className="col-12 col-lg-6">
        <div className="surface-card metric-card">
          <p>Total sales</p>
          <strong>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: data?.currency || "USD",
              maximumFractionDigits: data?.currency === "IDR" ? 0 : 2,
            }).format(Number(data?.totalSales) || 0)}
          </strong>
          <span>For the selected period</span>
        </div>
      </div>
      <div className="col-12 col-lg-6">
        <div className="surface-card metric-card">
          <p>Total transactions</p>
          <strong>{data?.numberOfBookings || 0}</strong>
          <span>For the selected period</span>
        </div>
      </div>
    </div>
  );
};

export default SalesStat;
