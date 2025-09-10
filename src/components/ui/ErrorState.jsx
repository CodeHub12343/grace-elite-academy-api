import { Button } from './Button'

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 p-4">
      <div className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">{title}</div>
      {message && <div className="text-xs text-red-600 dark:text-red-300 mb-3">{message}</div>}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
      )}
    </div>
  )
}

