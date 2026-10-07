import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IErrorMessageDisplayController, IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext, TriggerState } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IIssuesFoundDisplay } from '../Interfaces/IIssuesFoundDisplay';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ErrorMessageDisplayPresentationBase } from './ErrorMessageDisplayPresentationBase';
import { ErrorMessageDisplayTriggerContext } from './ErrorMessageDisplayTriggerContext';

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
        variationClass?: string, hasIssuesClass?: string, openClass?: string)
    {
        super(element, anchor, issuesFoundDisplay, variationClass, hasIssuesClass);
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
    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-triggered-error-message-display');
    }
    /**
     * Ensures that all triggers are installed for the given field value host.
     * @param valueHost The field value host used to create the trigger context.
     */
    protected override ensureValueHostInitializedWorker(valueHost: IFieldValueHost): void
    {
        super.ensureValueHostInitializedWorker(valueHost);
        const context = this.createTriggerContext(valueHost);
        for (const trigger of this._triggers)
        {
            trigger.install(context);
        }
        context.domServices.getPopupService(context.valueHost.valueHostsManager).register(
            this, () => this.createTriggerContext(valueHost));  // popupService knows to dispose this context
/*  trigger.install passes context into event handlers, so this instance has a long lifecycle.
    Keep in mind dispose is there to assist garbage collection by releasing the context when it is no longer needed.
    So its OK we never dispose this instance anywhere.
        context.dispose();
*/        
    }


    protected createTriggerContext(valueHost: IFieldValueHost): IErrorMessageDisplayTriggerContext
    {
        return new ErrorMessageDisplayTriggerContext(
            this.anchor,
            valueHost.valueHostsManager.services.domServices,
            valueHost,
            this
        );
    }

    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        super.applyIssuesFound(valueHost, issuesFound);
    }

    override apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        super.apply(valueHost, state);

        if (!state.issuesFound?.length) // we cannot depend on isOpen state due to async setup
        {
            const context = this.createTriggerContext(valueHost);
            try {
                this.close(context, 0); // no delay!
            } finally {
                context.dispose();
            }
        }        
    }

//#region IErrorMessageDisplayController Implementation
    protected get triggerState(): TriggerState
    {
        return this._triggerState;
    }
    protected set triggerState(value: TriggerState)
    {
        this._triggerState = value;
    }
    private _triggerState: TriggerState = TriggerState.closed;

    /**
     * Timer handle used to manage delayed opening and closing of the error message display.
     * Null when no delayed action is pending.
     */
    private delayTimer: ReturnType<typeof setTimeout> | null = null;

    protected cancelScheduledTransition(): void
    {
        if (this.delayTimer !== null)
        {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
    }
    /**
     * Takes the action to show the error messages.
     * Override the openCore method to implement the logic for opening the error message display.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     * @param delay The delay in milliseconds before the error message display is opened.
     * Use 0 to open the error message display immediately.
     */
    public open(context: IErrorMessageDisplayTriggerContext, delay: number): void
    {
        function tryToOpen()
        {
            // defensive checks in case external actions change the environment
            if (self.triggerState !== TriggerState.opening) return;
            context.domServices.getPopupService(context.valueHost.valueHostsManager).prepareToOpen(self);
            if (self.triggerState !== TriggerState.opening) return;
            let success = self.openCore(context);
            if (self.triggerState !== TriggerState.opening) return;
            self.triggerState = success ? TriggerState.open : TriggerState.closed;
        }
        function execute()
        {
            self.cancelScheduledTransition();
            if (delay === 0)
            {
                self.triggerState = TriggerState.opening;
                tryToOpen();
            }
            else
            {
                self.triggerState = TriggerState.opening;
                self.delayTimer = setTimeout(() =>
                {
                    self.delayTimer = null;
                    tryToOpen();
                }, delay);
            }
        }
        let self = this;
        switch (this.triggerState)
        {
            case TriggerState.open:
            case TriggerState.opening:
                break;
            case TriggerState.closed:
                execute();
                break;
            case TriggerState.closing:
                this.cancelScheduledTransition();
                // we had it already open, and stopped it from closing
                this.triggerState = TriggerState.open;
                break;
        }
    }

    /**
     * Implements the logic for opening the error message display.
     * Should return true if the display was successfully opened, false otherwise.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    protected abstract openCore(context: IErrorMessageDisplayTriggerContext): boolean;


    /**
     * Takes the action to hide the error messages.
     * @param delay The delay in milliseconds before the error message display is closed.
     * Use 0 to close the error message display immediately.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    public close(context: IErrorMessageDisplayTriggerContext, delay: number): void
    {
        function tryToClose()
        {
            // defensive checks in case external actions change the environment
            if (self.triggerState !== TriggerState.closing) return;
            let success = self.closeCore(context);
            if (self.triggerState !== TriggerState.closing) return;
            self.triggerState = success ? TriggerState.closed : TriggerState.open;
        }
        function execute()
        {
            self.cancelScheduledTransition();
            if (delay === 0)
            {
                self.triggerState = TriggerState.closing;
                tryToClose();
            }
            else
            {
                self.triggerState = TriggerState.closing;
                self.delayTimer = setTimeout(() =>
                {
                    self.delayTimer = null;
                    tryToClose();
                }, delay);
            }
        }
        let self = this;    
        switch (this.triggerState)
        {
            case TriggerState.closed:
                break;
            case TriggerState.closing:
                // let it finish unless the delay is zero, in which case we force close
                if (delay === 0)
                    execute();
                break;
            case TriggerState.open:
                execute();
                break;
            case TriggerState.opening:
                this.cancelScheduledTransition();
                this.triggerState = TriggerState.closed;
                break;
        }
    }

    /**
     * Implements the logic for closing the error message display.
     * Should return true if the display was successfully closed, false otherwise.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    protected abstract closeCore(context: IErrorMessageDisplayTriggerContext): boolean;    

    /**
     * Toggles the visibility of the error messages.
     * @param openDelay The delay in milliseconds before the error message display is opened.
     * Use 0 to open the error message display immediately.
     * @param closeDelay The delay in milliseconds before the error message display is closed.
     * Use 0 to close the error message display immediately.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    public toggle(context: IErrorMessageDisplayTriggerContext, openDelay: number, closeDelay: number): void
    {
        switch (this.triggerState)
        {
            case TriggerState.closed:
            case TriggerState.closing:
                this.open(context, openDelay);
                break;
            case TriggerState.open:
            case TriggerState.opening:
                this.close(context, closeDelay);
                break;
        }
    }
//#endregion IErrorMessageDisplayController Implementation


}