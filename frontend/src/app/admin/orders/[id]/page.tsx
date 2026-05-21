import { AdminOrderDetailPage } from "@/components/admin-order-detail-page";

type AdminOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailRoute({ params }: AdminOrderDetailRouteProps) {
  const { id } = await params;
  return <AdminOrderDetailPage orderId={id} />;
}
