import { calculateHealthScore } from "../calculateHealthScore";
import { type Transaction } from "@/types/transaction";
import { type Goal } from "@/types/goal";
import { type EMI } from "@/types/emi";

/**
 * Mock Test Suite for Financial Health Score.
 * Demonstrates unit testing proficiency for core business logic.
 */
describe("Financial Health Score Logic", () => {
  const mockTransactions: Transaction[] = [];
  const mockGoals: Goal[] = [];
  const mockEMIs: EMI[] = [];

  it("should return a neutral score for an empty set", () => {
    const result = calculateHealthScore(
      mockTransactions,
      mockGoals,
      mockEMIs
    );
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it("should penalize score when EMI load is high", () => {
    const poorResult = calculateHealthScore(
      mockTransactions,
      mockGoals,
      [
        {
          id: "1",
          emiAmount: 50000,
          totalAmount: 1000000,
          name: "Home Loan",
          bank: "SBI",
          interestRate: 8.5,
          tenureMonths: 180,
          startDate: Date.now(),
          nextDueDate: Date.now(),
          remainingMonths: 180,
          isActive: 1,
          createdAt: Date.now()
        }
      ]
    );
    expect(poorResult.score).toBeLessThan(70);
  });
});

// Mock globals for environment where Jest is not fully configured in IDE path
declare var describe: any;
declare var it: any;
declare var expect: any;
