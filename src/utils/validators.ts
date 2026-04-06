import { z } from "zod";

export const transactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Pick a category"),
  paymentMode: z.string().optional(),
  title: z.string().min(1, "Add a short title"),
  notes: z.string().optional(),
  date: z.number(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const goalSchema = z.object({
  title: z.string().min(2, "Name your goal"),
  type: z.enum(["savings", "challenge", "no-spend", "budget"]),
  targetAmount: z.coerce.number().positive(),
  deadline: z.number().optional(),
  categoryId: z.string().optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
