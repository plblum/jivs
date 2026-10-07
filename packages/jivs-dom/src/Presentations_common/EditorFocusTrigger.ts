import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorTriggerBase } from './EditorTriggerBase';

/**
 * Installs a trigger that opens the error message display when the editor receives or loses focus.
 * It attaches to the 'focusin' event to open and 'focusout' event to close.
 */
export class EditorFocusTrigger extends EditorTriggerBase
{
    protected override attachEventHandlers(editorAnchor: IJivsDomElement, context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventHandler(editorAnchor, context, 'focusin',
            () => context.controller.open(context, this.openDelay));

        this.attachEventHandler(editorAnchor, context, 'focusout',
            () => context.controller.close(context, this.closeDelay));
        
    }
}