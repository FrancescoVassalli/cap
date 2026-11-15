const INTAKE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidIntakeId(id: string | undefined): id is string {
  return Boolean(id && INTAKE_ID_PATTERN.test(id))
}
