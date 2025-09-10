 import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/Button'
import { feesApi, financeAdminApi, paymentsApi } from '../../lib/api'

function Section({ title, children, actions, notice }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="font-medium text-sm sm:text-base">{title}</div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {notice}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

function TextInput({ label, error, register, name, type = 'text', placeholder, className = '', ...rest }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <input className={`mt-1 w-full px-3 py-2 rounded border text-sm ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900`} type={type} placeholder={placeholder} {...register(name)} {...rest} />
      {error && <div className="mt-1 text-xs text-red-600">{error.message}</div>}
    </label>
  )
}

function Select({ label, error, register, name, options = [], className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <select className={`mt-1 w-full px-3 py-2 rounded border text-sm ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900`} {...register(name)}>
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <div className="mt-1 text-xs text-red-600">{error.message}</div>}
    </label>
  )
}

function Banner({ kind = 'success', children }) {
  const cls = kind === 'error' ? 'border-red-200 text-red-700 bg-red-50' : 'border-green-200 text-green-700 bg-green-50'
  return <div className={`px-4 py-2 border rounded ${cls}`}>{children}</div>
}

// Schemas
const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
})

const feeV2Schema = z.object({
  title: z.string().min(2, 'Title is required'),
  amount: z.coerce.number().positive('Amount must be > 0'),
  dueDate: z.string().min(1, 'Due date is required'),
  studentId: z.string().optional(),
  classId: z.string().optional(),
}).refine((d) => !!d.studentId || !!d.classId, { message: 'Provide studentId or classId', path: ['studentId'] })

const invoicesSchema = z.object({
  feeCategoryId: z.string().min(1, 'Category required'),
  amount: z.coerce.number().positive('Amount must be > 0'),
  dueDate: z.string().min(1, 'Due date required'),
  lateFee: z.union([z.coerce.number().nonnegative(), z.literal(NaN)]).optional(),
  studentId: z.string().optional(),
  classId: z.string().optional(),
}).refine((d) => !!d.studentId || !!d.classId, { message: 'Provide studentId or classId', path: ['studentId'] })

function useConfirm() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ title: '', message: '', onConfirm: null })
  function ask({ title, message, onConfirm }) { setState({ title, message, onConfirm }); setOpen(true) }
  function Confirm() {
    if (!open) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div className="relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-5 w-full max-w-md">
          <div className="text-base sm:text-lg font-medium mb-2">{state.title}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{state.message}</div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={() => { const fn = state.onConfirm; setOpen(false); fn && fn() }} className="w-full sm:w-auto">Confirm</Button>
          </div>
        </div>
      </div>
    )
  }
  return { ask, Confirm }
}

export function FinancePage() {
  const [tab, setTab] = useState('invoices')
  const qc = useQueryClient()
  const { ask, Confirm } = useConfirm()

  // Categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['fees', 'categories'],
    queryFn: () => financeAdminApi.listCategories(),
  })
  const categories = categoriesData?.data || categoriesData || []

  const [catMsg, setCatMsg] = useState(null)
  const createCategory = useMutation({
    mutationFn: (payload) => financeAdminApi.createCategory(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fees', 'categories'] }); setCatMsg({ kind: 'success', text: 'Category created' }) },
    onError: (e) => setCatMsg({ kind: 'error', text: e.message }),
  })

  const catForm = useForm({ resolver: zodResolver(categorySchema), defaultValues: { name: '', description: '' } })

  // Invoices listing + issue
  const [invoiceFilters, setInvoiceFilters] = useState({ status: '', classId: '', studentId: '' })
  const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ['fees', 'invoices', invoiceFilters],
    queryFn: () => financeAdminApi.listInvoices(invoiceFilters),
  })
  const invoices = invoicesData?.data || invoicesData || []

  const [invMsg, setInvMsg] = useState(null)
  const createInvoices = useMutation({
    mutationFn: (payload) => financeAdminApi.createInvoices(payload),
    onSuccess: () => { refetchInvoices(); setInvMsg({ kind: 'success', text: 'Invoices issued' }) },
    onError: (e) => setInvMsg({ kind: 'error', text: e.message }),
  })

  const invForm = useForm({ resolver: zodResolver(invoicesSchema), defaultValues: { feeCategoryId: '', amount: '', dueDate: '', lateFee: '', studentId: '', classId: '' } })

  // Fees v2 create
  const [feeMsg, setFeeMsg] = useState(null)
  const createFee = useMutation({
    mutationFn: (payload) => feesApi.create(payload),
    onSuccess: () => setFeeMsg({ kind: 'success', text: 'Fee created' }),
    onError: (e) => setFeeMsg({ kind: 'error', text: e.message }),
  })

  const feeForm = useForm({ resolver: zodResolver(feeV2Schema), defaultValues: { title: '', amount: '', dueDate: '', studentId: '', classId: '' } })

  // Verify tool
  const [verifyRef, setVerifyRef] = useState('')
  const verifyPayment = useMutation({
    mutationFn: (reference) => paymentsApi.verify(reference),
  })

  useEffect(() => {
    if (!['categories','fees','invoices','transactions'].includes(tab)) setTab('invoices')
  }, [tab])

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <Confirm />
      <div className="flex flex-wrap items-center gap-2">
        {['invoices','categories','fees','transactions'].map((t) => (
          <button key={t} className={`px-3 py-2 rounded-md border text-sm ${tab === t ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        <Section
          title="Fee Categories"
          actions={
            <Button
              onClick={catForm.handleSubmit((values) => ask({
                title: 'Create Category',
                message: `Create category "${values.name}"?`,
                onConfirm: () => createCategory.mutate(values),
              }))}
              disabled={createCategory.isPending}
            >
              {createCategory.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          }
          notice={catMsg ? <div className="px-4 py-2"><Banner kind={catMsg.kind}>{catMsg.text}</Banner></div> : null}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-1 space-y-3">
              <TextInput label="Name" name="name" register={catForm.register} error={catForm.formState.errors.name} />
              <TextInput label="Description" name="description" register={catForm.register} error={catForm.formState.errors.description} />
            </div>
            <div className="lg:col-span-2 overflow-auto">
              {categoriesLoading ? 'Loading...' : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories?.length ? categories.map((c) => (
                        <tr key={c._id} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-3 py-2">{c.name}</td>
                          <td className="px-3 py-2">{c.description || '-'}</td>
                        </tr>
                      )) : (
                        <tr><td className="px-3 py-4 text-gray-500" colSpan={2}>No categories</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {tab === 'fees' && (
        <Section title="Create Fee (v2)" notice={feeMsg ? <div className="px-4 py-2"><Banner kind={feeMsg.kind}>{feeMsg.text}</Banner></div> : null}>
          <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" onSubmit={feeForm.handleSubmit((values) => ask({
            title: 'Create Fee',
            message: `Create fee "${values.title}" for ${values.studentId ? 'student' : 'class'}?`,
            onConfirm: () => createFee.mutate({ ...values, amount: Number(values.amount) }),
          }))}>
            <TextInput label="Title" name="title" register={feeForm.register} error={feeForm.formState.errors.title} />
            <TextInput label="Amount (₦)" name="amount" type="number" register={feeForm.register} error={feeForm.formState.errors.amount} />
            <TextInput label="Due Date" name="dueDate" type="date" register={feeForm.register} error={feeForm.formState.errors.dueDate} />
            <TextInput label="Student ID (optional)" name="studentId" register={feeForm.register} error={feeForm.formState.errors.studentId} />
            <TextInput label="Class ID (optional)" name="classId" register={feeForm.register} error={feeForm.formState.errors.classId} />
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={createFee.isPending} className="w-full sm:w-auto">{createFee.isPending ? 'Saving...' : 'Create Fee'}</Button>
            </div>
          </form>
        </Section>
      )}

      {tab === 'invoices' && (
        <div className="space-y-4">
          <Section
            title="Issue Invoices"
            actions={
              <Button
                onClick={invForm.handleSubmit((values) => ask({
                  title: 'Issue Invoices',
                  message: `Issue ${values.studentId ? '1' : 'bulk'} invoice(s)?`,
                  onConfirm: () => createInvoices.mutate({ ...values, amount: Number(values.amount || 0), lateFee: values.lateFee ? Number(values.lateFee) : undefined }),
                }))}
                disabled={createInvoices.isPending}
              >
                {createInvoices.isPending ? 'Issuing...' : 'Issue'}
              </Button>
            }
            notice={invMsg ? <div className="px-4 py-2"><Banner kind={invMsg.kind}>{invMsg.text}</Banner></div> : null}
          >
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3" onSubmit={(e) => e.preventDefault()}>
              <Select label="Category" name="feeCategoryId" register={invForm.register} error={invForm.formState.errors.feeCategoryId} options={(categories || []).map(c => ({ value: c._id, label: c.name }))} />
              <TextInput label="Amount (₦)" name="amount" type="number" register={invForm.register} error={invForm.formState.errors.amount} />
              <TextInput label="Due Date" name="dueDate" type="date" register={invForm.register} error={invForm.formState.errors.dueDate} />
              <TextInput label="Late Fee (%) optional" name="lateFee" type="number" register={invForm.register} error={invForm.formState.errors.lateFee} />
              <TextInput label="Student ID (one)" name="studentId" register={invForm.register} error={invForm.formState.errors.studentId} />
              <TextInput label="Class ID (bulk)" name="classId" register={invForm.register} error={invForm.formState.errors.classId} />
            </form>
          </Section>

          <Section title="Invoices List" actions={<Button onClick={() => refetchInvoices()} disabled={invoicesLoading} className="text-sm">{invoicesLoading ? 'Loading...' : 'Refresh'}</Button>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Status</span>
                <select className="mt-1 w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" value={invoiceFilters.status} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, status: e.target.value })}>
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Class ID</span>
                <input className="mt-1 w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" value={invoiceFilters.classId} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, classId: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Student ID</span>
                <input className="mt-1 w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" value={invoiceFilters.studentId} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, studentId: e.target.value })} />
              </label>
              <div className="flex items-end">
                <Button onClick={() => refetchInvoices()} className="w-full sm:w-auto text-sm">Apply</Button>
              </div>
            </div>

            {invoicesLoading ? 'Loading...' : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-3 py-2">Invoice</th>
                        <th className="text-left px-3 py-2">Student</th>
                        <th className="text-left px-3 py-2">Category</th>
                        <th className="text-left px-3 py-2">Amount</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoices || []).length ? (invoices || []).map((inv) => (
                        <tr key={inv._id} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-3 py-2">{inv._id}</td>
                          <td className="px-3 py-2">{inv.studentId?.name || inv.studentId?._id || '-'}</td>
                          <td className="px-3 py-2">{inv.feeCategoryId?.name || '-'}</td>
                          <td className="px-3 py-2">₦{(inv.amount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 capitalize">{inv.status || 'pending'}</td>
                          <td className="px-3 py-2">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                        </tr>
                      )) : (
                        <tr><td className="px-3 py-4 text-gray-500" colSpan={6}>No invoices</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden">
                  <div className="space-y-4">
                    {(invoices || []).length ? (invoices || []).map((inv) => (
                      <div key={inv._id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {inv.studentId?.name || inv.studentId?._id || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Invoice: {inv._id}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {inv.status || 'pending'}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Category:</span>
                            <span className="text-gray-900 dark:text-white">{inv.feeCategoryId?.name || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Amount:</span>
                            <span className="text-gray-900 dark:text-white font-medium">₦{(inv.amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Due Date:</span>
                            <span className="text-gray-900 dark:text-white">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">No invoices</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </Section>
        </div>
      )}

      {tab === 'transactions' && (
        <Section title="Transactions & Verification" actions={<></>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Paystack Reference</span>
              <input className="mt-1 w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" value={verifyRef} onChange={(e) => setVerifyRef(e.target.value)} />
            </label>
            <div>
              <Button onClick={() => verifyPayment.mutate(verifyRef)} disabled={!verifyRef || verifyPayment.isPending} className="w-full sm:w-auto text-sm">
                {verifyPayment.isPending ? 'Verifying...' : 'Verify Payment'}
              </Button>
            </div>
          </div>
          {verifyPayment.data && (
            <div className="mt-4">
              <Banner>{'Verified' in verifyPayment.data ? 'Verification complete' : 'Result'}</Banner>
              <pre className="mt-2 text-xs whitespace-pre-wrap overflow-x-auto">{JSON.stringify(verifyPayment.data, null, 2)}</pre>
            </div>
          )}
        </Section>
      )}
    </div>
  )
} 

export default FinancePage










