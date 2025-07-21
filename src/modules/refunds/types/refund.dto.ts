import { z } from "zod";
import { CreateRefundDtoSchema } from "../validations";


export type CreateRefundDto = z.infer<typeof CreateRefundDtoSchema>;
