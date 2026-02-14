import React, { useState, useEffect } from 'react';

// A custom hook to persist state in localStorage.
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                // The reviver function is crucial to convert ISO date strings back into Date objects.
                return JSON.parse(storedValue, (k, v) => {
                    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(v)) {
                        const d = new Date(v);
                        if (!isNaN(d.getTime())) {
                            return d;
                        }
                    }
                    return v;
                });
            }
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
        }
        // If initialValue is a function, call it to get the initial state
        return initialValue instanceof Function ? initialValue() : initialValue;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export default usePersistentState;