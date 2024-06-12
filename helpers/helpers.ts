import moment from "moment";

export const calculateDayOfStay = (checkInDate: Date, checkOutDate: Date) => {
  const startDate = moment(checkInDate);
  const endDate = moment(checkOutDate);

  return endDate.diff(startDate, "days");
};
