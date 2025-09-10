import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  status: z.enum(['active', 'inactive']).default('active'),
})

export function TeacherForm({ onSubmit, defaultValues }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { name: '', subject: '', status: 'active' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="text-sm">Name</label>
        <input className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" {...register('name')} />
        {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name.message}</div>}
      </div>
      <div>
        <label className="text-sm">Subject</label>
        <input className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" {...register('subject')} />
        {errors.subject && <div className="text-xs text-red-500 mt-1">{errors.subject.message}</div>}
      </div>
      <div>
        <label className="text-sm">Status</label>
        <select className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" {...register('status')}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={isSubmitting} className="px-3 py-2 rounded-md bg-primary text-white">Save</button>
      </div>
    </form>
  )
}




























