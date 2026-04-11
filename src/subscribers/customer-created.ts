import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendVerificationEmail } from "../lib/email"

export default async function customerCreatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  // Medusa maneja el token de verificación internamente
  // Este subscriber avisa al usuario que debe verificar
  const { id, email } = data as any
  await sendVerificationEmail(email, id)
}

export const config: SubscriberConfig = {
  event: "customer.created",
}