/**
 * EditorFocusTrigger installs a trigger that opens the error message display 
 * when the editor receives or loses focus.
 * @module jivs-dom/Presentations_common/ConcreteClasses/EditorFocusTrigger
 */
import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { EditorTriggerBase } from './EditorTriggerBase';

/**
 * Installs a trigger that opens the error message display when the editor receives or loses focus.
 * It attaches to the 'focusin' event to open and 'focusout' event to close.
 */
export class EditorFocusTrigger extends EditorTriggerBase
{
    protected override attachEventHandlers(editor: IJivsElement, context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventHandler(editor, context, 'focusin',
            () => context.controller.open(context, this.openDelay));

        this.attachEventHandler(editor, context, 'focusout',
            () => context.controller.close(context, this.closeDelay));
        
    }
}