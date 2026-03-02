/**
 * Format minutes into a human-readable string like "2h 30m" or "1h"
 */
export const formatTimeSpent = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// ─── Timezone-aware date formatting ─────────────────────────────────────────

/**
 * Resolve a raw timezone value to a valid IANA string.
 * Guards against the 'auto' sentinel and undefined/null.
 */
const resolveIana = (tz) => {
    if (!tz || tz === 'auto') return Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Validate: try to use it; fall back if it throws
    try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return tz;
    } catch {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
};

/**
 * Compute the UTC offset label for a given timezone at a given date.
 * Returns e.g. "UTC+1", "UTC-5", "UTC+5:30".
 *
 * Uses Intl.DateTimeFormat with timeZoneName:'longOffset' which returns a
 * stable "GMT±HH:MM" string — more reliable than parsing locale strings.
 * Falls back to arithmetic offset if longOffset is unsupported.
 */
const getUtcOffsetLabel = (date, timezone) => {
    // Primary: use longOffset (Chrome 95+ / WebView2 modern)
    try {
        const parts = new Intl.DateTimeFormat('en', {
            timeZone: timezone,
            timeZoneName: 'longOffset',
        }).formatToParts(date);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        if (tzPart) {
            const v = tzPart.value; // e.g. "GMT+01:00", "GMT-05:30", "GMT"
            if (v === 'GMT') return 'UTC+0';
            const m = v.match(/GMT([+-])(\d{2}):(\d{2})/);
            if (m) {
                const [, sign, hStr, minStr] = m;
                const h = parseInt(hStr, 10);
                const min = parseInt(minStr, 10);
                return min > 0 ? `UTC${sign}${h}:${minStr}` : `UTC${sign}${h}`;
            }
        }
    } catch { /* fall through to fallback */ }

    // Fallback: compare two en-US locale strings to derive offset arithmetically
    try {
        const tzStr  = new Intl.DateTimeFormat('en-US', { timeZone: timezone,  hour: 'numeric', minute: 'numeric', hour12: false }).format(date);
        const utcStr = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC',     hour: 'numeric', minute: 'numeric', hour12: false }).format(date);
        const toMins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
        let diff = toMins(tzStr) - toMins(utcStr);
        if (diff > 720) diff -= 1440; // wrap across midnight
        if (diff < -720) diff += 1440;
        const sign = diff >= 0 ? '+' : '-';
        const absMin = Math.abs(diff);
        const h = Math.floor(absMin / 60);
        const m = absMin % 60;
        return m > 0 ? `UTC${sign}${h}:${m.toString().padStart(2, '0')}` : `UTC${sign}${h}`;
    } catch {
        return '';
    }
};

/**
 * Format an ISO date string (or Date object) to a localised datetime string
 * with a UTC offset indicator, using the given IANA timezone.
 *
 * Example output: "02/03/2026, 13:15 (UTC+1)"
 *
 * Strategy: compute the UTC offset in minutes, shift the UTC date by that
 * offset, then format with timeZone:'UTC'.  This avoids any potential
 * IANA-named-timezone handling bugs in older WebView2/Chromium builds.
 *
 * @param {string|Date} isoString
 * @param {string} [timezone]  IANA timezone id, e.g. "Europe/Zurich". Defaults to system TZ.
 * @returns {string}
 */
export const formatDateTime = (isoString, timezone) => {
    if (!isoString) return '—';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '—';
        const tz = resolveIana(timezone);

        // 1. Compute the UTC offset in minutes for this timezone at this instant.
        //    We compare 24-hour hours/minutes of tz vs UTC using Intl.
        let offsetMinutes = 0;
        try {
            const fmtOpts = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
            const tzStr  = new Intl.DateTimeFormat('en-US', { timeZone: tz,    ...fmtOpts }).format(date);
            const utcStr = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...fmtOpts }).format(date);
            // Both produce "HH:MM:SS" in 24-hour format
            const toTotalSeconds = (s) => { const [h, m, sec] = s.split(':').map(Number); return h * 3600 + m * 60 + (sec || 0); };
            let diff = toTotalSeconds(tzStr) - toTotalSeconds(utcStr);
            if (diff >  43200) diff -= 86400; // handle midnight-crossing (+/- 12 h wrap)
            if (diff < -43200) diff += 86400;
            offsetMinutes = Math.round(diff / 60);
        } catch { /* offsetMinutes stays 0 */ }

        // 2. Shift the date object into the target timezone's "wall-clock" representation
        //    by simply adding the offset.  When formatted as UTC, the UTC values now
        //    equal the local values in the target timezone — no IANA lookup needed.
        const shifted = new Date(date.getTime() + offsetMinutes * 60000);

        // 3. Format the shifted date as UTC so Intl never touches timezone names.
        const formatted = new Intl.DateTimeFormat(undefined, {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(shifted);

        const offsetLabel = getUtcOffsetLabel(date, tz);
        return offsetLabel ? `${formatted} (${offsetLabel})` : formatted;
    } catch {
        return new Date(isoString).toLocaleString(undefined, { hour12: false });
    }
};

/**
 * Format an ISO date string to a localised date-only string (no time).
 *
 * Example output: "02/03/2026"
 *
 * @param {string|Date} isoString
 * @param {string} [timezone]  IANA timezone id. Defaults to system TZ.
 * @returns {string}
 */
export const formatDateOnly = (isoString, timezone) => {
    if (!isoString) return '—';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '—';
        const tz = resolveIana(timezone);

        // Shift to target TZ wall-clock then display as UTC (same strategy as formatDateTime)
        let offsetMinutes = 0;
        try {
            const fmtOpts = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
            const tzStr  = new Intl.DateTimeFormat('en-US', { timeZone: tz,    ...fmtOpts }).format(date);
            const utcStr = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...fmtOpts }).format(date);
            const toTotalSeconds = (s) => { const [h, m, sec] = s.split(':').map(Number); return h * 3600 + m * 60 + (sec || 0); };
            let diff = toTotalSeconds(tzStr) - toTotalSeconds(utcStr);
            if (diff >  43200) diff -= 86400;
            if (diff < -43200) diff += 86400;
            offsetMinutes = Math.round(diff / 60);
        } catch { /* offsetMinutes stays 0 */ }

        const shifted = new Date(date.getTime() + offsetMinutes * 60000);
        return new Intl.DateTimeFormat(undefined, {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(shifted);
    } catch {
        return String(isoString).split('T')[0];
    }
};

/**
 * Read the saved timezone from localStorage (used in non-React contexts such as services).
 * Falls back to the system timezone detected via Intl.
 */
export const getSavedTimezone = () => {
    try {
        return resolveIana(localStorage.getItem('biome_timezone'));
    } catch {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
};