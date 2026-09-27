import OrderDetailsClient from "@/components/order/OrderDetailsClient";

export const metadata = { title: "Order details" };

export default function OrderPage({ params }: { params: { id: string } }) {
  return (
    <div className="container order-page">
      <OrderDetailsClient orderId={params.id} />
    </div>
  );
}
