/**
 * Provides logging capabilities specifically for the DOM context within the Jivs framework.
 * 
 * @module jivs-dom/Utilities/ConcreteClasses/DomLoggingFacade
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LogDetails, LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';

/**
 * Provides a facade for logging within the DOM context, utilizing the Jivs logging service.
 * It offers utility methods to prepare log details and perform lazy logging based on the logging level.
 */
export class DomLoggingFacade
{
    constructor(jivsServices: IJivsServices)
    {
        this._jivsServices = jivsServices;
    }
    protected get jivsServices(): IJivsServices
    {
        return this._jivsServices;
    }
    private _jivsServices: IJivsServices;

    /**
     * Lazy log based on the level. The gather function is only invoked if the logging level requires it.
     * @param logLevel 
     * @param gatherFn - A function that gathers the log details.
     * Its passed the current instance of DomLoggingFacade as an argument so you can 
     * use its utility methods to create the log details.
     */
    public log(logLevel: LoggingLevel, gatherFn: (facade: DomLoggingFacade) => LogDetails): void
    {
        this.jivsServices.loggingService?.log(logLevel, () => gatherFn(this));
    }
   
    /**
     * Utility to log a message that includes additional data about the source element and
     * target FieldValueHost, if available.
     * The message can include placeholders `{element}` and `{valuehost}` 
     * which will be replaced with the source element's identifier and 
     * the target FieldValueHost's name, respectively.
     * 
     * It also reports the element's ID attribute and the value host's name in the log data.

     * @param message - The log message, which can include placeholders `{element}` and `{valuehost}`.
     * @param element - The source DOM element related to the log message, if available.
     * @param valueHost - The target FieldValueHost, if available.
     * @param type - The object that is the source of the log message. Logging will
     *              convert it into source.constructor.name, if available.
     *              Alternatively a string as the type of source.
     * @param identity - A way to identify the source of this message, such as the ValueHostName or error Code.
     *              If there are several sources, create an array. For example, when reporting a 
     *              validator's error code, it helps to have the ValueHost too:
     *              ['ValueHost', 'ErrorCode']
     * @returns The prepared log details object.
     */
    public prepareLogDetails(message: string, element: HTMLElement | null, 
        valueHost?: IFieldValueHost | null,
        type?: string | object | Function | null, identity?: string | Array<string> | null): LogDetails
    {

        let elementIdAttribute: string | undefined;
        elementIdAttribute = element?.getAttribute('id') ??
            element?.getAttribute('name') ??
            valueHost?.getElementIdentifier();
        let valueHostName: string | undefined;
        if (valueHost)
            valueHostName = valueHost.getName();

        message = message.replaceAll('{element}', elementIdAttribute ?? '')
            .replaceAll('{valuehost}', valueHostName ?? '');
        const details: LogDetails = {
            message: message,
            feature: 'Dom',
            data: { } as Record<string, unknown>
        };
        if (type)
            details.type = type;
        if (identity)
            details.identity = identity;
        if (elementIdAttribute)
            (details.data as any)['idAttribute'] = elementIdAttribute;
        if (valueHostName)
            (details.data as any)['valueHostName'] = valueHostName;

        return details;
    }
}