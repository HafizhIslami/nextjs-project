import { IRoom } from "@/backend/models/room";
import { calculateDayOfStay } from "@/helpers/helpers";
import { useNewBookingMutation } from "@/redux/api/bookingApi";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";

interface Props {
  room: IRoom;
}
const BookingDatePicker = ({ room }: Props) => {
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [daysOfStay, setDaysOfStay] = useState(0);

  const [newBooking, { isLoading, isSuccess, error }] = useNewBookingMutation();

  useEffect(() => {
    if (error && "data" in error) {
      toast.error(error?.data?.errMessage);
    }
  }, [error]);

  const onChangeHandler = (dates: Date[]) => {
    const [checkInDate, checkOutDate] = dates;

    setCheckInDate(checkInDate);
    setCheckOutDate(checkOutDate);

    if (checkInDate && checkOutDate) {
      const days = calculateDayOfStay(checkInDate, checkOutDate);

      setDaysOfStay(days);
    }
  };

  const bookRoom = () => {
    const bookingData = {
      roomId: room._id,
      checkInDate,
      checkOutDate,
      daysOfStay,
      amountPaid: daysOfStay * room.pricePerNight,
      paymentInfo: {
        id: "STRIPE_ID",
        status: "PAID",
      },
    };

    newBooking(bookingData);
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
      <button className="btn py-3 form-btn p-4" onClick={bookRoom}>
        {isLoading ? "Loading..." : "Book Now"}
      </button>
    </div>
  );
};
export default BookingDatePicker;