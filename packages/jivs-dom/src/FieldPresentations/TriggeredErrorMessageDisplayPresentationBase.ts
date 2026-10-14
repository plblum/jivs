import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IErrorMessageDisplayController, IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext, TriggerState } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IMessageFrame } from '../Interfaces/IMessageFrame';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { ErrorMessageDisplayPresentationBase, ErrorMessageDisplayPresentationBaseOptions } from './ErrorMessageDisplayPresentationBase';
import { ErrorMessageDisplayTriggerContext } from './ErrorMessageDisplayTriggerContext';
import { IPopupService } from '../Interfaces/PopupErrorMessageDisplays';

/**
 * A base class for error message display presentations that are triggered by specific events or conditions,
 * rather than being always visible. Subclasses should implement the logic for showing and hiding the error
 * messages based on the triggering events.
 * 
 * This class represents trigger actions in these methods: open(), close(), and toggle().
 * It handles timer-based delays for showing and hiding the error messages.
 * 
 * It introduces the 'jivs-open' CSS class for indicating when the error message display is open.
 * 
 * The triggers are supplied as a list of IErrorMessageDisplayTrigger instances
 * found in options.triggers.
 * Each installs event handlers that invoke any of the functions found on this class
 * through IErrorMessageDisplayController: open(), close(), and toggle().
 * 
 * Trigger installation only happens once, during the first call to apply() on the presentation.
 * (Not using the init function because it doesn't have the necessary parameters to fully realize an installation.)
 * 
 * ## CSS Classes
 * - persistent classes: 'jivs-triggered-error-message-display', 'jivs-errormessagedisplay'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - stateful classes: 'jivs-open', 'jivs-has-issues'
 *
 */
export abstract class TriggeredErrorMessageDisplayPresentationBase
    <TOptions extends TriggeredErrorMessageDisplayPresentationBaseOptions>
    extends ErrorMessageDisplayPresentationBase<TOptions>
    implements IErrorMessageDisplayController
{
    constructor(element: HTMLElement,
        messageFrame: IMessageFrame,
        options?: TOptions)
    {
        super(element, messageFrame, options);
        // if the default for triggers was null, don't let that cause an exception!
        this.options.triggers = this.options.triggers ?? [];
    }

    protected override getOptionDefaults(): Partial<TOptions>
    {
        let superDefaults = super.getOptionDefaults();
        return {
            ...superDefaults,
            triggers: []
        };
    }

    // /**
    //  * Gets the list of triggers associated with this presentation.
    //  * Can be an empty array so long as another mechanism is responsible for calling open().
    //  */
    // protected get triggers(): IErrorMessageDisplayTrigger[]
    // {
    //     return this._triggers;
    // }
    // private _triggers: IErrorMessageDisplayTrigger[];

    protected get openClass(): string[]
    {
        return ['jivs-open'];
    }
    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-triggerederrormessagedisplay');
    }
    /**
     * Ensures that all triggers are installed for the given field value host.
     * @param valueHost The field value host used to create the trigger context.
     */
    protected override ensureValueHostInitializedWorker(valueHost: IFieldValueHost): void
    {
        super.ensureValueHostInitializedWorker(valueHost);
        this._triggerContext = this.createTriggerContext(valueHost);    // expected to be immutable 
        for (const trigger of this.options.triggers!)
        {
            trigger.install(this._triggerContext);
        }
        this._popupService = this._triggerContext.domServices.getPopupService(
            this._triggerContext.valueHost.valueHostsManager);
        this._popupService?.register(
            this, () => this.triggerContext!);  
    }

    /**
     * Gets the current trigger context associated with this presentation.
     * Lifecycle: created when ensureValueHostInitializedWorker is called; disposed by dispose().
     */
    protected get triggerContext() : IErrorMessageDisplayTriggerContext | undefined
    {
        return this._triggerContext;
    }
    private _triggerContext?: IErrorMessageDisplayTriggerContext;

    private _popupService?: IPopupService;


    protected createTriggerContext(valueHost: IFieldValueHost): IErrorMessageDisplayTriggerContext
    {
        return new ErrorMessageDisplayTriggerContext(
            this.jivsElement,
            valueHost.valueHostsManager.services.domServices,
            valueHost,
            this
        );
    }

    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        super.applyIssuesFound(valueHost, issuesFound);
        this.triggerContext!.issuesFound = issuesFound;
    }

    protected override removeIssuesFound(): void
    {
        super.removeIssuesFound();
        this.triggerContext!.issuesFound = null;
        
    }

    override apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        // need to retain an open state.
        let wasOpen = this.triggerState === TriggerState.open ||
            this.triggerState === TriggerState.closing;
        super.apply(valueHost, state);

        if (this.triggerContext)
        {
                // close and reopen forces fresh content from MessageFrame to be available
            this.close(this.triggerContext, 0); // no delay!
            if (wasOpen && this.triggerContext.issuesFound && this.triggerContext.issuesFound?.length > 0)
                this.open(this.triggerContext, 0); // no delay!
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
            if (success)
                self.opened();
            else
                self.failedToOpen();
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
        // don't allow starting if there are no issues found...
        if (!this.triggerContext?.issuesFound?.length)
            return;
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
     * Final action of opening that is invoked after the presentation has completed its opening transition.
     * Internally, the open() method is expected to call this.
     * In this class, it adds the appropriate CSS classes to indicate the open state.
     */
    public opened(): void
    {
        this.addClasses(this.openClass);
        // in case it was called without using open()
        this.cancelScheduledTransition();
        this.triggerState = TriggerState.open;
    }
    protected failedToOpen(): void
    {
        this.triggerState = TriggerState.closed;
    }


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
            if (success)
                self.closed();
            else
                self.failedToClose();
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
     * Final action of closing that is invoked after the presentation has completed its closing transition.
     * This is used by Presentation wrap up.
     * It should not attempt to modify the presentation state or trigger additional open/close actions.
     * Example usage: PopupErrorMessageDisplayPresentation.close() expects to close an open popup.
     * If a popup library closes the popup independently, it should call this to ensure 
     * PopupErrorMessageDisplayPresentation removes its CSS classes and disposes the IPopupContext.
     * Internally, the close() method is expected to call this.
     * In this class, it removes the CSS classes that indicate the open state
     * and sets the trigger state to closed.
     */
    public closed(): void
    {
        if (this.triggerState !== TriggerState.closed)
        {
            this.triggerState = TriggerState.closed;        
            this.closedCore();
        }
    }

    protected closedCore(): void
    {
        this.removeClasses(this.openClass);
        // in case it was called without using close()
        this.cancelScheduledTransition();        
    }

    protected failedToClose(): void
    {
        this.triggerState = TriggerState.open;
    }

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
    /**
     * Cancels any previously scheduled delayed close operation for the presentation.
     * Targets the PopupMechanism which knows if there is a mouseover or click on the popup
     * which means the delayed close can be canceled if the user interacts with the popup, preventing it from closing prematurely.
     */
    public cancelDelayedClose(): void
    {
        if (this.triggerState === TriggerState.closing)
        {
            this.cancelScheduledTransition();
            this.triggerState = TriggerState.open;
        }
    }
//#endregion IErrorMessageDisplayController Implementation
    public override dispose(): void
    {
        this.cancelScheduledTransition();
        this._popupService?.unregister(this);
        this._popupService = undefined;
        super.dispose();
        this._triggerContext?.dispose();
        this._triggerContext = undefined;
    }

}

export interface TriggeredErrorMessageDisplayPresentationBaseOptions extends ErrorMessageDisplayPresentationBaseOptions
{
    /**
     * The list of triggers that determine when the error message display should be shown or hidden.
     */
    triggers?: IErrorMessageDisplayTrigger[];
}