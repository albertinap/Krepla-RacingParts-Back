import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string; no_notification: boolean }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const orderService = container.resolve(Modules.ORDER)

  console.log("[FULFILLMENT DATA]", JSON.stringify(data))

  const order = await orderService.retrieveOrder(data.order_id, {
    relations: ["items", "shipping_address", "shipping_methods"],
    select: ["id", "email", "customer_id", "created_at", "status",
      "shipping_address.first_name", "shipping_address.last_name",
      "shipping_address.address_1", "shipping_address.city",
      "items.title", "items.quantity", "items.unit_price", "items.raw_unit_price",
      "shipping_methods.name", "shipping_methods.shipping_option_id"],
  })
  console.log("[FULFILLMENT] order recuperado:", order.id, "customer_id:", order.customer_id, "email:", order.email)
  console.log("[FULFILLMENT] shipping_methods:", JSON.stringify(order.shipping_methods))

  if (!order.customer_id) return
  if (!order.email) return

  // No notificar si eligió retiro en local
  const isRetiroLocal = order.shipping_methods?.some(
    (m) => m.shipping_option_id === "so_01KNHM0A26AVXXVA4CDAXJJGNS"
  )
  if (isRetiroLocal) return

  const orderTotal = order.items?.reduce(
    (sum, item) => sum + Number(item.raw_unit_price?.value ?? 0) * (item.quantity ?? 1), 0
  ) ?? 0

  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-updated",
    data: {
      customer_first_name: order.shipping_address?.first_name ?? "Cliente",
      order_id: order.id,
      order_date: new Date(order.created_at).toLocaleDateString("es-AR"),
      order_total: `$${orderTotal.toLocaleString("es-AR")}`,
      order_status: "Enviado",
      shipping_method: order.shipping_methods?.[0]?.name ?? "",
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}