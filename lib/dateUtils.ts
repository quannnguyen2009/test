export function toUTC7(date: Date | string | null): Date | null {
    if (!date) return null
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    return d
}

/**
 * Formats a date to YYYY-MM-DDTHH:mm for datetime-local input, 
 * forced to UTC+7 perspective.
 */
export function formatToUTC7Input(date: Date | string | null): string {
    if (!date) return ""
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""

    // Add 7 hours to UTC to get UTC+7
    const utc7 = new Date(d.getTime() + 7 * 60 * 60 * 1000)
    return utc7.toISOString().slice(0, 16)
}

/**
 * Parses a YYYY-MM-DDTHH:mm string from a datetime-local input,
 * assuming it was entered in UTC+7.
 */
export function parseFromUTC7Input(dateStr: string | null): Date | null {
    if (!dateStr) return null
    // Append +07:00 to the string so the Date constructor treats it as UTC+7
    const d = new Date(dateStr + "+07:00")
    if (isNaN(d.getTime())) return null
    return d
}
