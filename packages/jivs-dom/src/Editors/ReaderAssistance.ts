import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * Used with ReaderOptions.readerFilter to include only replaced elements.
 * It uses these, already prepared by the time this runs:
 * - domService.getInstallCounter()
 * - IJivsElement.jivInstallCounter
 * To return true, both must match: the install counter from the DOM service and the jivInstallCounter from the element.
 * @param valueHost 
 * @returns true when both match.
 */
export function onlyReplacedEditors(valueHost: IFieldValueHost): boolean
{
    const valueHostsManager = valueHost.valueHostsManager;
    const domServices = valueHostsManager.services.domServices;
    const registry = domServices.getElementRegistry(valueHostsManager);
    const elements = Array.from(
        registry.getTextValueAdapterElements(valueHost.getElementIdentifier()));
    if (elements.length === 0)
        return true;    // no editor: let the Reader run so alignEnabled can disable the field

    const currentCounter = domServices.getInstallCounter(valueHostsManager);
    return elements.some(element => element.jivsInstallCounter === currentCounter);

}