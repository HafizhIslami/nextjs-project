import { IRoom } from "@/backend/models/room";
import { calculateDayOfStay } from "@/helpers/helpers";
import {
  useGetBookedDatesQuery,
  useLazyCheckBookingAvailabilityQuery,
  useLazyStripeCheckoutQuery,
} from "@/redux/api/bookingApi";
import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
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

  const [show, setShow] = useState(false);

  const [checkBookingAvailability, { data, isFetching: isChecking }] =
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
  }, [checkoutData, error, router]);

  const paymentInstructionHandler = () => {
    setShow(true);
  };

  const closePaymentInstructions = () => {
    setShow(false);
  };

  const bookRoom = () => {
    const amount = room?.pricePerNight * daysOfStay;

    const checkoutData = {
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      daysOfStay,
      amount,
    };

    setShow(false);
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
    <div className="booking-card">
      <div className="booking-price-row">
        <p className="price-per-night">
          <b>${room.pricePerNight}</b> <span>/ night</span>
        </p>
        <span className="secure-label">Secure checkout</span>
      </div>
      <hr />
      <p className="booking-instruction">Select check-in and check-out dates</p>
      <div className="booking-calendar">
        <DatePicker
          selected={checkInDate}
          onChange={onChangeHandler}
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={new Date()}
          excludeDates={excludeDates}
          selectsRange
          inline
        />
      </div>

      <div aria-live="polite">
        {isChecking && dateSelected && (
          <p className="availability-message checking">Checking availability...</p>
        )}
        {!isChecking && dateSelected && isAvailable === true && (
          <p className="availability-message available">
            Available for {daysOfStay} {daysOfStay === 1 ? "night" : "nights"}.
          </p>
        )}
        {!isChecking && dateSelected && isAvailable === false && (
          <p className="availability-message unavailable">
            Those dates are unavailable. Please choose another range.
          </p>
        )}
      </div>

      {dateSelected && isAvailable && (
        <div className="booking-summary">
          <span>
            ${room.pricePerNight} x {daysOfStay} {daysOfStay === 1 ? "night" : "nights"}
          </span>
          <strong>${daysOfStay * room.pricePerNight}</strong>
        </div>
      )}

      {isAvailable &&
        (isAuthenticated ? (
          <button
            className="btn btn-primary-roomi w-100"
            onClick={paymentInstructionHandler}
            disabled={isLoading}
            hidden={!dateSelected}
          >
            Review and continue - ${daysOfStay * room.pricePerNight}
          </button>
        ) : (
          dateSelected && (
            <div className="login-to-book">
              <p>Log in to continue with this booking.</p>
              <Link className="btn btn-secondary-roomi w-100" href="/login">
                Log in to book
              </Link>
            </div>
          )
        ))}

      <p className="booking-footnote">You will review the details before payment.</p>

      <Modal show={show} onHide={closePaymentInstructions} centered>
        <Modal.Header closeButton>
          <Modal.Title>Review payment details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You are booking <strong>{room.name}</strong> for {daysOfStay}{" "}
            {daysOfStay === 1 ? "night" : "nights"}.
          </p>
          <div className="modal-booking-total">
            <span>Total</span>
            <strong>${daysOfStay * room.pricePerNight}</strong>
          </div>
          <div className="test-payment-note">
            <strong>Test payment only</strong>
            <p>
              Use card 4242 4242 4242 4242, any future expiry date, and any
              three-digit CVC on Stripe&apos;s checkout page.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={closePaymentInstructions}>
            Cancel
          </Button>
          <Button className="btn-primary-roomi" onClick={bookRoom} disabled={isLoading}>
            Continue to secure payment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
export default BookingDatePicker;
