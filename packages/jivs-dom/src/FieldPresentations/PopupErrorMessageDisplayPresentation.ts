import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IElementRegistry } from '../Interfaces/ElementRegistry';
import { IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { IMessageFrame } from '../Interfaces/IMessageFrame';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IPopupContext, IPopupMechanism } from '../Interfaces/PopupErrorMessageDisplays';
import { ElementRole } from '../Interfaces/Types';
import { ErrorMessageDisplayClickTrigger } from '../Presentations_common/ErrorMessageDisplayClickTrigger';
import { ErrorMessageDisplayMouseOutTrigger } from '../Presentations_common/ErrorMessageDisplayMouseOutTrigger';
import { ErrorMessageDisplayMouseOverTrigger } from '../Presentations_common/ErrorMessageDisplayMouseOverTrigger';
import { TriggeredErrorMessageDisplayPresentationBase, TriggeredErrorMessageDisplayPresentationBaseOptions } from './TriggeredErrorMessageDisplayPresentationBase';
import { IErrorIndicatorContent } from '../Interfaces/IErrorIndicatorContent';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';

/**
 * A presentation class for displaying error messages in a popup.
 * Its presentation element is mostly just a button to trigger a popup.
 * The popup is entirely separate from the presentation element itself
 * and managed by a popup mechanism that is assigned to IJivsDomService.popupMechanism.
 * This split places responsibilities in two places:
 * 1. The presentation element handles user interactions to trigger the popup
 *    and visuals of the button.
 * 2. The popup mechanism handles the display and positioning of the popup itself.
 * Thus, they have separate options for configuration.
 * PopupErrorMessageDisplayPresentationOptions defines the configuration options for the presentation.
 * PopupErrorMessageDisplayPresentationOptions.popupOptions defines the configuration for the popup mechanism itself.
 * 
 * The popupOptions has a structure defined specifically by the popup mechanism being used.
 * It contains positioning and styling properties that are specific to the popup mechanism being used.
 * So the user works with the known requirements of the popup mechanism when configuring the popupOptions.
 * 
 * To popup, the presentation.open() function will invoke the popup mechanism to display the popup according to the configured popupOptions.
 * To pop down, there are several cases:
 * - Events such as mouseout or focusout that trigger the popup to hide. They use presentation.close() internally.
 * - The popup mechanism itself may trigger hiding the popup, for example when clicking outside the popup.
 *   It must call context.controller.closed() to notify that the popup has been closed.
 *   "Controller" is PopupErrorMessageDisplayPresentation itself through the IErrorMessageDisplayController interface.
 * - Programmatic calls to presentation.close() to hide the popup.
 * - PopupService.closePopups() using presentation.close().
 * 
 * Popups need positioning between two elements:
 * - Anchor - The element to which the popup is aligned.
 * - Popup - The popup element itself.
 * The Anchor defaults to the presentation element itself. However, it can be anything else
 * by specifying a different Anchor element through the anchorSelector option.
 * 
 */
export class PopupErrorMessageDisplayPresentation<
    TPopupOptions extends object = object,
    TOptions extends PopupErrorMessageDisplayPresentationOptions<TPopupOptions> = PopupErrorMessageDisplayPresentationOptions<TPopupOptions>>
    extends TriggeredErrorMessageDisplayPresentationBase<TOptions>
{

    constructor(
        element: HTMLElement,
        errorIndicator: IErrorIndicatorContent,
        messageFrame: IMessageFrame,
        options?: TOptions
    )
    {
        super(element, messageFrame, options);
        assertNotNull(errorIndicator, 'errorIndicator');
        this._popupOptions = this.options.popupOptions ?? {} as TPopupOptions;
        this._errorIndicator = errorIndicator;
        this.reviseTriggers(this.options.triggers!);
    }

    protected override getOptionDefaults(): Partial<TOptions>
    {
        let superDefaults = super.getOptionDefaults();
        return {
            ...superDefaults,
            mouseoverEnabled: false,
            mouseoverDelay: defaultMouseoverDelay,
            mouseoutDelay: defaultMouseoutDelay
        };
    }
    protected get errorIndicator(): IErrorIndicatorContent
    {
        return this._errorIndicator;
    }
    private _errorIndicator: IErrorIndicatorContent;

    protected get domServices(): IJivsDomServices | undefined
    {
        return this._domServices;
    }
    private _domServices?: IJivsDomServices;

    protected get popupMechanism(): IPopupMechanism | undefined
    {
        return this._popupMechanism;
    }
    private _popupMechanism?: IPopupMechanism;

    protected get popupOptions(): TPopupOptions | undefined
    {
        return this._popupOptions;
    }
    private _popupOptions?: TPopupOptions;


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
        if (this.options.mouseoverEnabled)
        {
            triggers.push(new ErrorMessageDisplayMouseOverTrigger(this.options.mouseoverDelay ?? defaultMouseoverDelay));
            triggers.push(new ErrorMessageDisplayMouseOutTrigger(this.options.mouseoutDelay ?? defaultMouseoutDelay));
        }
    }

    public override init(valueHostsManager: IValueHostsManager): void
    {
        super.init(valueHostsManager);
        this._domServices = valueHostsManager.services.domServices;
        if (!this.domServices?.popupMechanism)
            throw new Error('Popup mechanism not available in DOM services.');
        this._popupMechanism = this.domServices.popupMechanism;
        this._elementRegistry = this.domServices.getElementRegistry(valueHostsManager);
        this.errorIndicator.setDomServices(this.domServices!);
    }

    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        // change content before making it visible in ancestors
        this.errorIndicator.apply(this.presentationElement,
            issuesFound, valueHost.valueHostsManager, valueHost);

        super.applyIssuesFound(valueHost, issuesFound);
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
        this.messageFrame.apply(popupContext.messageFrameContent,
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

    protected resolveAnchorElement(): HTMLElement
    {
        if (this.options.anchorSelector)
        {
            let anchorElement = document.querySelector(this.options.anchorSelector) as HTMLElement | null;
            if (anchorElement instanceof HTMLElement)
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
    public override dispose(): void
    {
        // does not try to close first. That operation could fail, and its too late to worry about
        this._popupContext?.dispose();
        this._popupContext = undefined;
        
        super.dispose();

        this._domServices = undefined as any;
        this._popupMechanism = undefined as any;
        this._elementRegistry = undefined as any;
        this._errorIndicator = undefined as any;
    }
}

const jivsPopupOpenClass = 'jivs-popup-open';

export interface PopupErrorMessageDisplayPresentationOptions<TPopupOptions extends object = object>
    extends TriggeredErrorMessageDisplayPresentationBaseOptions
{
    /**
     * The CSS selector for the element to which the popup should be anchored
     * if not using the presentation element itself as the Anchor element.
     * Optional.
     */
    anchorSelector?: string;
    /**
     * Whether the popup should be shown on mouseover.
     * Optional. Defaults to false.
     */
    mouseoverEnabled?: boolean;
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
     * The options that configure the popup. This object is defined by
     * the specific popup mechanism implementation being used.
     * Expected to have positioning and styling information.
     * Yet if not supplied or properties on it are undefined,
     * the popup mechanism should fall back to default positioning and styling behavior.
     * Optional.
     */
    popupOptions?: TPopupOptions;
}

export const defaultMouseoverDelay = 250;
export const defaultMouseoutDelay = 750;