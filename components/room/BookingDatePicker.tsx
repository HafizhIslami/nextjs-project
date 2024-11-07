import { IRoom } from "@/backend/models/room";
import { calculateDayOfStay } from "@/helpers/helpers";
import {
  useGetBookedDatesQuery,
  useLazyCheckBookingAvailabilityQuery,
  useLazyStripeCheckoutQuery,
  useNewBookingMutation,
} from "@/redux/api/bookingApi";
import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

interface Props {
  room: IRoom;
}
const BookingDatePicker = ({ room }: Props) => {
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [daysOfStay, setDaysOfStay] = useState(0);
  const [dateSelected, setDateSelected] = useState(false);

  const [newBooking] = useNewBookingMutation();
  const [checkBookingAvailability, { data }] =
    useLazyCheckBookingAvailabilityQuery();

  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const isAvailable = data?.isAvailable;

  const { data: { bookedDates: dates } = {} } = useGetBookedDatesQuery(
    room._id
  );
  const excludeDates = dates?.map((date: string) => new Date(date)) || [];

  const onChangeHandler = (dates: Date[]) => {
    const [checkInDate, checkOutDate] = dates;

    setCheckInDate(checkInDate);
    setCheckOutDate(checkOutDate);

    if (checkInDate && checkOutDate) {
      const days = calculateDayOfStay(checkInDate, checkOutDate);

      setDaysOfStay(days);
      checkBookingAvailability({
        id: room._id,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
      });
      setDateSelected(true);
    } else {
      setDateSelected(false);
    }
  };

  const [stripeCheckout, { error, isLoading, data: checkoutData }] =
    useLazyStripeCheckoutQuery();

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (checkoutData) {
      router.replace(checkoutData?.url);
    }
  }, [error, checkoutData]);

  const bookRoom = () => {
    const amount = room?.pricePerNight * daysOfStay;

    const checkoutData = {
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      daysOfStay,
      amount,
    };

    stripeCheckout({ id: room?._id, checkoutData });
  };

  // const bookRoom = () => {
  //   const bookingData = {
  //     room: room._id,
  //     checkInDate,
  //     checkOutDate,
  //     daysOfStay,
  //     amountPaid: daysOfStay * room.pricePerNight,
  //     paymentInfo: {
  //       id: "STRIPE_ID",
  //       status: "PAID",
  //     },
  //   };

  //   newBooking(bookingData);
  // };

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
        excludeDates={excludeDates}
        selectsRange
        inline
      />
      {isAvailable ? (
        <p className="alert alert-success my-3" hidden={!dateSelected}>
          Room is available. Let's book now!
        </p>
      ) : (
        <p className="alert alert-danger my-3" hidden={!dateSelected}>
          Room is not available. Please select another dates.
        </p>
      )}

      {isAvailable &&
        (isAuthenticated ? (
          <button
            className="btn py-3 form-btn w-100"
            onClick={bookRoom}
            disabled={isLoading}
            hidden={!dateSelected}
          >
            Pay - ${daysOfStay * room?.pricePerNight}
          </button>
        ) : (
          <div className="alert alert-danger my-3 d-flex align-items-center justify-content-between">
            Login to book room
            <a className="btn form-btn mt-0 d-block d-lg-none" href="/login">
              Login
            </a>
          </div>
        ))}
    </div>
  );
};
export default BookingDatePicker;
