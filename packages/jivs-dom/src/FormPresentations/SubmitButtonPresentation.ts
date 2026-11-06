import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
/**
 * Provides a concrete implementation of a form presentation for submit buttons.
 * 
 * @module jivs-dom/FormPresentations/ConcreteClasses/SubmitButtonPresentation
 */

import { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { FormPresentationBase, FormPresentationBaseGlobalOptions, FormPresentationBaseOptions } from './FormPresentationBase';
/**
 * A form presentation that addresses several types of submit buttons:
 * - input type="submit"
 * - button type="submit"
 * - input type="button"
 * 
 * Buttons have very limited styling and behavior options compared to other form elements.
 * We'll support:
 * - class to style the button element
 * - disabled state for the button element, unless option.allowDisable is set to false.
 * 
 * ## CSS Class Resolution
 * - permenant classes: 'jivs-submitbutton'
 *   Add your own permanent classes within the options.variationClasses property.
 * - ValidationState.doNotSave is true
 *   'jivs-do-not-save'
 * 
 */
export class SubmitButtonPresentation
    <TOptions extends SubmitButtonPresentationOptions = SubmitButtonPresentationOptions>
    extends FormPresentationBase<TOptions>
{
    constructor(element: HTMLElement, options: TOptions)
    {
        super(element, options);
        this._validElement = element instanceof HTMLButtonElement || (element instanceof HTMLInputElement && (element.type === 'submit' || element.type === 'button'));
    }
    private _validElement: boolean = false;
    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.submitButton;
    }

    /**
     * A CSS class that is applied when ValidationState.doNotSave is true.
     */
    public get doNotSaveClass(): string[]
    {
        return ['jivs-do-not-save'];
    }
    /**
     * @param list - adds 'jivs-submitbutton' to the list of persistent classes.
     */
    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-submitbutton');
    }    

    public override init(valueHostsManager: IValueHostsManager): void
    {
        super.init(valueHostsManager);
        if (!this._validElement)
        {

            this.domServices.loggingFacade.log(LoggingLevel.Warn, (facade) =>
            {
                return facade.prepareLogDetails(
                    'SubmitButtonPresentation only supports input type="submit", button type="submit", and input type="button"',
                    this.presentationElement,
                    null,
                    this
                );
            });
        }
    }

    protected applyDoNotSave(): void
    {
        this.addClasses(this.presentationElement, this.doNotSaveClass);
        if (this.options.allowDisable !== false) {
            (this.presentationElement as HTMLButtonElement | HTMLInputElement).disabled = true;
        }
    }
    protected removeDoNotSave(): void
    {
        this.removeClasses(this.presentationElement, this.doNotSaveClass);
        if (this.options.allowDisable !== false) {
            (this.presentationElement as HTMLButtonElement | HTMLInputElement).disabled = false;
        }
    }

    protected override applyCore(valueHostsManager: IValueHostsManager, state: ValidationState): void
    {
        if (!this._validElement) {
            return;
        }
        this.removeDoNotSave();   // clear earlier state
        if (state.doNotSave)
        {
            this.applyDoNotSave();
        }
    }
}

export interface SubmitButtonPresentationGlobalOptions extends FormPresentationBaseGlobalOptions
{
    /**
     * Whether the submit button is allowed to be disabled based on the validation state.
     * If not specified, the default behavior is to allow disabling the submit button.
     */
    allowDisable?: boolean;
}

export interface SubmitButtonPresentationOptions
    extends FormPresentationBaseOptions,
        SubmitButtonPresentationGlobalOptions
{
}
