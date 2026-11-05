/**
 * PopupErrorMessageDisplayPresentation provides a presentation for displaying error messages in a popup.
 * It manages the interaction between the presentation element, the popup mechanism, and the error message content.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/PopupErrorMessageDisplayPresentation
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { resolveElementBySelector } from '../Utilities/Helpers';
import { defaultAriaPopupShowsValidationErrors, PopupErrorMessageDisplayStaticUpdater } from '../Aria/PopupErrorMessageDisplayStaticUpdater';
import { IAriaStaticUpdater } from '../Interfaces/AriaUpdaters';
import { IElementRegistry } from '../Interfaces/ElementRegistry';
import { IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext, TriggerState } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IErrorIndicatorContent } from '../Interfaces/IErrorIndicatorContent';
import { IMessageFrame } from '../Interfaces/IMessageFrame';
import { IPopupContext, IPopupMechanism, IPopupService } from '../Interfaces/PopupErrorMessageDisplays';
import { ElementRole } from '../Interfaces/Types';
import { ErrorMessageDisplayClickTrigger } from '../Presentations_common/ErrorMessageDisplayClickTrigger';
import { ErrorMessageDisplayFocusInTrigger } from '../Presentations_common/ErrorMessageDisplayFocusInTrigger';
import { ErrorMessageDisplayFocusOutTrigger } from '../Presentations_common/ErrorMessageDisplayFocusOutTrigger';
import { ErrorMessageDisplayKeyAsClickTrigger } from '../Presentations_common/ErrorMessageDisplayKeyAsClickTrigger';
import { ErrorMessageDisplayMouseOutTrigger } from '../Presentations_common/ErrorMessageDisplayMouseOutTrigger';
import { ErrorMessageDisplayMouseOverTrigger } from '../Presentations_common/ErrorMessageDisplayMouseOverTrigger';
import { TriggeredErrorMessageDisplayPresentationBase, TriggeredErrorMessageDisplayPresentationBaseGlobalOptions, TriggeredErrorMessageDisplayPresentationBaseOptions } from './TriggeredErrorMessageDisplayPresentationBase';
import { jivsMessageContentClass } from '../Presentations_common/MessageFrameBase';
import { EditorFocusTrigger } from '../Presentations_common/EditorFocusTrigger';
import { EditorHoverTrigger } from '../Presentations_common/EditorHoverTrigger';

/**
 * A presentation class for displaying error messages in a popup.
 * Its presentation element is mostly just a button to trigger a popup.
 * The popup is entirely separate from the presentation element itself
 * and managed by a popup mechanism that is assigned to IJivsDomService.popupMechanism.
 * 
 * ## Configuring the Presentation and Popup
 * - Presentation Element is just the element the user uses to anchor the button for triggering the popup.
 *   - These CSS classes get installed: 
 *      - 'jivs-popuperrormessagedisplay'
 *      - 'jivs-triggerederrormessagedisplay'
 *      - 'jivs-errormessagedisplay'
 *      - options.variationClasses
 *   - It establishes these event handlers for triggering the popup:
 *      - click - triggers the popup immediately.
 *      - options.mouseoverEnabled - mouseover and mouseout events for triggering the popup with delays also
 *          specified from options.mouseoverDelay and options.mouseoutDelay.
 * - Presentation Element content uses an implementation of IErrorIndicatorContent, supplied through the constructor.
 *   - The ErrorIndicatorContent class provides up to 3 columns for content like icons and text. Its own options
 *     determine those contents.
 *     new ErrorIndicatorContent({ column1Html: 'icon' });
 * - Popups get their containing element from the Popup Mechanism. It establishes its event handlers and CSS on that element.
 *   - Configuration is specific to the needs of the PopupMechanism being used and is provided through the popupOptions parameter of the constructor. 
 *      That configuration may supply positioning rules and styling information.
 * - Popups content uses an implementation of IMessageFrame, supplied through the popupContent parameter of the constructor.
 *   It is the same IMessageFrame as used in InlinePopupErrorMessageDisplayPresentation, meaning the structure and styling
 *   is consistent with that usage. Each MessageFrame has its own options for configuration.
 *   - MessageFrame class - just wraps the Message Content directly
 *      new MessageFrame({ messagesLimit: 2 });
 *   - HeaderFooterMessageFrame class - provides a structure with a header and footer around the Message Content.
 *      new HeaderFooterMessageFrame({ headerHtml: 'Header', footerHtml: 'Footer' });
 *   - IconMessageFrame class - provides a structure with an icon alongside the Message Content.
 *      new IconMessageFrame({ imageSrc: 'url to the image' });
 * 
 * The popupOptions has a structure defined specifically by the popup mechanism being used.
 * Its type is associated with the TPopupOptions generic parameter of the PopupErrorMessageDisplayPresentation class.
 * 
 * To popup, the presentation.open() function will invoke the popup mechanism to display the popup according to the configured popupOptions.
 * - Triggers installed on the button (click and optional mouseover)
 * - Triggers installed on other elements supplied by options.triggers.
 * To pop down, there are several cases:
 * - Triggers installed on the button (optional mouseout) and on other elements supplied by options.triggers.
 *   They use presentation.close() internally.
 * - The popup mechanism itself may trigger hiding the popup, for example when clicking outside the popup.
 *   Its PopupMechanism must call context.controller.closed() to notify that the popup has been closed.
 * - Programmatic calls to presentation.close() to hide the popup.
 * - domServices.popupService.closePopups()
 * 
 * Popups need positioning between two elements:
 * - Anchor - The element to which the popup is aligned.
 * - Popup - The popup element itself.
 * The Anchor defaults to the presentation element itself. However, it can be anything else
 * by specifying a different Anchor element through the anchorSelector option.
 */
export class PopupErrorMessageDisplayPresentation<
    TPopupMechanismOptions extends object = object,
    TOptions extends PopupErrorMessageDisplayPresentationOptions = PopupErrorMessageDisplayPresentationOptions>
    extends TriggeredErrorMessageDisplayPresentationBase<TOptions>
{

    /**
     * Initializes a new instance of the PopupErrorMessageDisplayPresentation class.
     * @param element - The presentation element
     * @param indicatorContent - Generates the content for the presentation element.
     * @param popupContent - Generates the content for the popup element. It is IMessageFrame,
     * so it always includes the Message Content itself plus wraps it based on the MessageFrame
     * class selected.
     * @param popupMechanismOptions - The options that instruct the popup mechanism on how to display the popup.
     * It usually has positioning and styling information to use on the outer element of the popup.
     * @param options - The options that configure the presentation itself, such as triggers and delays.
     */
    constructor(
        element: HTMLElement,
        indicatorContent: IErrorIndicatorContent,
        popupContent: IMessageFrame,
        popupMechanismOptions?: TPopupMechanismOptions,
        options?: TOptions
    )
    {
        super(element, options);
        assertNotNull(indicatorContent, 'errorIndicator');
        assertNotNull(popupContent, 'popupContent');
        this._indicatorContent = indicatorContent;
        this._popupContent = popupContent;
        this._popupOptions = popupMechanismOptions ?? {} as TPopupMechanismOptions;
    }

    protected override getOptionDefaults(): Partial<TOptions>
    {
        let superDefaults = super.getOptionDefaults();
        return {
            ...superDefaults,
            popupOnHover: false,
            mouseoverDelay: defaultMouseoverDelay,
            mouseoutDelay: defaultMouseoutDelay,
            popupOnFocus: false,
            focusInDelay: defaultFocusInDelay,
            focusOutDelay: defaultFocusOutDelay,
            popupOnHoverOverEditor: false,
            popupOnFocusInEditor: false,
            keyboardPopupEnabled: true,
            ariaPopupMessage: defaultAriaPopupShowsValidationErrors
        };
    }
    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.popupErrorMessageDisplay;
    }

    protected get popupMechanism(): IPopupMechanism | undefined
    {
        return this._popupMechanism;
    }
    private _popupMechanism?: IPopupMechanism;

    protected get popupService(): IPopupService | undefined
    {
        return this._popupService;
    }
    private _popupService?: IPopupService;

    /**
     * Gets the indicator content for the presentation element.
     */
    protected get indicatorContent(): IErrorIndicatorContent
    {
        return this._indicatorContent;
    }
    private _indicatorContent: IErrorIndicatorContent;

    protected get popupContent(): IMessageFrame
    {
        return this._popupContent;
    }
    private _popupContent: IMessageFrame;


    protected get popupOptions(): TPopupMechanismOptions | undefined
    {
        return this._popupOptions;
    }
    private _popupOptions?: TPopupMechanismOptions;


    private _elementRegistry?: IElementRegistry;

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-popuperrormessagedisplay');
    }

    protected reviseTriggers(triggers: IErrorMessageDisplayTrigger[])
    {
        // Implementation for revising triggers based on the provided options.
        triggers.push(new ErrorMessageDisplayClickTrigger());
        if (this.options.popupOnHover)
        {
            triggers.push(new ErrorMessageDisplayMouseOverTrigger(this.options.mouseoverDelay ?? defaultMouseoverDelay));
            triggers.push(new ErrorMessageDisplayMouseOutTrigger(this.options.mouseoutDelay ?? defaultMouseoutDelay));
        }
        if (this.options.popupOnFocus)
        {
            triggers.push(new ErrorMessageDisplayFocusInTrigger(this.options.focusInDelay ?? defaultFocusInDelay));
            triggers.push(new ErrorMessageDisplayFocusOutTrigger(this.options.focusOutDelay ?? defaultFocusOutDelay));
        }
        if (this.options.keyboardPopupEnabled)
        {
            triggers.push(new ErrorMessageDisplayKeyAsClickTrigger());
        }
        if (this.options.popupOnHoverOverEditor)
        {
            triggers.push(new EditorHoverTrigger(
                this.options.mouseoverDelay ?? defaultMouseoverDelay,
                this.options.mouseoutDelay ?? defaultMouseoutDelay));
        }
        if (this.options.popupOnFocusInEditor)
        {
            triggers.push(new EditorFocusTrigger(
                this.options.focusInDelay ?? defaultFocusInDelay,
                this.options.focusOutDelay ?? defaultFocusOutDelay));
        }
    }

    protected override setDomServices(valueHostsManager: IValueHostsManager): void
    {
        super.setDomServices(valueHostsManager);
        if (!this.domServices.popupMechanism)
            throw new Error('Popup mechanism not available in DOM services.');

        this.indicatorContent.setDomServices(this.domServices);
        this.popupContent.setDomServices(this.domServices);        
        this._popupMechanism = this.domServices.popupMechanism;
        this._elementRegistry = this.domServices.getElementRegistry(valueHostsManager);     
    }

    protected override resolveOptions(): void
    {
        super.resolveOptions();
        this.reviseTriggers(this.options.triggers!);
    }
    protected override ensureValueHostInitializedWorker(valueHost: IFieldValueHost): void
    {
        super.ensureValueHostInitializedWorker(valueHost);
        this._popupService = this.triggerContext!.domServices.getPopupService(
            this.triggerContext!.valueHost.valueHostsManager);
        this._popupService?.register(this, () => this.triggerContext!);
    }
    public override init(valueHostsManager: IValueHostsManager): void
    {
        super.init(valueHostsManager);

        if (this.options.popupOnFocus || this.options.keyboardPopupEnabled)
        { // making this element act like a button (it may already be one, and so we are careful not to override existing attributes)
            if (!this.presentationElement.hasAttribute('tabindex'))
            {
                const tabIndex = this.options.tabIndex ?? 0;
                this.presentationElement.setAttribute('tabindex', tabIndex.toString());
            }
/*     This is found in our Aria system via PopupErrorMessageDisplayStaticUpdater.       
            if (!this.presentationElement.hasAttribute('role'))
                this.presentationElement.setAttribute('role', 'button');
*/
        }   
    }

    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        // change content before making it visible in ancestors
        this.indicatorContent.apply(this.presentationElement,
            issuesFound, valueHost.valueHostsManager, valueHost);

        super.applyIssuesFound(valueHost, issuesFound);
    }

    /**
     * Updates the indicator and trigger context with the latest validation state.
     * A popup the user opened stays open across validation: it is closed and reopened
     * so it shows fresh content from the MessageFrame, unless the issues cleared.
     * A popup that was not open is never opened by validation.
     */
    public override apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        let wasOpen = this.triggerState === TriggerState.open ||
            this.triggerState === TriggerState.closing;
        super.apply(valueHost, state);

        if (this.triggerContext)
        {
            this.close(this.triggerContext, 0);
            if (wasOpen && this.triggerContext.issuesFound && this.triggerContext.issuesFound.length > 0)
                this.open(this.triggerContext, 0);
        }
    }

    protected override removeIssuesFound(): void
    {
        super.removeIssuesFound();
        this.presentationElement.textContent = '';
    }

    /**
     * The context object used by the popup mechanism to manage the popup.
     * Lifecycle: openCore creates; closed() should dispose of it.
     */
    protected get popupContext(): IPopupContext | undefined
    {
        return this._popupContext;
    }
    private _popupContext?: IPopupContext;
    
    protected override openCore(context: IErrorMessageDisplayTriggerContext): boolean
    {
        if (!this.triggerContext)
            throw new Error('Trigger context not set before opening popup.');
        if (!this.triggerContext.issuesFound)
            throw new Error('No issues found before opening popup.');

        let popupContext = this.popupMechanism!.createContext(this.popupOptions);
        popupContext.controller = this;
        popupContext.domServices = this.domServices!;
        popupContext.anchorElement = this.resolveAnchorElement();

        // create the content that will be injected by PopupMechanism into its own frame.
        popupContext.messageFrameContent = document.createElement('div');
        if (this.popupContent.needsContainerUpdate())
            popupContext.messageFrameContent.classList.add(jivsMessageContentClass); // jivs-messagecontent
        this.popupContent.apply(popupContext.messageFrameContent,
            this.triggerContext.issuesFound, this.triggerContext.valueHost.valueHostsManager, this.triggerContext.valueHost);

        
        this._popupContext = popupContext;

        let success = this.popupMechanism!.open(popupContext);
        if (!success)
        {
            popupContext.dispose();
            this._popupContext = undefined;
        }
        return success;
    }

    public override opened(): void
    {
        super.opened();

        this.addClasses(this.presentationElement, [jivsPopupOpenClass]);
        let editor = this._elementRegistry?.getElementsByRole(ElementRole.editor, this.triggerContext?.valueHost.getElementIdentifier() ?? null);
        if (editor && editor.length > 0)
            editor[0].classList.add(jivsPopupOpenClass);
        this.popupContext?.messageFrameContent?.classList.add(jivsPopupOpenClass);
    }

    protected override tryToOpen(context: IErrorMessageDisplayTriggerContext): void
    {
        // defensive checks in case external actions change the environment
        if (this.triggerState !== TriggerState.opening) return;
        this.popupService?.prepareToOpen(this);
        super.tryToOpen(context);
    }
    /**
     * Uses options.anchorSelector to resolve the anchor element for the popup.
     * If that is not supplied, or it cannot find a matching element, it falls back to using the presentation element.
     * options.anchorSelector supports the token "{FieldName}" to be replaced with the field name.
     * @returns 
     */
    protected resolveAnchorElement(): HTMLElement
    {
        if (this.options.anchorSelector)
        {
            let triggerContext = this.triggerContext;
            if (!triggerContext)
                throw new Error('triggerContext is not set before resolving the popup anchor.');
            let containerElement = triggerContext.domServices.resolveContainerElement(
                triggerContext.valueHost.valueHostsManager);
            let anchorElement = resolveElementBySelector(
                this.options.anchorSelector,
                triggerContext.valueHost.getElementIdentifier(),
                containerElement);
            if (anchorElement)
                return anchorElement;
        }

        return this.presentationElement;
    }
    protected override closeCore(context: IErrorMessageDisplayTriggerContext): boolean
    {
        try
        {
            if (this._popupContext)
            {
                return this.popupMechanism!.close(this._popupContext);
            }
            return true;
        }
        catch (e)
        {
            this.domServices?.loggingFacade.log(LoggingLevel.Error,
                (facade) => facade.prepareLogDetails('Error closing popup: ' + (e instanceof Error ? e.message : String(e)), this.element));
            this._popupContext?.dispose();
            this._popupContext = undefined;
            return true;    // because we want to treat this as successfully closed. Returning false makes ancestor close restore triggerState to open
        }
    }    
    protected override closedCore(): void
    {
        this.removeClasses(this.presentationElement, [jivsPopupOpenClass]);
        let editor = this._elementRegistry?.getElementsByRole(ElementRole.editor, this.triggerContext?.valueHost.getElementIdentifier() ?? null);
        if (editor && editor.length > 0)
            editor[0].classList.remove(jivsPopupOpenClass);
        this.popupContext?.messageFrameContent?.classList.remove(jivsPopupOpenClass);
        
        this._popupContext?.dispose();
        this._popupContext = undefined;
        super.closedCore();
    }

    public override getStaticAriaUpdater(): IAriaStaticUpdater | null
    {
        return new PopupErrorMessageDisplayStaticUpdater(
            this.options.ariaPopupMessage, this.options.ariaPopupMessagel10n);
    }

    public override dispose(): void
    {
        // does not try to close first. That operation could fail, and its too late to worry about
        this._popupContext?.dispose();
        this._popupContext = undefined;

        super.dispose();
        this._popupService?.unregister(this);
        this._popupService = undefined;

        this._popupMechanism = undefined as any;
        this._elementRegistry = undefined as any;
        this._indicatorContent = undefined as any;
        this._popupContent = undefined as any;
    }
}

const jivsPopupOpenClass = 'jivs-popup-open';

/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the Presentations options.
 */
export interface PopupErrorMessageDisplayPresentationGlobalOptions
    extends TriggeredErrorMessageDisplayPresentationBaseGlobalOptions
{
    /**
     * Whether the popup should be shown on mouseover.
     * If enabled, it mouseout is also setup. Both use delays specified by mouseoverDelay and mouseoutDelay.
     * Optional. Defaults to false.
     */
    popupOnHover?: boolean;
    /**
     * The delay in milliseconds before showing the popup on mouseover.
     * When 0, there is no delay before showing the popup.
     * Optional. Defaults to 250ms
     */
    mouseoverDelay?: number;
    /**
     * The delay in milliseconds before hiding the popup on mouseout.
     * When 0, there is no delay before hiding the popup.
     * Optional. Defaults to 750ms.
     */
    mouseoutDelay?: number;

    /**
     * Whether the popup should be shown on focus-in.
     * If enabled, it focus-out is also setup. Both use delays specified by focusInDelay and focusOutDelay.
     * Optional. Defaults to false.
     */
    popupOnFocus?: boolean;
    /**
     * The delay in milliseconds before showing the popup on focus.
     * When 0, there is no delay before showing the popup.
     * Optional. Defaults to 250ms.
     */
    focusInDelay?: number;
    /**
     * The delay in milliseconds before hiding the popup on blur.
     * When 0, there is no delay before hiding the popup.
     * Optional. Defaults to 750ms.
     */
    focusOutDelay?: number;

    /**
     * Trigger the popup when the user hovers over the editor element.
     * Optional. Defaults to false.
     * Uses the mouseoverDelay and mouseoutDelay for the hover behavior.
     */
    popupOnHoverOverEditor?: boolean;

    /**
     * Trigger the popup when the user focuses on the editor element.
     * Optional. Defaults to false.
     * Uses the focusInDelay and focusOutDelay for the focus behavior.
     */
    popupOnFocusInEditor?: boolean;

    /**
     * Whether the popup can be activated using the keyboard.
     * When enabled, the keypress event will trigger the popup on ENTER and SPACE keys.
     * Optional. Defaults to true.
     */
    keyboardPopupEnabled?: boolean;

    /**
     * Used when AriaService is active to supply the value for the aria-label of the popup error message "button".
     * Its intent is to speak the purpose of the popup error message "button" through assistive technologies.
     * In this case, the purpose is something like "Show validation errors"
     * and that is the default if not supplied.
     * Use ariaPopupMessagel10n to provide a localized version of the aria-label if needed.
     */
    ariaPopupMessage?: string;
    /**
     * The localized version of the aria-label for the popup error message "button".
     * Optional. If not supplied, ariaPopupMessage will be used as the default.
     */
    ariaPopupMessagel10n?: string;
}

/**
 * Options specific to the popup error message display presentation instance.
 * Includes both the base options and the global options for the popup behavior.
 * Only add options here that are used situationally.
 */
export interface PopupErrorMessageDisplayPresentationOptions
    extends TriggeredErrorMessageDisplayPresentationBaseOptions,
    PopupErrorMessageDisplayPresentationGlobalOptions
{
    /**
     * The CSS selector for the element to which the popup should be anchored
     * if not using the presentation element itself as the Anchor element.
     * Allows the {FieldName} token to be used and will be replaced with the value from FieldValueHost.getElementIdentifier()
     * so it can be field-specific.
     * ```ts
     * options.anchorSelector = '#popup-anchor-{FieldName}';
     * ```
     * Optional.
     */
    anchorSelector?: string;

    /**
     * The tab index for the popup element.
     * Optional. The tabIndex attribute is only setup if popupOnFocus=true
     * or keyboardPopupEnabled=true. In that case, if this is undefined, a default tabIndex of 0 will be used.
     */
    tabIndex?: number;
}

export const defaultMouseoverDelay = 250;
export const defaultMouseoutDelay = 750;
export const defaultFocusInDelay = 250;
export const defaultFocusOutDelay = 750;