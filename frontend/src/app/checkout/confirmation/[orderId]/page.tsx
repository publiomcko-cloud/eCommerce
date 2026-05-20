import { OrderConfirmationPage } from "@/components/order-confirmation-page";

type OrderConfirmationRouteProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderConfirmationRoute({ params }: OrderConfirmationRouteProps) {
  const { orderId } = await params;
  return <OrderConfirmationPage orderId={orderId} />;
}
