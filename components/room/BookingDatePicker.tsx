import { IRoom } from "@/backend/models/room";
import { useState } from "react";
import DatePicker from "react-datepicker";

interface Props {
  room: IRoom;
}
const BookingDatePicker = ({ room }: Props) => {
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());

  const onChangeHandler = (dates: Date[]) => {
    const [checkInDate, checkOutDate] = dates;

    setCheckInDate(checkInDate);
    setCheckOutDate(checkOutDate);
    
    console.log(checkInDate, checkOutDate);
  };

  return (
    <div className="booking-card shadow p-4">
      <p className="price-per-night">
        <b>$ {room?.pricePerNight}</b> / night
      </p>
      <hr />
      <p className="mt-5 mb-3">Pick Check In & Check Out Date</p>
      <DatePicker
        className="w-100"
        selected={checkInDate}
        onChange={onChangeHandler}
        startDate={checkInDate}
        endDate={checkOutDate}
        minDate={new Date()}
        selectsRange
        inline
      />
    </div>
  );
};
export default BookingDatePicker;
