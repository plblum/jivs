export interface IDisposable
{
    /**
     * If the user needs to abandon this instance, they should use this to 
     * clean up active resources (like timers) and to release memory that
     * would stall the garbage collector from disposing this object.
     * It should assign any object reference to undefined as a strong indicator
     * that the object has been disposed.
     */
    dispose(): void;        
}

/**
 * Determines if the object implements IDisposable.
 * @param source 
 * @returns source typecasted to IDisposable if appropriate or null if not.
 */
export function toIDisposable(source: any): IDisposable | null
{
    if (source != null &&   // null and undefined
        typeof source === 'object')
    {
        let temp = source as IDisposable;
        if (temp.dispose !== undefined)
            return temp;
    }
    return null;
}