import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const orderService = container.resolve(Modules.ORDER)

  const order = await orderService.retrieveOrder(data.id)

  if (!order.customer_id) {
    console.log(`El pedido ${order.id} no tiene customer asociado, se omite el email.`)
    return
  }

  if (!order.email) return
  // Notificamos al comprador que su pedido fue actualizado
  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-updated",
    data: { order_id: order.id },
  })
}

export const config: SubscriberConfig = {
  event: "order.updated",
}