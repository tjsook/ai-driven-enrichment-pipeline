import { z } from "zod";

export const submitSchema = z.object({
  email: z.string().email(),
  filename: z.string().min(1)
});
