import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'biome_timezone';
const AUTO_VALUE  = 'auto'; // sentinel stored when user chooses system auto-detect

/**
 * Resolve the timezone string to pass to Intl APIs.
 * When "auto" (or nothing) is stored, derive from the system via Intl.
 */
const resolveTimezone = (stored) => {
    if (!stored || stored === AUTO_VALUE) {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return stored;
};

const TimezoneContext = createContext({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezonePreference: AUTO_VALUE, // "auto" or an IANA string
    setTimezonePreference: () => {},
});

export { TimezoneContext };
export const useTimezone = () => useContext(TimezoneContext);

export const TimezoneProvider = ({ children }) => {
    const [timezonePreference, setTimezonePreferenceState] = useState(AUTO_VALUE);
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const pref  = saved || AUTO_VALUE;
        setTimezonePreferenceState(pref);
        setTimezone(resolveTimezone(pref));
    }, []);

    const setTimezonePreference = (value) => {
        const pref = value || AUTO_VALUE;
        setTimezonePreferenceState(pref);
        setTimezone(resolveTimezone(pref));
        localStorage.setItem(STORAGE_KEY, pref);
    };

    return (
        <TimezoneContext.Provider value={{ timezone, timezonePreference, setTimezonePreference }}>
            {children}
        </TimezoneContext.Provider>
    );
};
