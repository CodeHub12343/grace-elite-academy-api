export function Input(props) {
  return <input {...props} className={`w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${props.className || ''}`} />
}


