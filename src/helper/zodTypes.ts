import { z } from "zod"

export const id = z.string().cuid()
export const formCategories = z.object({categories: z.object({ label: z.string(), value: z.string() }).array()})

export type  Tid  = z.infer<typeof id>

export const idObj = z.object({"id": id})
