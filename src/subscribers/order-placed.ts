import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const orderService = container.resolve(Modules.ORDER)

  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items", "shipping_address"],
    select: ["id", "email", "customer_id", "created_at", "total", "currency_code",
      "shipping_address.first_name", "shipping_address.last_name",
      "shipping_address.address_1", "shipping_address.city", "shipping_address.phone",
      "items.title", "items.quantity", "items.unit_price"],
  })
  const orderTotal = order.items?.reduce(
    (sum, item) => sum + Number(item.raw_unit_price?.value ?? 0) * (item.quantity ?? 1), 0
  ) ?? 0

  console.log("[ORDER TOTAL]", order.total, typeof order.total)
  console.log("[ITEM]", JSON.stringify(order.items?.[0]))

  if (!order.email) return
  
  if (!order.email) return
  // Email al comprador
  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-placed",
    data: {
      customer_first_name: order.shipping_address?.first_name ?? "Cliente",
      order_id: order.id,
      order_date: new Date(order.created_at).toLocaleDateString("es-AR"),
      order_total: `$${orderTotal.toLocaleString("es-AR")}`,
      shipping_address: `${order.shipping_address?.address_1 ?? ""}, ${order.shipping_address?.city ?? ""}`,
      items: order.items?.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: `$${Number(item.unit_price).toLocaleString("es-AR")}`,
      })) ?? [],
    },
  })

  // Email al dueño
  await notificationService.createNotifications({
    to: process.env.OWNER_EMAIL!,
    channel: "email",
    template: "order-placed-owner",
    data: {
      order_id: order.id,
      order_date: new Date(order.created_at).toLocaleDateString("es-AR"),
      customer_name: `${order.shipping_address?.first_name ?? ""} ${order.shipping_address?.last_name ?? ""}`.trim(),
      customer_email: order.email,
      customer_phone: order.shipping_address?.phone ?? "-",
      order_total: `$${orderTotal.toLocaleString("es-AR")}`,
      shipping_address: `${order.shipping_address?.address_1 ?? ""}, ${order.shipping_address?.city ?? ""}`,
      payment_method: "-",//order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id ?? "-",
      items: order.items?.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: `$${Number(item.unit_price).toLocaleString("es-AR")}`,
      })) ?? [],
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}