import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const { id, email } = data as any

  await notificationService.createNotifications({
    to: email,
    channel: "email",
    template: "customer-created",
    data: { customer_email: email, store_url: process.env.NEXT_PUBLIC_MEDUSA_URL || "https://krepla-racing-parts.onrender.com" },
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}