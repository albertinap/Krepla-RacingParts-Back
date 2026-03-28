import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function addARS({ container }: ExecArgs) {
  const storeService = container.resolve(Modules.STORE)
  
  const stores = await storeService.listStores()
  const store = stores[0]
  
  await storeService.updateStores(store.id, {
    supported_currencies: [
      ...(store.supported_currencies || []),
      { currency_code: "ars", is_default: true }
    ]
  })
  
  console.log("✅ ARS agregado correctamente")
}