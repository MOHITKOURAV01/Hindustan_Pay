import { calculateInsights } from '../calculateInsights';
import { Transaction } from '../../types/transaction';

describe('calculateInsights', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      amount: 1000,
      type: 'expense',
      categoryId: 'cat_food',
      date: Date.now(),
      title: 'Lunch',
      isDeleted: false,
      isArchived: false,
      isStarred: false,
      isRecurring: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currency: 'INR',
      notes: null,
      recurrenceRule: null,
      recurrenceEndDate: null,
      parentTransactionId: null
    },
    {
      id: '2',
      amount: 5000,
      type: 'income',
      categoryId: 'cat_salary',
      date: Date.now(),
      title: 'Salary part',
      isDeleted: false,
      isArchived: false,
      isStarred: false,
      isRecurring: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currency: 'INR',
      notes: null,
      recurrenceRule: null,
      recurrenceEndDate: null,
      parentTransactionId: null
    }
  ];

  it('should calculate top category correctly', () => {
    const insights = calculateInsights(mockTransactions);
    const topCatInsight = insights.find(i => i.type === 'TOP_CATEGORY');
    expect(topCatInsight).toBeDefined();
    expect(topCatInsight?.value).toBe(100); // 1000 / 1000 * 100
  });

  it('should calculate savings rate correctly', () => {
    const insights = calculateInsights(mockTransactions);
    const savingsInsight = insights.find(i => i.type === 'SAVINGS_RATE');
    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.value).toBe(80); // (5000-1000)/5000 * 100
  });
});
