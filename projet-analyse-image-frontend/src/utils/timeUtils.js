/**
 * Format minutes into a human-readable string like "2h 30m" or "1h"
 */
export const formatTimeSpent = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};