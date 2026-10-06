import { ErrorMessageDisplayPresentationBase } from './ErrorMessageDisplayPresentationBase';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IErrorMessageDisplayController, IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IIssuesFoundDisplay } from '../Interfaces/IIssuesFoundDisplay';

/**
 * A base class for error message display presentations that are triggered by specific events or conditions,
 * rather than being always visible. Subclasses should implement the logic for showing and hiding the error
 * messages based on the triggering events.
 * 
 * The triggers are supplied as a list of IErrorMessageDisplayTrigger instances.
 * Each installs event handlers that invoke any of the functions found on this class
 * through IErrorMessageDisplayController: open(), close(), and toggle().
 * 
 * Trigger installation only happens once, during the first call to apply() on the presentation.
 * (Not using the init function because it doesn't have the necessary parameters to fully realize an installation.)
 */
export abstract class TriggeredErrorMessageDisplayPresentationBase extends ErrorMessageDisplayPresentationBase
    implements IErrorMessageDisplayController
{
    constructor(element: HTMLElement, anchor: IJivsDomElement,
        issuesFoundDisplay: IIssuesFoundDisplay,
        triggers: IErrorMessageDisplayTrigger[],
        presentationClass?: string, hasIssuesClass?: string, openClass?: string)
    {
        super(element, anchor, issuesFoundDisplay, presentationClass, hasIssuesClass);
        this._triggers = triggers ?? [];
        this._openClass = openClass ?? this.defaultOpenClass();
    }

    /**
     * Gets the list of triggers associated with this presentation.
     * Can be an empty array so long as another mechanism is responsible for calling open().
     */
    protected get triggers(): IErrorMessageDisplayTrigger[]
    {
        return this._triggers;
    }
    private _triggers: IErrorMessageDisplayTrigger[];

    protected get openClass(): string | null
    {
        return this._openClass;
    }
    private _openClass: string | null;
    protected defaultOpenClass(): string | null
    {
        return 'jivs-open';
    }

    /**
     * Ensures that all triggers are installed for the given field value host.
     * @param valueHost The field value host used to create the trigger context.
     */
    protected ensureTriggers(valueHost: IFieldValueHost): void
    {
        if (!this._triggersInstalled)
        {
            const context = this.createTriggerContext(valueHost);
            for (const trigger of this._triggers)
            {
                trigger.install(context);
            }
        }
        this._triggersInstalled = true;
    }
    private _triggersInstalled: boolean = false;

    protected createTriggerContext(valueHost: IFieldValueHost): IErrorMessageDisplayTriggerContext
    {
        return {
            valueHost: valueHost,
            anchorElement: this.anchor,
            domServices: valueHost.valueHostsManager.services.domServices,
            controller: this
        };
    }

    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        super.applyIssuesFound(valueHost, issuesFound);
    }

    override apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        this.ensureTriggers(valueHost);
        super.apply(valueHost, state);
    }

//#region IErrorMessageDisplayController Implementation
    protected get isOpen(): boolean
    {
        return this._isOpen;
    }
    protected set isOpen(value: boolean)
    {
        this._isOpen = value;
    }
    private _isOpen: boolean = false;
    
    /**
     * Takes the action to show the error messages.
     * Returns true if the error messages were successfully shown, false otherwise.
     * Override the openWorker method to implement the logic for opening the error message display.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    public open(context: IErrorMessageDisplayTriggerContext): boolean
    {
        if (this.isOpen)
        {
            return false;
        }
        this.isOpen = this.openWorker(context);
        return this.isOpen;
    }

    /**
     * Implements the logic for opening the error message display.
     * Should return true if the display was successfully opened, false otherwise.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    protected abstract openWorker(context: IErrorMessageDisplayTriggerContext): boolean;


    /**
     * Takes the action to hide the error messages.
     * Returns true if the error messages were successfully hidden, false otherwise.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    public close(context: IErrorMessageDisplayTriggerContext): boolean
    {
        if (!this.isOpen)
        {
            return false;
        }
        this.isOpen = !this.closeWorker(context);
        return !this.isOpen;
    }

    /**
     * Implements the logic for closing the error message display.
     * Should return true if the display was successfully closed, false otherwise.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    protected abstract closeWorker(context: IErrorMessageDisplayTriggerContext): boolean;    

    /**
     * Toggles the visibility of the error messages.
     * Returns true if the error messages were successfully shown or hidden, false otherwise.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    public toggle(context: IErrorMessageDisplayTriggerContext): boolean
    {
        if (this.isOpen)
        {
            return this.close(context);
        }
        else
        {
            return this.open(context);
        }
    }
//#endregion IErrorMessageDisplayController Implementation


}