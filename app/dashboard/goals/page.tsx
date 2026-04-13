'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { getGoals, addGoal, deleteGoal, updateGoalSaved, Goal } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Trash2, Plus as PlusCircle } from 'lucide-react'

const GoalProgressChart = dynamic(() => import('@/components/charts/GoalProgressChart'), { ssr: false })

const EMOJIS = ['🎯', '💻', '✈️', '🎮', '📚', '👟', '🏍️', '📱', '🎸', '💎', '🏠', '🌏']

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [addSavingsId, setAddSavingsId] = useState<string | null>(null)
  const [savingsInput, setSavingsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    emoji: '🎯',
  })

  useEffect(() => {
    if (!user) return
    getGoals(user.uid).then(({ data }) => {
      setGoals((data as Goal[]) || [])
      setLoading(false)
    })
  }, [user])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.name || !form.target_amount) return
    setSubmitting(true)
    const { data } = await addGoal({
      firebase_uid: user.uid,
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      saved_amount: 0,
      target_date: form.target_date || null,
      emoji: form.emoji,
    })
    if (data) setGoals((prev) => [...prev, data as Goal])
    setForm({ name: '', target_amount: '', target_date: '', emoji: '🎯' })
    setAddModal(false)
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    await deleteGoal(id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  const handleAddSavings = async (goal: Goal) => {
    const amount = parseFloat(savingsInput)
    if (!amount || amount <= 0 || !goal.id) return
    const newSaved = Number(goal.saved_amount) + amount
    await updateGoalSaved(goal.id, newSaved)
    setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, saved_amount: newSaved } : g))
    setSavingsInput('')
    setAddSavingsId(null)
  }

  const totalSaved = goals.reduce((s, g) => s + Number(g.saved_amount), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)
  const completed = goals.filter((g) => Number(g.saved_amount) >= Number(g.target_amount)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair font-bold text-2xl text-neon-white">Goal Vaults</h1>
          <p className="text-text-muted text-sm mt-1">Save towards what matters most</p>
        </div>
        <Button onClick={() => setAddModal(true)} size="sm">
          <Plus size={14} /> New Goal
        </Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-4 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Saved</p>
            <p className="text-xl font-playfair font-bold text-gold-light">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-4 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Target</p>
            <p className="text-xl font-playfair font-bold text-neon-white">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-4 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Completed</p>
            <p className="text-xl font-playfair font-bold text-green-400">{completed}/{goals.length}</p>
          </div>
        </div>
      )}

      {/* Goal Progress Chart */}
      {goals.length > 1 && (
        <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
          <h2 className="font-playfair font-bold text-base text-neon-white mb-4">Goal Progress Overview</h2>
          <GoalProgressChart data={goals.map(g => ({
            name: `${g.emoji} ${g.name.slice(0, 12)}${g.name.length > 12 ? '…' : ''}`,
            saved: Number(g.saved_amount),
            remaining: Math.max(0, Number(g.target_amount) - Number(g.saved_amount)),
            pct: Math.min(100, (Number(g.saved_amount) / Number(g.target_amount)) * 100),
          }))} />
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-bg-card rounded-2xl animate-pulse border border-metallic-grey/30" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 bg-bg-card border border-metallic-grey/20 rounded-2xl">
          <p className="text-4xl mb-4">🎯</p>
          <p className="text-neon-white font-semibold">No goals yet</p>
          <p className="text-text-muted text-sm mt-1 mb-4">Create a goal vault to start saving towards something meaningful</p>
          <Button size="sm" onClick={() => setAddModal(true)}><Plus size={14} /> Create First Goal</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, (Number(goal.saved_amount) / Number(goal.target_amount)) * 100)
            const done = pct >= 100
            return (
              <div key={goal.id} className={`bg-bg-card border rounded-2xl p-5 ${done ? 'border-green-500/20' : 'border-metallic-grey/20'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <h3 className="font-playfair font-bold text-neon-white">{goal.name}</h3>
                      {goal.target_date && (
                        <p className="text-xs text-text-muted">Target: {formatDate(goal.target_date)}</p>
                      )}
                    </div>
                  </div>
                  {done && <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Done</span>}
                  <button onClick={() => handleDelete(goal.id!)} className="text-text-muted hover:text-red-400 transition-colors p-1 ml-1">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>{formatCurrency(Number(goal.saved_amount))}</span>
                    <span>{Math.round(pct)}%</span>
                    <span>{formatCurrency(Number(goal.target_amount))}</span>
                  </div>
                  <div className="h-2.5 bg-metallic-grey rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: done ? '#22c55e' : 'linear-gradient(90deg, #D4A843, #F2D06B)',
                      }}
                    />
                  </div>
                </div>

                {/* Add savings */}
                {!done && (
                  addSavingsId === goal.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        placeholder="Amount to add (₹)"
                        value={savingsInput}
                        onChange={(e) => setSavingsInput(e.target.value)}
                        className="flex-1 bg-metallic-grey/40 border border-metallic-grey rounded-lg px-3 py-1.5 text-sm text-neon-white placeholder:text-text-muted focus:outline-none focus:border-gold"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleAddSavings(goal)}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddSavingsId(null); setSavingsInput('') }}>✕</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddSavingsId(goal.id!)}
                      className="w-full mt-2 text-xs text-gold flex items-center justify-center gap-1 py-2 rounded-lg border border-gold/20 hover:bg-gold/10 transition-all"
                    >
                      <PlusCircle size={12} /> Add savings
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Create Goal Vault">
        <form onSubmit={handleAdd} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-text-muted block mb-2">Choose Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                    form.emoji === e ? 'bg-gold/20 border border-gold/40' : 'bg-metallic-grey/30 hover:bg-metallic-grey/60'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Goal Name"
            placeholder="e.g. New Laptop"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Target Amount (₹)"
            type="number"
            placeholder="50000"
            prefix="₹"
            value={form.target_amount}
            onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
            required
          />
          <Input
            label="Target Date (optional)"
            type="date"
            value={form.target_date}
            onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Create Vault</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
