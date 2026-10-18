import { internalQuery } from './_generated/server'

/**
 * Post-import check for the Supabase → Convex migration. Internal only:
 *   npx convex run migration:stats          (add --prod for production)
 * Compare with the stats printed by scripts/supabase-to-convex.mjs.
 */
export const stats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    const transactions = await ctx.db.query('transactions').collect()
    const budgetPlans = await ctx.db.query('budget_plans').collect()
    const goals = await ctx.db.query('goals').collect()
    const emi = await ctx.db.query('emi_calculations').collect()

    const round = (n: number) => Math.round(n * 100) / 100
    const sum = (type: 'income' | 'expense') =>
      round(transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0))

    return {
      counts: {
        users: users.length,
        transactions: transactions.length,
        budget_plans: budgetPlans.length,
        goals: goals.length,
        emi_calculations: emi.length,
      },
      totalIncome: sum('income'),
      totalExpense: sum('expense'),
      totalGoalSavings: round(goals.reduce((s, g) => s + g.saved_amount, 0)),
    }
  },
})
