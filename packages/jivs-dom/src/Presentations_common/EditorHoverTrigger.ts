/**
 * EditorHoverTrigger installs a trigger that opens the error message display 
 * when the editor handles mouseenter and mouseleave events.
 * @module jivs-dom/Presentations_common/ConcreteClasses/EditorHoverTrigger
 */
import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { EditorTriggerBase } from './EditorTriggerBase';

/**
 * Installs a trigger that opens the error message display when the editor handles mouseenter and mouseleave events.
 * It attaches to the 'mouseenter' event to open and 'mouseleave' event to close.
 */
export class EditorHoverTrigger extends EditorTriggerBase
{
    protected override attachEventHandlers(editor: IJivsElement, context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventHandler(editor, context, 'mouseenter',
            () => context.controller.open(context, this.openDelay));

        this.attachEventHandler(editor, context, 'mouseleave',
            () => context.controller.close(context, this.closeDelay));
        
    }
}