/**
 * TargetErrorMessageDisplayPresentation publishes field errors as events on a shared target element.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TargetErrorMessageDisplayPresentation
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { TriggerState } from '../Interfaces/ErrorMessageDisplayPresentation';
import type { IMessageFrame } from '../Interfaces/IMessageFrame';
import { ElementRole } from '../Interfaces/Types';
import { EditorFocusTrigger } from '../Presentations_common/EditorFocusTrigger';
import { EditorHoverTrigger } from '../Presentations_common/EditorHoverTrigger';
import { jivsMessageContentClass } from '../Presentations_common/MessageFrameBase';
import { resolveElementBySelector } from '../Utilities/Helpers';
import
    {
        TriggeredErrorMessageDisplayPresentationBase,
        TriggeredErrorMessageDisplayPresentationBaseGlobalOptions,
        TriggeredErrorMessageDisplayPresentationBaseOptions
    }
    from './TriggeredErrorMessageDisplayPresentationBase';

/**
 * A triggered error display that sends bubbling events to a shared target instead of modifying its content.
 * The application decides how to present each message and what to show again when it is cleared.
 * 
 * The events are:
 * - 'jivs-message-show': dispatched when a field has validation errors.
 *      Event type: CustomEvent. detail property is an object with the following properties:
 *          - content: HTMLElement representing the message content to be inserted into the target.
 *          - issuesFound: an array of IssueFound objects representing the validation errors for the field.
 *          - valueHost: the IFieldValueHost instance associated with the field.
 * 
 *    ```ts
 *    element.addEventListener('jivs-message-show', (event: CustomEvent<TargetMessageShowDetail>) => {
 *        const detail = event.detail;
 *        console.log(detail.issuesFound, detail.content, detail.valueHost.getElementIdentifier());
 *    });
 *    ```
 * - 'jivs-message-clear': dispatched when a field's validation errors are cleared.
 *      Event type: CustomEvent. detail property is an object with the following properties:
 *          - valueHost: the IFieldValueHost instance associated with the field.
 *
 *    ```ts
 *    element.addEventListener('jivs-message-clear', (event: CustomEvent<TargetMessageClearDetail>) => {
 *        const detail = event.detail;
 *        console.log(detail.valueHost.getElementIdentifier());
 *    });
 *    ```
 * The target should not also be an ARIA live region: the field's ariaerror element already announces
 * the validation message. Hover state cannot be restored after validation refresh, so automatic
 * reopening after refresh is limited to focused editors.
 */
export class TargetErrorMessageDisplayPresentation<
    TOptions extends TargetErrorMessageDisplayPresentationOptions = TargetErrorMessageDisplayPresentationOptions>
    extends TriggeredErrorMessageDisplayPresentationBase<TOptions>
{
    constructor(element: HTMLElement, messageFrame: IMessageFrame, options?: TOptions)
    {
        super(element, options);
        assertNotNull(messageFrame, 'messageFrame');
        this._messageFrame = messageFrame;
    }

    protected override getOptionDefaults(): Partial<TOptions>
    {
        return {
            ...super.getOptionDefaults(),
            showOnFocus: true,
            showOnHover: false
        } as Partial<TOptions>;
    }

    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.targetErrorMessageDisplay;
    }

    protected get messageFrame(): IMessageFrame
    {
        return this._messageFrame;
    }
    private _messageFrame: IMessageFrame;

    private _openTarget?: HTMLElement;
    private _openFieldName?: string;

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-targeterrormessagedisplay');
    }

    protected override setDomServices(valueHostsManager: IValueHostsManager): void
    {
        super.setDomServices(valueHostsManager);
        this.messageFrame.setDomServices(this.domServices);
    }

    protected override resolveOptions(): void
    {
        super.resolveOptions();
        if (this.options.showOnFocus)
            this.options.triggers!.push(new EditorFocusTrigger(0, 0));
        if (this.options.showOnHover)
            this.options.triggers!.push(new EditorHoverTrigger(0, 0));
    }

    public override apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        let wasOpen = this.triggerState === TriggerState.open ||
            this.triggerState === TriggerState.closing;
        super.apply(valueHost, state);

        if (!this.triggerContext)
            return;

        this.close(this.triggerContext, 0);
        if (!this.triggerContext.issuesFound?.length)
            return;

        let editorHasFocus = this.domServices
            .resolveFieldElement(valueHost, ElementRole.editor)
            .some(editor => editor === document.activeElement);
        if (wasOpen || editorHasFocus)
            this.open(this.triggerContext, 0);
    }

    protected override removeIssuesFound(): void
    {
        if (this.triggerContext && this._openTarget)
            this.close(this.triggerContext, 0);
        super.removeIssuesFound();
    }

    /**
     * Generates the element to display from the MessageFrame
     * and forwards it to the target through the jivs-message-show event.
     * @param context 
     * @returns 
     */
    protected override openCore(context: IErrorMessageDisplayTriggerContext): boolean
    {
        if (!context.issuesFound)
            throw new Error('No issues found before opening target message.');

        let target = this.resolveTargetElement(context);
        let fieldName = context.valueHost.getElementIdentifier();
        let content = document.createElement('div');
        content.classList.add(jivsMessageContentClass);
        this.messageFrame.apply(content, context.issuesFound,
            context.valueHost.valueHostsManager, context.valueHost);

        this._openTarget = target;
        this._openFieldName = fieldName;
        lastPresentationByTarget.set(target, this);
        target.dispatchEvent(new CustomEvent<TargetMessageShowDetail>(jivsMessageShowEventName, {
            bubbles: true,
            detail: {
                issuesFound: context.issuesFound,
                content: content,
                valueHost: context.valueHost
            }
        }));
        return true;
    }

    protected override closeCore(_context: IErrorMessageDisplayTriggerContext): boolean
    {
        this.clearOpenTarget();
        return true;
    }

    /**
     * If needed, clears the currently open target and notifies it that the message should be cleared
     * through the jivs-message-clear event.
     */
    private clearOpenTarget(): void
    {
        let target = this._openTarget;
        let fieldName = this._openFieldName;
        this._openTarget = undefined;
        this._openFieldName = undefined;

        if (target && fieldName !== undefined && lastPresentationByTarget.get(target) === this)
        {
            lastPresentationByTarget.delete(target);
            target.dispatchEvent(new CustomEvent<TargetMessageClearDetail>(jivsMessageClearEventName, {
                bubbles: true,
                detail: {
                    valueHost: this.triggerContext!.valueHost
                }
            }));
        }
    }

    private resolveTargetElement(context: IErrorMessageDisplayTriggerContext): HTMLElement
    {
        if (!this.options.targetSelector)
            return this.presentationElement;

        let containerElement = context.domServices.resolveContainerElement(
            context.valueHost.valueHostsManager);
        return resolveElementBySelector(
            this.options.targetSelector,
            context.valueHost.getElementIdentifier(),
            containerElement) ?? this.presentationElement;
    }

    public override dispose(): void
    {
        if (this.triggerContext)
            this.close(this.triggerContext, 0);
        this.clearOpenTarget();
        super.dispose();
        this._messageFrame = undefined as any;
    }
}

/**
 * The event detail for jivs-message-show.
 */
export interface TargetMessageShowDetail
{
    /**
     * The content element to display within the target.
     * This element is not attached to the DOM and should be inserted by the target.
     * Alternatively, you can create content from issuesFound.
     */
    content: HTMLElement;
    issuesFound: IssueFound[];
    valueHost: IFieldValueHost;
}

/**
 * The event detail for jivs-message-clear.
 */
export interface TargetMessageClearDetail
{
    valueHost: IFieldValueHost;
}

/**
 * Event dispatched when a target should display a field's validation messages.
 */
export const jivsMessageShowEventName = 'jivs-message-show';

/**
 * Event dispatched when a target should restore its usage message.
 */
export const jivsMessageClearEventName = 'jivs-message-clear';

export const defaultTargetErrorMessageDisplayPresentationName = 'targetErrorMessageDisplay';

/**
 * Global map of the last presentation by target element.
 * Memory management note:
 * The WeakMap ensures that the last presentation for each target element does not prevent garbage collection.
 * When a target element is removed from the DOM and no other references exist, its entry in this map will be automatically cleared.
 * As a result, there is no dispose function needed for this map.
 */
const lastPresentationByTarget = new WeakMap<HTMLElement, TargetErrorMessageDisplayPresentation>();

/**
 * Global options for target error message displays.
 */
export interface TargetErrorMessageDisplayPresentationGlobalOptions
    extends TriggeredErrorMessageDisplayPresentationBaseGlobalOptions
{
    /**
     * Whether the target should display the message when the editor receives focus.
     * (Uses EditorFocusTrigger internally)
     */
    showOnFocus?: boolean;
    /**
     * Whether the target should display the message when the editor is hovered.
     * (Uses EditorHoverTrigger internally)
     */
    showOnHover?: boolean;
    /**
     * The CSS selector used to identify the target element within the DOM.
     * The events are dispatched to the associated element.
     * It supports the token "{FieldName}" which will be replaced with FieldValueHost.getElementIdentifier()
     * for use like this:
     * targetSelector = '[data-field-name="{FieldName}"]'
     * CSS Encoding is applied to the field name when replacing the token.
     */
    targetSelector?: string;
}

/**
 * Options for configuring a target error message display.
 */
export interface TargetErrorMessageDisplayPresentationOptions
    extends TriggeredErrorMessageDisplayPresentationBaseOptions,
    TargetErrorMessageDisplayPresentationGlobalOptions
{
}
