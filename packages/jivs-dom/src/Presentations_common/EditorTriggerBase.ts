import { IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';

/**
 * Installs a trigger that opens the error message display due to event handling on the editor elements.
 */
export abstract class EditorTriggerBase implements IErrorMessageDisplayTrigger
{
    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        let editorAnchors = context.domServices.getElementRegistry(context.valueHost.valueHostsManager)
            .getElementsByRole(ElementRole.editor, context.valueHost.getElementIdentifier());
        for (let editorAnchor of editorAnchors)
        {
            this.attachEventHandlers(editorAnchor, context);
        }
    }
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