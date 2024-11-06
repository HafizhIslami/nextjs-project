import moment from "moment";

export const calculateDayOfStay = (checkInDate: Date, checkOutDate: Date) => {
  const startDate = moment(checkInDate);
  const endDate = moment(checkOutDate);

  return endDate.diff(startDate, "days");
};

export const addCommasToAmount = (amount: string = "0") => {
  return Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
};
