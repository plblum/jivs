/**
 * @inheritdoc jivs-engine/Services/Types/ObjectFinderService
 * 
 * @module jivs-engine/Services/ConcreteClasses/ObjectFinderService
 */

import { IObjectFinderService, ObjectFinderResolution } from '../Interfaces/ObjectFinderService';
import { ServiceBase } from './ServiceBase';

/**
 * An ObjectFinderService that supports this syntax:
 * - "name" - resolves to the model object
 * - "[0].name" requires the model to be an array, and resolves to the first element of that array.
 * - "name1.name2" - property name1, which must be an object or array.
 * - "name1[0].name2" - Starts with property name1's value which must be an array, 
 *      and the first element of that array must be an object with a property name2.
 *      It too must be an object or array.
 * - "name1.name2.name3" - resolves the object associated with the property name2. It must be an object or array.
 * - "name1.name2[0].name3" - resolves the object associated with the property name2, which must be an array. 
 *      The first element of that array must be an object with a property name3. It too must be an object or array.
 * Permitted characters: a-z, A-Z, 0-9, _, ., [, ]. No space, quoted content, etc.
 * 
 * It does NOT validate that the final property name exists on the object. It only resolves the object that hosts it.
 * 
 * This is assigned by default to JivsService.objectFinderService.
 * 
 * ALERT: There are better parsers for path syntax out there. Jivs does not want to
 * have a dependency on a parser library, so this is a simple implementation that works for our needs.
 * Feel free to wire up your preferred parser with an implementation of IObjectFinderService 
 * and assign it to JivsService.objectFinderService.
 */
export class ObjectFinderService
    extends ServiceBase
    implements IObjectFinderService
{
    /**
     * Finds the object that hosts the property specified by the path using our textual syntax.
     * 
     * @param model The root model object or array to search within.
     * @param path The textual path to the desired property. Expects a final property name at the end of the path.
     * @returns An object containing the found object and the property name, or undefined if not found.
     */
    public find(model: object | Array<any>, path: string): ObjectFinderResolution {
        if (!path || path.length === 0) {
            return { object: undefined, propertyName: undefined };
        }
        // reject when there is an invalid character
        if (/[^a-zA-Z0-9_\.\[\]]/.test(path)) {
            return { object: undefined, propertyName: undefined };
        }
        // reject with inappropriate first or last character
        // First cannot be: period, digit, or closing bracket. 
        // Last cannot be: period, opening or closing bracket: Closing must be followed by period + name
        if (/^[\.\d\]]|[\.\[\]]$/.test(path)) {
            return { object: undefined, propertyName: undefined };
        }

        // Split path into segments (handling array indices)
        const segments = this.parsePath(path);
        if (segments.length === 0) {
            return { object: undefined, propertyName: undefined };
        }

        // The last segment is the property name we're looking for
        const propertyName = segments[segments.length - 1].name;

        // Navigate to the parent object
        let currentObject: any = model;
        let segmentStartIndex = 0;

        // Handle [index] at the start of the path
        if (segments[0].name === '' && segments[0].index !== null) {
            if (!Array.isArray(currentObject)) {
                return { object: undefined, propertyName: undefined };
            }
            currentObject = currentObject[segments[0].index];
            segmentStartIndex = 1;
        }

        for (let i = segmentStartIndex; i < segments.length - 1; i++) {
            const segment = segments[i];
            
            if (currentObject === null || currentObject === undefined ||
                segment.error)
            {
                return { object: undefined, propertyName: undefined };
            }

            currentObject = currentObject[segment.name];

            // If this segment has an array index, access that element
            if (segment.index !== null) {
                if (!Array.isArray(currentObject)) {
                    return { object: undefined, propertyName: undefined };
                }
                currentObject = currentObject[segment.index];
            }
        }

        if (currentObject === null || currentObject === undefined) {
            return { object: undefined, propertyName: undefined };
        }

        return { object: currentObject, propertyName };
    }

    private parsePath(path: string): Array<{ name: string, index: number | null, error?: boolean}> {
        const segments: Array<{ name: string, index: number | null, error?: boolean }> = [];
        
        // Check if path starts with [index]
        const leadingArrayMatch = path.match(/^\[([^\]]+)\](.*)$/);
        if (leadingArrayMatch)
        {
            let index = parseInt(leadingArrayMatch[1], 10);
            if (isNaN(index)) {
                return [ { name: '', index: null, error: true } ]; // Invalid index
            }
            segments.push({
                name: '',
                index: index
            });
            if (leadingArrayMatch[2]) {
                path = leadingArrayMatch[2].startsWith('.') ? leadingArrayMatch[2].substring(1) : leadingArrayMatch[2];
            }
        }

        const parts = path.split('.');

        for (const part of parts) {
            if (!part) continue;
            
            // Check if part contains array index notation
            const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
            
            if (arrayMatch) {
                segments.push({
                    name: arrayMatch[1],
                    index: parseInt(arrayMatch[2], 10)
                });
            } else {
                segments.push({
                    name: part,
                    index: null
                });
            }
        }

        return segments;
    }
}