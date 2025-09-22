interface ErrorMessageProps {
  error?: { message?: string }
}
export default function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <>
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error.message || 'An error occurred.'}
        </p>
      )}
    </>
  )
}
