import EmptyState from "@/app/components/reuseableUI/emptyState";
import LoadingUI from "@/app/components/reuseableUI/loadingUI";
import ModalLayout from "@/app/components/reuseableUI/modalLayout";
import StatusTag from "@/app/components/reuseableUI/statusTag";
import {
  ORDER_DETAIL,
  type OrderDetailData,
} from "@/graphql/queries/orderDetail";
import { useQuery } from "@apollo/client";
import Image from "next/image";

const OrderDetailsModal = ({
  orderId,
  isModalOpen,
  onClose,
}: {
  orderId: string;
  isModalOpen: boolean;
  onClose: () => void;
}) => {
  const { data, loading, error } = useQuery<OrderDetailData>(ORDER_DETAIL, {
    variables: { token: orderId },
    skip: !orderId,
  });
  const order = data?.orderByToken || null;

  return (
    <ModalLayout isModalOpen={isModalOpen} onClose={onClose}>
      <div>
        {loading ? (
          <LoadingUI className="h-[30vh]" />
        ) : error ? (
          <EmptyState text="Unable to load order details." className="h-[30vh]" />
        ) : !order ? (
          <EmptyState text="Order not found." className="h-[30vh]" />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-5 pb-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold font-secondary text-[var(--color-secondary-800)] ">
                  ORDER DETAILS
                </p>
                <StatusTag label={order.statusDisplay || order.status} />
              </div>
              <div className="flex items-center gap-10 uppercase text-[var(--color-secondary-600)] font-normal text-sm font-secondary">
                <div className="flex items-center gap-1">
                  <p>Order Number</p>
                  <p className="text-[var(--color-secondary-800)] font-semibold">
                    {order.number ?? order.id}
                  </p>
                </div>
                <div className="flex items-center  gap-1">
                  <p>Placed on</p>
                  <p className="text-[var(--color-secondary-800)] font-semibold">
                    {new Date(order.created).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-y border-[var(--color-secondary-200)] py-4">
              {order.lines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    {item.thumbnail?.url ? (
                      <Image
                        src={item.thumbnail.url}
                        alt={item.thumbnail.alt || item.productName}
                        className="object-contain w-full h-full"
                        width={150}
                        height={150}
                      />
                    ) : null}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium text-xs md:text-xl">
                      {item.productName}
                      {item.variantName ? ` - ${item.variantName}` : ""}
                    </h3>
                    <p className="text-gray-600 text-xs md:text-sm">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold pl-4 lg:pl-0">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: item.totalPrice.gross.currency,
                    }).format(item.totalPrice.gross.amount)}
                  </div>
                </div>
              ))}
            </div>
            {order.shippingAddress && (
              <div className="border-b pb-4 border-[var(--color-secondary-200)]">
                <h2 className="text-xl font-secondary text-[var(--color-secondary-800)] uppercase font-semibold mb-4">Shipping Address</h2>
                <div className='flex items-center gap-2 text-medium text-xl font-secondary text-[var(--color-secondary-800)]'>
                  {order.shippingAddress?.streetAddress1}
                  {order.shippingAddress?.streetAddress2
                    ? `, ${order.shippingAddress?.streetAddress2}`
                    : ""}
                  {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.countryArea}{" "}

                </div>
                <p className='text-medium text-lg font-secondary text-[var(--color-secondary-500)]'>{order.shippingAddress?.phone}</p>

              </div>
            )}
            {
              order.billingAddress && (
                <div className="border-b pb-4 border-[var(--color-secondary-200)]">
                  <h2 className="text-xl font-secondary text-[var(--color-secondary-800)] uppercase font-semibold mb-4">Billing Address</h2>
                  <p className="text-gray-600">
                    {order.billingAddress?.firstName} {order.billingAddress?.lastName}
                    <br />
                    {order.billingAddress?.streetAddress1}
                    {order.billingAddress?.streetAddress2
                      ? `, ${order.billingAddress?.streetAddress2}`
                      : ""}
                    <br />
                    {order.billingAddress?.city}, {order.billingAddress?.countryArea}{" "}
                    {order.billingAddress?.postalCode}
                  </p>
                </div>
              )}
            {
              order.shippingMethodName && (
                <div className="border-b pb-4 border-[var(--color-secondary-200)]">
                  <h2 className="text-xl font-secondary text-[var(--color-secondary-800)] uppercase font-semibold mb-4">DELIVERY METHOD</h2>
                  <p className="text-gray-600">
                    {order.shippingMethodName}
                  </p>
                </div>
              )}
            <div>
              <h2 className="text-xl uppercase font-secondary font-semibold mb-4">
                Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: order.subtotal.gross.currency,
                    }).format(order.subtotal.gross.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: order.shippingPrice.gross.currency,
                    }).format(order.shippingPrice.gross.amount)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between font-medium text-xl text-[var(--color-secondary-600)]">
                  <span>Total</span>
                  <span className="text-[var(--color-primary-600)] font-semibold">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: order.total.gross.currency,
                    }).format(order.total.gross.amount)}
                  </span>
                </div>
              </div>
            </div>


          </div>
        )}
      </div>
    </ModalLayout>
  );
};

export default OrderDetailsModal;
