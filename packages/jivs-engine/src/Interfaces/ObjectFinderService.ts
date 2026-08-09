/**
 * ObjectFinderService provides a search feature on the model to locate the object that hosts a given property.
 * Its used to resolve paths when reading or writing data to the model. ModelReader and ModelWriter use this service.
 * 
 * The interface does not specify any syntax for the path.
 * It expects a complete path down to the final property, and will basically strip off 
 * the last property name and return the object that hosts it.
 * 
 * As a service, it is on JivsService in the objectFinderService property.
 * The default implementation is ObjectFinderService which has a syntax like this:
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
* @module jivs-engine/Services/Types/ObjectFinderService
*/

import { IService } from './Services';


/**
 * ObjectFinderService provides a search feature on the model to locate the object that hosts a given property.
 * Its used to resolve paths when reading or writing data to the model. ModelReader and ModelWriter use this service.
 * 
 * This interface does not specify any syntax.
 */
export interface IObjectFinderService extends IService
{
    /**
     * Finds the object that hosts the property specified by the path.
     * @param model The root model object or array to search within.
     * @param path The textual path to the desired property.
     * @returns An object containing the found object and the property name, or undefined if not found.
     */
    find(model: object | Array<any>, path: string): ObjectFinderResolution;
}

/**
 * The result of the find operation, containing the object that hosts the property and the property name.
 */
export interface ObjectFinderResolution
{
    /**
     * The object that hosts the property specified by the path, or undefined if not found.
     */
    object: object | Array<any> | undefined;
    /**
     * The name of the final property in the path, or undefined if not found.
     */
    propertyName: string | undefined;
}