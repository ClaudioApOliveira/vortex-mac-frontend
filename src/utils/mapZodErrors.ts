type ZodIssue = { path: PropertyKey[]; message: string }

export function mapZodErrors<T extends Record<string, string | undefined>>(
  error: { issues: ZodIssue[] } | undefined,
): T {
  const errors = {} as T
  if (!error) return errors

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof T
    if (!errors[path]) {
      errors[path] = issue.message as T[keyof T]
    }
  }

  return errors
}
