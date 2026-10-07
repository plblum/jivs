import { IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';

/**
 * Installs a trigger that opens the error message display due to event handling on the editor elements.
 * 
 * Triggers can impose delays on when the error message display is opened or closed.
 * Those delays have defaults that can be overridden in the constructor.
 * In this class, those defaults are 500 milliseconds for both opening and closing the error message display.
 */
export abstract class EditorTriggerBase implements IErrorMessageDisplayTrigger
{
    /**
     * Initializes a new instance of the EditorTriggerBase class with optional open and close delays.
     * @param openDelay - The delay in milliseconds before the error message display is opened.
     * Use 0 to open the error message display immediately.
     * @param closeDelay - The delay in milliseconds before the error message display is closed.
     * Use 0 to close the error message display immediately.
     */
    constructor(openDelay?: number, closeDelay?: number)
    {
        this._openDelay = openDelay ?? this.defaultOpenDelay();
        this._closeDelay = closeDelay ?? this.defaultCloseDelay();
    }

    /**
     * Gets the delay in milliseconds before the error message display is opened.
     * Use 0 to open the error message display immediately.
     */
    protected get openDelay(): number
    {
        return this._openDelay;
    }
    private _openDelay: number = 0;

    protected defaultOpenDelay(): number
    {
        return 500;
    }

    /**
     * Gets the delay in milliseconds before the error message display is closed.
     * Use 0 to close the error message display immediately.
     */
    protected get closeDelay(): number
    {
        return this._closeDelay;
    }
    private _closeDelay: number = 0;

    protected defaultCloseDelay(): number
    {
        return 500;
    }

    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        let editorAnchors = context.domServices.resolveFieldElement(context.valueHost, ElementRole.editor);
        for (let editorAnchor of editorAnchors)
        {
            this.attachEventHandlers(editorAnchor, context);
        }
    }
    /**
     * Attaches the necessary event handlers to the specified editor element.
     * This method should be implemented by subclasses to define specific event handling behavior for the editor element.
     * Consider using the `attachEventHandler` utility method to simplify attaching event handlers.
     * 
     * @param editorAnchor The editor element to attach event handlers to.
     * @param context The context of the error message display trigger.
     */
    protected abstract attachEventHandlers(editorAnchor: IJivsDomElement, context: IErrorMessageDisplayTriggerContext): void;

    /**
     * Utility method to attach an event handler to the editor element.
     * @param editorAnchor The editor element to attach the event handler to.
     * @param context The context of the error message display trigger.
     * @param eventType The type of the event to listen for.
     * @param handler The function to be called when the event is triggered.
     */
    protected attachEventHandler(editorAnchor: IJivsDomElement, context: IErrorMessageDisplayTriggerContext,
        eventType: string, handler: () => void): void
    {
        editorAnchor.jivsEditorAdapterDefinition?.attachEventHandler(
            editorAnchor, context.valueHost, eventType, handler
        );
    }
}