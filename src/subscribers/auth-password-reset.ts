import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function authPasswordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
    if (data.actor_type !== "customer") return

    const notificationService = container.resolve(Modules.NOTIFICATION)
    const customerService = container.resolve(Modules.CUSTOMER)

    const [customer] = await customerService.listCustomers({ email: data.entity_id })
    if (!customer?.email) return

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${data.token}`

    await notificationService.createNotifications({
    to: customer.email,
    channel: "email",
    template: "reset-password",
    data: {
        customer_first_name: customer.first_name ?? "Cliente",
        reset_url: resetUrl,
    },
    })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}