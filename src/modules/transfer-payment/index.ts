import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { BigNumberInput } from "@medusajs/types"


type InitiatePaymentContext = {
  amount: BigNumberInput
  currency_code: string
  context: Record<string, unknown>
}

export default class TransferPaymentProvider extends AbstractPaymentProvider {
  static identifier = "transfer"

  async initiatePayment(
    input: Parameters<AbstractPaymentProvider["initiatePayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["initiatePayment"]> {
    return {
      id: "transfer",
      data: {
        status: "pendiente_transferencia",
        cbu: process.env.TRANSFER_CBU,
        alias: process.env.TRANSFER_ALIAS,
        titular: process.env.TRANSFER_TITULAR,
        banco: process.env.TRANSFER_BANCO,
      },
    }
  }

  async authorizePayment(
    input: Parameters<AbstractPaymentProvider["authorizePayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["authorizePayment"]> {
    const paymentSessionData = input.data ?? {}
    return {
      status: "authorized",
      data: { ...paymentSessionData, status: "pagado" },
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return { ...paymentSessionData, status: "capturado" }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return { ...paymentSessionData, status: "cancelado" }
  }

  async refundPayment(
    input: Parameters<AbstractPaymentProvider["refundPayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["refundPayment"]> {
    const paymentSessionData = input.data ?? {}
    return { ...paymentSessionData }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return paymentSessionData
  }

  async updatePayment(
    input: Parameters<AbstractPaymentProvider["updatePayment"]>[0]
  ): ReturnType<AbstractPaymentProvider["updatePayment"]> {
    return { data: input.data ?? {} }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return paymentSessionData
  }

  async getPaymentStatus(
    input: Parameters<AbstractPaymentProvider["getPaymentStatus"]>[0]
  ): ReturnType<AbstractPaymentProvider["getPaymentStatus"]> {
    const paymentSessionData = input.data ?? {}
    const status = paymentSessionData.status as string | undefined
    if (status === "pagado" || status === "capturado") return { status: "captured" }
    if (status === "cancelado") return { status: "canceled" }
    return { status: "pending" }
  }

  async getWebhookActionAndData(
    payload: Parameters<AbstractPaymentProvider["getWebhookActionAndData"]>[0]
  ): ReturnType<AbstractPaymentProvider["getWebhookActionAndData"]> {
    return { action: "not_supported" }
  }
}