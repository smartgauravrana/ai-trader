import { z } from "zod";

const InviteUserSchema = z.object({
  name: z.string().nonempty("Name is required"),
  phone: z.string().nonempty("Phone is required"),
  password: z.string().email("email is required"),
});

export type InviteUserRequest = z.infer<typeof InviteUserSchema>;
export { InviteUserSchema };
