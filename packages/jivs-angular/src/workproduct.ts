// This is the new code for the new library, jivs-angular.
// ChatGPT, we are collaborating on this source code.

import { Directive, Input, ElementRef, Renderer2, OnInit, OnDestroy, Optional, SkipSelf } from '@angular/core';
import { Subscription, fromEvent, debounceTime, BehaviorSubject, filter } from 'rxjs';
import { ValidationManagerConfig, IValidationManager } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { ValidationState, ValidationStatus, IssueFound, ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { SetValueOptions, IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { SetInputValueOptions } from '@plblum/jivs-engine/build/Interfaces/InputValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationManager } from '@plblum/jivs-engine/build/Validation/ValidationManager';

/**
 * Interface handles the rendering needed by a Fivase Directive based
 * on the validation state of the element and/or its associated ValueHost. 
 * It allows Directives that deal with appearance behaviors to vary their rendering
 * of that appearance through classes that implement this interface. 
 * 
 * Each Directive class that uses IRendererAction has its own Factory, based on
 * ActionFactoryBase which is a registered in the FivaseServices class.
 * 
 * When getting the instance from the factory, use the constant ACTION_RENDERER.
 * ```ts
 * let renderer = fivaseServices.getFactory(DIRECTIVE_NAME, ACTION_RENDERER).resolve(element, '');
 * ```
 * 
 * That factory provides a default instance, which can be overridden by the [fivase-render] attribute
 * on the same element or component as the directive. Components can also provide a specific
 * implementation that handles their unique Render requirements. They can either implement standalone
 * classes or implement the interfaces directly on the component class. Within the component,
 * they notify the factory to use their implementation by calling the available method.
 * The factory's resolve function will look for that instance, before falling back to the default instance.
 * 
 * Classes implementing this interface should not expect any Angular Dependency Injection 
 * into their constructor.  They are created explicitly when registering with the factory.
 */
export interface IRendererAction {
    /**
     * Handles the rendering needed by a Fivase Directive based on the validation state of the element
     * and/or its associated ValueHost.
     * 
     * NOTE: The method name is a little long, because this interface may be implemented directly
     * on a component class, and we want to avoid naming conflicts with other methods.
     * 
     * @param element - The DOM element.
     * @param renderer - The Angular Renderer2 service, to allow changing the element's appearance.
     * @param valueHostName - The name of the value host associated with this element, used to
     * identify which validation rules apply.
     * @param validationState - A ValeuHosts' ValidationState, which includes the current validation status,
     * issues found, and other relevant data.
     * @param fivaseForm - The validation manager responsible for managing the validation
     * logic, errors, and state.
     * @param options - Determined by the Directive to deliver any attribute values it gets from the user.
     */
    render(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions
    ): void;
}

export interface IRendererActionOptions {
    enabledCssClass?: string | null;
    disabledCssClass?: string | null
}

/**
 * Interface for setting up listeners for value changes on an element
 * that will transfer the value into Fivase and invoke validation logic.
 * 
 * Each Directive class that uses IValueChangeListenerAction has its own Factory, based on
 * ActionFactoryBase which is a registered in the FivaseServices class.
 * 
 * When getting the instance from the factory, use the constant ACTION_VALUE_CHANGE_LISTENER.
 * ```ts
 * let renderer = fivaseServices.getFactory(DIRECTIVE_NAME, ACTION_VALUE_CHANGE_LISTENER).resolve(element, '');
 * ```
 * That factory provides a default instance, which can be overridden by the [fivase-valuechangelistener] attribute
 * on the same element or component as the directive. Components can also provide a specific
 * implementation that handles their unique Render requirements. They can either implement standalone
 * classes or implement the interfaces directly on the component class. Within the component,
 * they notify the factory to use their implementation by calling the available method.
 * The factory's resolve function will look for that instance, before falling back to the default instance.
 * 
 * Classes implementing this interface should not expect any Angular Dependency Injection 
 * into their constructor.  They are created explicitly when registering with the factory.
 */
export interface IValueChangeListenerAction {
    /**
     * Sets up validation-related event handlers on the target element.
     * 
     * @param element - The target DOM element. It could be an input field, a
     * container, etc.
     * @param renderer - The Angular Renderer2 service used to attach event listeners to the DOM.
     * @param valueHostName - The name of the value host associated with this element, used to identify
     * the data being validated.
     * @param fivaseForm - Access to Fivase's features. Its validationManager property is 
     * Fivase's ValidationManager object, fully configured and ready to use. 
     */
    listenForValueChanges(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseForm: IFivaseForm
    ): void;

    /**
     * Remove any event handlers that were attached to the element.
     * @param element 
     */
    cleanupEventHandlers?(element: HTMLElement, renderer: Renderer2): void;
}

/**
 * Concrete implementation of `IValueChangeListenerAction` that targets all HTML tags supporting
 * validation-related events, including 'input', 'textarea', 'select', 'checkbox', and 'file' types. 
 * This class listens for 'input', 'change' events and triggers validation logic accordingly.
 * 
 * The event listeners are attached to the DOM element supplied. The class also includes the ability to enable
 * or disable 'input' event listeners through a protected getter, making it accessible for subclasses.
 * 
 * This targets the ValidateInputDirective, which is used to handle input events and supply the value to FivaseForm.
 * It is the default supplied by the ValidateInputDirectiveFactory. If you want to change the 
 * constructor's parameters, consider just replacing the default in ValidationInputDirectiveFactory.defaultFallback
 * where you setup the FivaseServices.
 * ```ts
 * fivaseServices.getFactory(DIRECTIVE_VALIDATE_INPUT, ACTION_VALUE_CHANGE_LISTENER).defaultFallback(new HtmlTagValueChangeListener(true, 200));
 * ```
 * Alternatively, use the [fivase-valuechangelistener] attribute to supply an instance directly to the tag.
 */
export class HtmlTagValueChangeListener implements IValueChangeListenerAction {

    /**
     * Creates an instance of `HtmlTagValueChangeListener`.
     * 
     * @param inputEventEnabled - Optional parameter to control whether 'input' event listeners are attached 
     *  (default is true). This allows control over whether real-time validation 
     *  (via 'input' events) is enabled or disabled.
     * @param inputEventDebounceTime - Optional parameter to control the debounce time for 'input' events,
     *  which determines how long to wait before handling the event (default is 300ms),
     *  This allows control over how often validation is triggered during typing.
     *  Default is 300ms.
     */
    constructor(inputEventEnabled: boolean = true, inputEventDebounceTime: number = 300) {
        this._inputEventEnabled = inputEventEnabled;
        this._inputEventDebounceTime = inputEventDebounceTime;
    }

    /**
     * Protected getter for `inputEventEnabled`, used to control whether 'input' events are attached.
     * 
     * Subclasses can access this property to determine whether the 'input' event listeners should be 
     * installed. It defaults to true but can be customized via the constructor.
     * 
     * @returns A boolean indicating if 'input' events should be attached (true) or not (false).
     */
    protected get inputEventEnabled(): boolean {
        return this._inputEventEnabled;
    }
    private _inputEventEnabled: boolean;

    /**
     * The input event fires as fast as the user types. When this is assigned to a number,
     * it will wait that many milliseconds before handling the event, allowing for fast typing
     * to complete before validating.
     */
    protected get inputEventDebounceTime(): number {
        return this._inputEventDebounceTime;
    }
    private _inputEventDebounceTime: number;

    /**
     * Sets up validation-related event handlers on the target element. 
     * 
     * This method attaches event listeners for the 'input' and 'change' events for 'input' and 'textarea' tags, 
     * the 'change' event for 'select', 'checkbox', and 'file' input types. The `inputEventEnabled` flag determines 
     * if 'input' event listeners should be attached for 'input' and 'textarea'.
     * 
     * The appropriate event handlers are installed using a switch statement based on the tag name.
     * 
     * @param element - The target HTMLElement to apply the render to.
     * @param fivaseForm - Access to Fivase's features. Its validationManager property is 
     * Fivase's ValidationManager object, fully configured and ready to use. 
     * @param valueHostName - The name of the value host associated with this element, used to identify the validation target.
     */
    public listenForValueChanges(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseForm: IFivaseForm
    ): void {
        let self = this;
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
            case 'input':
                setupForInputTag();
                break;
            case 'select':
                setupSelectHandler();
                break;
            case 'textarea':
                setupChangeEventHandler();
                setupInputEventHandler();
                break;
            default:
                console.warn(`Unsupported tagName: ${tagName}`);
        }
    

        function setupForInputTag(): void {
            // Handle input types like checkbox and file
            switch ((element.getAttribute('type') || '').toLowerCase()) {
                case 'checkbox':
                    setupCheckboxHandler();
                    break;
                case 'file':
                    setupFileHandler();
                    break;
                default:
                    setupChangeEventHandler();
                    setupInputEventHandler();
                    break;
            }
        }

        function setupCheckboxHandler(): void {
            // Handle checkbox validation
            renderer.listen(element, 'change', (event: Event) => {
                const isChecked = (event.target as HTMLInputElement).checked;
                fivaseForm.setValue(valueHostName, isChecked, { validate: true });
            });
        }

        function setupFileHandler(): void {
            // Handle file input validation
            renderer.listen(element, 'change', (event: Event) => {
                const files = (event.target as HTMLInputElement).files;
                const fileData = files
                    ? JSON.stringify(
                        Array.from(files).map(file => ({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        }))
                    )
                    : ''; // Send empty string if no files are selected
                fivaseForm.setValue(valueHostName, fileData, { validate: true });
            });
        }

        function setupSelectHandler(): void {
            // Handle select element validation (only listen for 'change' event)
            renderer.listen(element, 'change', (event: Event) => {
                const selectValue = (event.target as HTMLSelectElement).value;
                fivaseForm.setInputValue(valueHostName, selectValue, { validate: true });
            });
        }

        function setupInputEventHandler(): void {
            if (self.inputEventEnabled) {
                //   renderer.listen(element, 'input', (event: Event) => {
                //     const inputValue = (event.target as HTMLInputElement).value;
                //     fivaseForm.setInputValue(valueHostName,  inputValue, { validate: true, duringEdis: true });
                //   });
                fromEvent(element, 'input')
                    .pipe(debounceTime(self.inputEventDebounceTime))  // Wait before handling the event
                    .subscribe((event: Event) => {
                        const inputValue = (event.target as HTMLInputElement).value;
                        fivaseForm.setInputValue(valueHostName, inputValue, { validate: true, duringEdit: true });
                    });
            }
        }

        function setupChangeEventHandler(): void {
            // Handle change event
            renderer.listen(element, 'change', (event: Event) => {
                const inputValue = (event.target as HTMLInputElement).value;
                fivaseForm.setInputValue(valueHostName, inputValue, { validate: true });
            });
        }
    }

    /**
     * Remove any event handlers that were attached to the element.
     * @param element 
     */
    public cleanupEventHandlers(element: HTMLElement, renderer: Renderer2): void
    {
        //!!! remove event handlers for 'change' and 'input' events
        // Need a solution that uses renderer object.
    }
}

/**
 * RendererActionBase provides a foundation for rendering, in support of a Directive.
 * This class offers the ability to apply or remove CSS classes 
 * based on validation states (valid/invalid).
 * 
 * Key features include:
 * - Two states based on ValidationState and valuehostname, useful to apply CSS classes and hide elements.
 *   States are named "Enabled" and "Disabled".
 * - Configurable CSS classes for Enabled and Disabled states.
 * - Can hide elements by applying a CSS class that sets display: none and the hidden attribute.
 * 
 */
export abstract class RendererActionBase implements IRendererAction {
    /**
     * Creates an instance of `RendererActionBase`.
     * 
     * @param enabledCssClass - Default CSS class applied when in enabled state. Overridden
     * by options.enabledCssClass if provided.
     * @param disabledCssClass - Default CSS class applied when in disabled state. Overridden
     * by options.disabledCssClass if provided.
     * @param hideElementWhenTwoStateIs - Optional parameter to hide the element when two states are present.
     * Its value determines with of the two states will hide the element. For true, hide when enabled.
     * For false, hide when disabled. Default is false. When null, do not support hidding.
     */
    constructor(
        enabledCssClass: string | null = null,
        disabledCssClass: string | null = null,
        hideElementWhenTwoStateIs: boolean | null = false
    ) {
        this._enabledCssClass = enabledCssClass;
        this._disabledCssClass = disabledCssClass;
        this._hideElementWhenTwoStateIs = hideElementWhenTwoStateIs;
    }

    /**
     * Default CSS class applied when in enabled state.
     * Overridden by options.enabledCssClass if provided.
     * 
     * @returns The CSS class for enabled state (can be an empty string or null).
     */
    protected get enabledCssClass(): string | null {
        return this._enabledCssClass;
    }
    private _enabledCssClass: string | null;

    /**
     * Default CSS class applied when in disabled state.
     * Overridden by options.disabledCssClass if provided.
     * 
     * @returns The CSS class for disabled state (can be an empty string or null).
     */
    protected get disabledCssClass(): string | null {
        return this._disabledCssClass;
    }
    private _disabledCssClass: string | null;
    
    /**
     * Optional parameter to hide the element when two states are present.
     * Its value determines which of the two states will hide the element.
     * For true, hide when enabled. For false, hide when disabled. Default is false.
     * When null, do not support hiding.
     * Hiding involves sets display: none and adding the hidden attribute to the element.
     * Removing hiding removes both the display style and the hidden attribute.
     */
    protected get hideElementWhenTwoStateIs(): boolean | null {
        return this._hideElementWhenTwoStateIs;
    }
    private _hideElementWhenTwoStateIs: boolean | null;

    /**
     * Applies validation-related render logic to the target element.
     * This class handles enabledCssClass and disabledCssClass properties.
     * 
     * @param element - The DOM element.
     * @param renderer - The Angular Renderer2 service, to allow changing the element's appearance.
     * @param valueHostName - The name of the value host associated with this element, used to
     * identify which validation rules apply.
     * @param validationState - A ValeuHosts' ValidationState, which includes the current validation status,
     * issues found, and other relevant data.
     * @param fivaseForm - Access to Fivase's features. Its validationManager property is 
     * Fivase's ValidationManager object, fully configured and ready to use. 
     * @param options - Determined by the Directive to deliver any attribute values it gets from the user.
     */
    public render(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions
    ): void {
        let twoStates = this.resolveTwoStates(valueHostName, validationState, fivaseForm, options);
        if (twoStates !== null) {
            this.twoStateRender(twoStates, element, renderer, valueHostName, validationState, fivaseForm, options);
            this.twoStateHideElement(twoStates, element, renderer);
        }
    }

    /**
     * Applies the UI render based on the two states (enabled/disabled). 
     * At this level, it applies enabledCssClass and disabledCssClass to the element.
     * @param enabledState 
     * @param element 
     * @param renderer 
     * @param valueHostName 
     * @param validationState 
     * @param fivaseForm - Access to Fivase's features. Its validationManager property is 
     * Fivase's ValidationManager object, fully configured and ready to use. 
     * @param options 
     */
    protected twoStateRender(
        enabledState: boolean,
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions
    )
    {
        let enabledCssClass = options?.enabledCssClass ?? this.enabledCssClass;
        let disabledCssClass = options?.disabledCssClass ?? this.disabledCssClass;

        if (enabledState) {
            changeCssClasses(enabledCssClass, disabledCssClass, element, renderer);
        } else {
            changeCssClasses(disabledCssClass, enabledCssClass, element, renderer);
        }
    }

    /**
     * UI Render to hide or unhide the element based on the two states
     * and the hideElementWhenTwoStateIs property.
     * @param enabledState 
     * @param element 
     * @param renderer 
     * @returns 
     */
    protected twoStateHideElement(enabledState: boolean, element: HTMLElement, renderer: Renderer2): void {
        if (this.hideElementWhenTwoStateIs !== null) {
            let enabledStateForHide = this.hideElementWhenTwoStateIs;
            if (enabledState === enabledStateForHide) {
                renderer.setStyle(element, 'display', 'none');
                renderer.setAttribute(element, 'hidden', 'true');
            } else {
                renderer.removeStyle(element, 'display');
                renderer.removeAttribute(element, 'hidden');
            }    
        }
    }

    /**
     * Abstract method to determine whether the element should be enabled or disabled based on the validation state
     * and/or value host. If the render does not use two-states, it should return null.
     * When not-null, the enabledCssClass and disabledCssClass will be applied based on the return value.
     */
    protected abstract resolveTwoStates(
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions): boolean | null;

    /**
     * Utility to add an error message to an element and apply appropriate attributes, including data-severity='error|severe|warn'.
     * @param element 
     * @param renderer 
     * @param errorMessage 
     */
    protected addErrorMessageToElement(element: HTMLElement, renderer: Renderer2, issueFound: IssueFound): void {
        renderer.setProperty(element, 'innerHTML', issueFound.errorMessage);    // NOTE: errorMessage is already in HTML format
        renderer.setAttribute(element, 'data-severity', ValidationSeverity[issueFound.severity].toLowerCase());
        //!!!PENDING: ARIA attributes
    }
}

/**
 * Utility adds one css class and removes another. Classes can be null or undefined to take no action.
 */
export function changeCssClasses(toAdd: string | null | undefined, toRemove: string | null | undefined, element: HTMLElement, renderer: Renderer2): void {
    if (toAdd) {
        renderer.addClass(element, toAdd);
    }
    if (toRemove) {
        renderer.removeClass(element, toRemove);
    }
}    

/**
 * Concrete implementation of `IRendererAction` that applies a CSS class to the target element
 * depending on ValidationState.IssuesFound. It uses enabledCssClass when there are issues found and disabledCssClass
 * when there are no issues found.
 * The default classes are enabledCssClass = 'invalid' and disabledCssClass = 'valid'.
 * 
 * This class does not show the error messages within IssuesFound. 
 * For that, use ErrorMessagesRenderer.
 * This class does not change the visibility of the element, unless
 * the CSS classes have styles for that. Consider ShowWhenIssuesFoundRenderer instead.
 * 
 * This targets the IssuesFoundDirective.
 * It is the default supplied by a factory. If you want to change the 
 * constructor's parameters, consider just replacing the default in factory.defaultFallback
 * where you setup the FivaseServices.
 * ```ts
 * fivaseServices.getFactory(DIRECTIVE_NAME, ACTION_RENDERER).defaultFallback(new IssuesFoundRenderer('invalid-issues', 'valid-issues'));
 * ```
 * Alternatively, use the [fivase-render] attribute to supply an instance directly to the tag.
 */
export class IssuesFoundRenderer extends RendererActionBase {

    constructor(
        enabledCssClass: string | null = 'invalid',
        disabledCssClass: string | null = 'valid') {
        super(enabledCssClass, disabledCssClass, false);
    }
    
    protected resolveTwoStates(valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions): boolean | null {
        return validationState.issuesFound && validationState.issuesFound.length > 0;
    }
}

/**
 * Concrete implementation of `IRendererAction` that hides or shows the element based on the presence of issues.
 * It does not change any CSS classes.
 * 
 * This targets the ShowWhenIssuesFoundDirective.
 * It is the default supplied by a factory. If you want to change the 
 * constructor's parameters, consider just replacing the default in factory.defaultFallback
 * where you setup the FivaseServices.
 * ```ts
 * fivaseServices.getFactory(DIRECTIVE_NAME, ACTION_RENDERER).defaultFallback(new ShowWhenIssuesFoundRenderer('invalid-showissues', 'valid-showissues'));
 * ```
 * Alternatively, use the [fivase-render] attribute to supply an instance directly to the tag.
 */
export class ShowWhenIssuesFoundRenderer extends RendererActionBase {
    constructor(
        enabledCssClass: string | null = null,
        disabledCssClass: string | null = null) {
        super(enabledCssClass, disabledCssClass, true);
    }

    protected resolveTwoStates(valueHostName: string, validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions): boolean | null {
        return validationState.issuesFound && validationState.issuesFound.length > 0;
    }
}

/**
 * Concrete implementation of `IRendererAction` that shows or hides the element based on 
 * the ValidationState.corrected property. By default, it has no CSS classes assigned to enabledCssClass
 * or disabledCssClass because its focus is visibility.
 * 
 * This targets the ShowWhenCorrectedDirective.
 * It is the default supplied by a factory. If you want to change the 
 * constructor's parameters, consider just replacing the default in factory.defaultFallback
 * where you setup the FivaseServices.
 * ```ts
 * fivaseServices.getFactory(DIRECTIVE_NAME, ACTION_RENDERER).defaultFallback(new ShowWhenCorrectedRenderer('corrected', 'not-corrected'));
 * ```
 * Alternatively, use the [fivase-render] attribute to supply an instance directly to the tag.
 */
export class ShowWhenCorrectedRenderer extends RendererActionBase {
    constructor(
        enabledCssClass: string | null = null,
        disabledCssClass: string | null = null) {
        super(enabledCssClass, disabledCssClass, true);
    }
    protected resolveTwoStates(valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions): boolean | null {
        return validationState.corrected;
    }
}

/**
 * Concrete implementation of `IRendererAction` that shows or hides the element based on
 * the ValueHost.requiresInput property. By default, it has no CSS classes assigned to enabledCssClass
 * or disabledCssClass because its focus is visibility.
 * 
 * This targets the ShowWhenRequiredDirective.
 * It is the default supplied by a factory. If you want to change the 
 * constructor's parameters, consider just replacing the default in factory.defaultFallback
 * where you setup the FivaseServices.
 * ```ts
 * fivaseServices.getFactory(DIRECTIVE_NAME, ACTION_RENDERER).defaultFallback(new ShowWhenRequiredRenderer('required', 'not-required'));
 * ```
 * Alternatively, use the [fivase-render] attribute to supply an instance directly to the tag.
 */
export class ShowWhenRequiredRenderer extends RendererActionBase {
    
    constructor(
        enabledCssClass: string | null = null,
        disabledCssClass: string | null = null) {
        super(enabledCssClass, disabledCssClass, true);
    }
    protected resolveTwoStates(valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions): boolean | null {
        let vh = fivaseForm.validationManager.getInputValueHost(valueHostName);
        if (!vh) {
            throw new Error(`ValueHost not found for ${valueHostName}.`);
        }
        return vh.requiresInput;
    }
}

/**
 * This implementation of `IRendererAction` generates a list of error messages from
 * the IssuesFound array in the validation state. While it can be used to fully display the UI
 * for errors, it is designed to be used in conjunction with other render directives within
 * a component that offers complexities found in UIs that display errors, such as popups
 * and icons.
 * 
 * The list has two tags: an outer tag (default is 'ul') and an inner tag (default is 'li'). 
 * The outer tag encloses the list.
 * The inner tag contains the error message.
 * If there are no issues found, the element is hidden and existing error messages are discarded.
 * Expects issueFound.errorMessage to contain HTML. 
 * 
 * You can provide alternative tags through the constructor. You can omit the outer tag by setting it to null.
 * You can also provide CSS classes for the outer and inner tags through the constructor. They have defaults
 * of 'error-messages' and 'error-message' respectively.
 * 
 * This is a two-state class where 'enabled' means
 * there are issues found and 'disabled' means there are no issues found.
 * 
 * The enabledCssClass and disabledCssClass properties are not provided a default value.
 * We expect the user to assign any classes they need directly to the tag, as its value is not influenced by 
 * the issuesFound.
 * 
 * This targets the ErrorMessagesDirective.
 * It is the default supplied by a factory. If you want to change the 
 * constructor's parameters, consider just replacing the default in factory.defaultFallback
 * where you setup the FivaseServices.
 * ```ts
 * fivaseServices.getFactory(DIRECTIVE_NAME, ACTION_RENDERER).defaultFallback(new ErrorMessagesRenderer('ul', 'li, 'error-list', 'error-item'));
 * ```
 * Alternatively, use the [fivase-render] attribute to supply an instance directly to the tag.
 */
export class ErrorMessagesRenderer extends RendererActionBase {
    constructor(
        outerTag: string | null = 'ul',
        innerTag: string = 'li',
        outerTagCssClass: string | null = 'error-messages',
        innerTagCssClass: string | null = 'error-message',
        enabledCssClass?: string,
        disabledCssClass?: string
    ) {
        super(enabledCssClass, disabledCssClass);
        this._outerTag = outerTag;
        this._innerTag = innerTag;
        this._outerTagCssClass = outerTagCssClass;
        this._innerTagCssClass = innerTagCssClass;
    }

    /**
     * Determines the outer tag surrounding a list of error messages.
     * It defaults to 'ul'.
     */
    protected get outerTag(): string | null{
        return this._outerTag;
    }
    private _outerTag: string | null;

    /**
     * Provides a class for the element that surrounds the list of error messages.
     * Use null to not apply a class.
     */
    protected get outerTagCssClass(): string | null {
        return this._outerTagCssClass;
    }
    private _outerTagCssClass: string | null;

    /**
     * Provides a class for the inner tag that contains each error message in the list.
     * Use null to not apply a class.
     */
    protected get innerTagCssClass(): string | null {
        return this._innerTagCssClass;
    }
    private _innerTagCssClass: string | null;

    /**
     * Determines the inner tag for each error message in the list.
     * It defaults to 'li'.
     */
    protected get innerTag(): string {
        return this._innerTag;
    }   
    private _innerTag: string;

    public render(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions
    ): void {
        // Clear existing content inside the element
        renderer.setProperty(element, 'innerHTML', '');

        let issuesFound = validationState.issuesFound;
        if (issuesFound && issuesFound.length > 0) {
            if (this.outerTag === null) {
                // No outer tag, so just display the first error message
                const listItem = renderer.createElement(this.innerTag);
                changeCssClasses(this.innerTagCssClass, null, listItem, renderer);
                this.addErrorMessageToElement(listItem, renderer, issuesFound[0]);
                renderer.appendChild(element, listItem);
            }
            else {
                // Create a the outer tag element to display the list
                const outer = renderer.createElement(this.outerTag);
                changeCssClasses(this.outerTagCssClass, null, outer, renderer);

                // Loop through issues and create an inner tag for each error message
                issuesFound.forEach(issue => {
                    const listItem = renderer.createElement(this.innerTag);
                    changeCssClasses(this.innerTagCssClass, null, listItem, renderer);
                    this.addErrorMessageToElement(listItem, renderer, issue);
                    renderer.appendChild(outer, listItem);
                });

                // Append the <ul> to the component's element
                renderer.appendChild(element, outer);
            }
        }

        // Apply the CSS class logic from the base class
        super.render(element, renderer, valueHostName, validationState, fivaseForm, options);
    }

    /**
     * Enables when validationState.issuesFound is not empty.
     * @param valueHostName 
     * @param validationState 
     * @param fivaseForm - Access to Fivase's features. Its validationManager property is 
     * Fivase's ValidationManager object, fully configured and ready to use. 
     * @param options 
     * @returns true if issuesFound is not empty.
     */
    protected resolveTwoStates(
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseForm: IFivaseForm,
        options?: IRendererActionOptions): boolean | null {
        return validationState.issuesFound && validationState.issuesFound.length > 0;
    }
}

/**
 * These are used by the Fivase Directives to
 * associate themselves with the appropriate ActionFactoryBase implementations.
 */
export const DIRECTIVE_VALIDATE_INPUT = 'fivase-ValidateInput';
export const DIRECTIVE_VALIDATION_ERRORS = 'fivase-ErrorMessages';
export const DIRECTIVE_SHOW_WHEN_ISSUES_FOUND = 'fivase-ShowWhenIssuesFound';
export const DIRECTIVE_SHOW_WHEN_CORRECTED = 'fivase-ShowWhenCorrected';
export const DIRECTIVE_SHOW_WHEN_REQUIRED = 'fivase-ShowWhenRequired';

export const ACTION_RENDERER = 'Renderer';
export const ACTION_VALUE_CHANGE_LISTENER = 'ValueChangeListener';

/**
 * Interface for ActionFactoryBase without generics.
 */
export interface IActionFactory {
    /**
     * The name of the directive associated with this factory.
     */
    get directiveName(): string;

    /**
     * The name of the Directive Action associated with this factory.
     * This value is always used by available/unavailable methods.
     */
    get actionName(): string;

    /**
     * Determines if the directiveName and actionName match the given parameters.
     * Always uses case sensitive match.
     * @param directiveName
     * @param actionName
     */
    matches(directiveName: string, actionName: string): boolean;

    /**
     * Registers an instance of a directive action associated with a unique 
     * name. These values are only used when the resolve function is supplied
     * the name parameter. The name parameter value is expected to come from the Directive's
     * [fivase-render] or [fivase-valuechangelistener] attribute, and is null or undefined
     * if the attribute is not present.
     * 
     * @param name - The name used to register the instance.
     * @param instance - The instance of the directive action.
     */
    register(name: string, instance: any): void;

    /**
     * Returns the appropriate instance of the directive action based on the element, name parameter,
     * and component's attached directive action. Name parameter overrides all. If no name is provided,
     * the component's instance is used if found. Otherwise, the default instance is used.
     * If the name is not registered, expect an error.
     * @param element 
     * @param name 
     * @returns 
     */
    resolve(element: HTMLElement, name: string | null | undefined): any;

    /**
     * Used by a component to attach its own instance of the directive action to an element.
     * Expected to be called from the component's ngOnInit method. 
     * Its instance may be a standalone class or the component itself, which implements the interface T.
     * @param element 
     * @param instance 
     */
    available(element: HTMLElement, instance: any): void;

    /**
     * Used by a component to detach its own instance of the directive action from an element.
     * Expected to be called from the component's ngOnDestroy method.
     */
    unavailable(element: HTMLElement): void;
}

/**
 * Abstract factory class that manages the `IValueChangeListenerAction` and
 * `IRendererAction` instances needed by Fivase Directives. 
 * 
 * Each Directive will create subclasses specific to each Directive Action it uses.
 * Those will be registered in the FivaseServices class via IFivaseServices.registerFactory.
 * Directives must create unique names for themselves, and pass those keys to lookup
 * the factory in IFivaseServices.getFactory.
 * 
 * Implementations of this class should be specific to Directive Actions.
 * 
 * Thus a Directive can have multiple factories, each managing a different type of Directive Action.
 * 
 * The Directive will get the FivaseServices through DI in the constructor,
 * and will use the factory's resolve method to get the appropriate instance.
 * There are several sources for the instance: 
 * - A default instance, which is normally used. It is created by the factory and
 *   in the defaultFallback property. The user can override it during factory setup.
 * - Instances registered to a unique name. That name will be supplied by attributes
 *   found on the same element or component as the directive: [fivase-render] and
 *   [fivase-valuechangelistener]. So the user can supply the unique name through the attribute
 *   to override the default instance.
 * - Components often have to supply a specific implementation that handles their unique event
 *   handling or Render requirements. They can either implement stand-alone classes
 *   or implement the interfaces directly on the component class. Within the component,
 *   they notify the factory to use their implementation by calling the available.
 *   The factory's resolve function will look for that instance, before falling back
 *   to the default instance. However, using the name will override the component's instance.
 * 
 * NOTE: By design, the factory expects the instances it holds to be immutable and resuable.
 */
export abstract class ActionFactoryBase<T> implements IActionFactory {
    constructor (directiveName: string, defaultFallback: T) {
        this._defaultFallback = defaultFallback;
        this._directiveName = directiveName;
    }
//#region find the right factory
    /**
     * The name of the directive associated with this factory.
     */
    public get directiveName(): string {
        return this._directiveName;
    }
    private _directiveName: string;

    /**
     * The name of the Directive Action associated with this factory.
     * This value is always used by available/unavailable methods.
     */
    public abstract get actionName(): string;

    /**
     * Determines if the directiveName and actionName match the given parameters.
     * Always uses case sensitive match.
     * @param directiveName 
     * @param actionName 
     * @returns 
     */
    public matches(directiveName: string, actionName: string): boolean {
        return this.directiveName === directiveName && this.actionName === actionName;
    }
    //#endregion find the right factory

    /**
     * If no named or component associated instance if found, this instance will be used.
     */
    public get defaultFallback(): T {
        return this._defaultFallback;
    }
    private _defaultFallback: T;

    protected ensureValidInstance(instance: T): void {
        if (!this.isValidInstance(instance)) {
            throw new Error('Invalid instance provided.');
        }
    }

//#region instance management    
    /**
     * Contains instances that were registered by name.
     * Names are case insensitive and stored here in lowercase.
     */
    private registryByName: Map<string, T> = new Map();

    /**
     * Registers an instance of a directive action associated with a unique 
     * name. These values are only used when the resolve function is supplied
     * the name parameter. The name parameter value is expected to come from the Directive's
     * [fivase-render] or [fivase-valuechangelistener] attribute, and is null or undefined
     * if the attribute is not present.
     * 
     * @param name - The name used to register the instance.
     * @param instance - The instance of the directive action.
     */
    public register(name: string, instance: T): void {
        this.ensureValidInstance(instance);
        this.registryByName.set(name.toLowerCase(), instance);
    }

    /**
     * Returns the appropriate instance of the directive action based on the element, name parameter,
     * and component's attached directive action. Name parameter overrides all. If no name is provided,
     * the component's instance is used if found. Otherwise, the default instance is used.
     * If the name is not registered, expect an error.
     * @param element 
     * @param name 
     * @returns 
     */
    public resolve(element: HTMLElement, name: string | null | undefined): T {
        if (name) {
            let instance = this.registryByName.get(name.toLowerCase());
            if (instance) 
                return instance;
            throw new Error(`No instance found for name: ${name} in the factory ${this.constructor.name}.`);
            
        }
        let componentInstance = this.getFromComponent(element);
        if (componentInstance) {
            return componentInstance;
        }
        return this.defaultFallback;
    }

    /**
     * Returns the instance of the directive action that is attached to the component
     * or undefined if none.
     * @param element 
     * @returns 
     */
    protected getFromComponent(element: HTMLElement) : T | undefined {
        return (element as any)[this.customPropertyName];
    }
    //#endregion instance management
    
    /**
     * Used by a component to attach its own instance of the directive action to an element.
     * Expected to be called from the component's ngOnInit method. 
     * Its instance may be a standalone class or the component itself, which implements the interface T.
     * @param element 
     * @param instance 
     */
    public available(element: HTMLElement, instance: T): void {
        this.ensureValidInstance(instance);
        (element as any)[this.customPropertyName] = instance;
    }
    /**
     * Used by a component to detach its own instance of the directive action from an element.
     * Expected to be called from the component's ngOnDestroy method.
     */
    public unavailable(element: HTMLElement): void {
        delete (element as any)[this.customPropertyName];
    }

    /**
     * Each Directive supports a component's unique implementation by providing
     * a name here. This name is used on as a custom property on the HTMLElement.
     * The available method uses this to add the custom property to the element.
     * Likewise, unavailable removes the custom property.
     * The resolve method will look for this custom property and use the instance if found.
     */
    protected get customPropertyName(): string
    {
        return `fivase-${this.directiveName}-${this.actionName}`;
    }

    /**
     * Validates the given instance to ensure it matches the required type.
     * 
     * @param instance - The instance to validate.
     * @returns A boolean indicating whether the instance is valid.
     */
    protected abstract isValidInstance(instance: T): boolean;
}

/**
 * Factory for the `IRendererAction` interface.
 * All Directives that use this must supply their DirectiveName and default implementation
 * of IRendererAction in the constructor.
 */
export class RendererActionFactory extends ActionFactoryBase<IRendererAction> {

    constructor(directiveName: string, defaultFallback: IRendererAction) {
        super(directiveName, defaultFallback);
    }

    public get actionName(): string {
        return ACTION_RENDERER;
    }
    protected isValidInstance(instance: IRendererAction): boolean {
        return instance && typeof instance.render === 'function';
    }
}

/**
 * Factory for the `IValueChangeListenerAction` interface.
 * All Directives that use this must supply their DirectiveName and default implementation
 * of IValueChangeListenerAction in the constructor.
 */
export class ValueChangeListenerActionFactory extends ActionFactoryBase<IValueChangeListenerAction> {
    
    constructor(directiveName: string, defaultFallback: IValueChangeListenerAction) {
        super(directiveName, defaultFallback);
    }

    public get actionName(): string {
        return ACTION_VALUE_CHANGE_LISTENER;
    }

    protected isValidInstance(instance: IValueChangeListenerAction): boolean {
        return instance && typeof instance.listenForValueChanges === 'function';
    }
}

/**
 * Abstract base class for Fivase-related directives that need a ValueHostName.
 * 
 * Subclasses define the directive name, like "validate" or "validationErrors",
 * and all take the value of a ValueHostName, which identifies the input
 * whose validation state is being used. 
 * Its up to the subclass to determine how to modify the UI and consume the validation state
 * or ValueHost values.
 *
 * Key functionality includes:
 * - Resolving the target HTML element based on the `fivase-target` input.
 * - Can inherit the valueHostName from a ValueHostNameDirective applied to a containing tag.
 *   In that case, this directive does not need anything assigned to it.
 * 
 * Every implementation requires it to be assigned to a Jivs `ValueHostName` 
 * for the validation system to associate it with the appropriate form control.
 * ```ts
 * <tag [directive]="valueHostName"></tag>
 * ```
 * However, the valueHostName can be inherited from a parent ValueHostNameDirective.
 * ```ts
 * <tag [valueHostName]="valueHostName">
 *    <tag [directive]>
 * </tag>
 * 
 * ### [fivase-target]
 * This optional input allows the directive to target a specific element within a component's template 
 * where this directive will do its work. If not provided, the directive will use the host element.
 */
@Directive()
export abstract class FivaseDirectiveBase implements OnInit, OnDestroy {
    /**
     * The internal property that will be used in the directive to manage
     * the name of the value host. The `valueHostName` is part of the 
     * Jivs validation system and allows Jivs to identify 
     * which form field is being represented for validation.
     * 
     * This property is defined in the base class but must be overridden
     * in the subclass using the `@Input()` decorator to assign it a formal
     * input name (e.g., 'validate', 'validationErrors', etc.).
     * 
     * This allows the directive to either take a value directly via input or 
     * inherit it from a parent `ValueHostNameDirective`.
     */
    @Input() valueHostName: string | undefined;

    /**
     * Input to support finding a specific host element for the directive action.
     * This input can be passed as a string or an object, where:
     * - A string can be a CSS selector or a template reference.
     * - An object can specify either a selector or a template reference.
     */
    @Input('fivase-target') target: string | { selector?: string } | undefined;

    constructor(
        protected el: ElementRef,
        protected renderer: Renderer2,
        protected fivaseServices: FivaseServices,
        protected fivaseForm: IFivaseForm,
        @Optional() @SkipSelf() private valueHostNameDirective: ValueHostNameDirective,
    ) {
    }

    ngOnInit(): void {
        this.setupDirective(this.resolveValueHostName());
    }

    /**
    * Provide Directive-specific setup during the ngOnInit phase, such as 
    * subscribing to events or creating the initial visual content.
    */
    protected abstract setupDirective(valueHostName: string): void;

    /**
    * ValueHostName is required and comes from the valueHostName property if already assigned,
    * or looks for a containing ValueHostNameDirective to get it.
    * Throws error if neither have supplied it.
    */
    protected resolveValueHostName(): string {
        let valueHostName = this.valueHostName;
        // Inherit valueHostName from ValueHostNameDirective if not provided via @Input()
        if (!valueHostName && this.valueHostNameDirective) {
            valueHostName = this.valueHostNameDirective.valueHostName;
        }

        if (!valueHostName)
            throw new Error('valueHostName is required and cannot be null or empty for FivaseDirectiveBase.');

        return valueHostName;
    }

    /**
     * Resolves the target HTML element based on the `target` input.
     * If a CSS selector is provided, it will be used to query for the target element.
     * If no selector is provided, the host element will be returned.
     * 
     * @returns The resolved HTML element to which the directive applies.
     */
    protected getTargetElement(): HTMLElement {
        const targetOptions = typeof this.target === 'string'
            ? { selector: this.target }
            : this.target;

        if (targetOptions?.selector) {
            const element = this.el.nativeElement.querySelector(targetOptions.selector);
            if (element) {
                return element;
            } else {
                throw new Error(`Selector ${targetOptions.selector} did not match any elements.`);
            }
        }

        return this.el.nativeElement;
    }

    ngOnDestroy(): void {
        // not required but good form
        (this.el as any) = undefined;
        (this.fivaseServices as any) = undefined;        
        (this.fivaseForm as any) = undefined;
        (this.valueHostNameDirective as any) = undefined;
    }

}

/**
 * Abstract base class for Fivase Directives that provides an implementation of `IRendererAction` to 
 * update the user interface based on validation state changes.
 * 
 * Key functionality includes:
 * - Subscribing to validation state changes via the `FivaseForm`.
 * - Applying a render through an object that supports `IRendererAction`, which
 *   comes from a factory property on FivasServicesHost.
 * 
 * Every implementation requires it to be assigned to a Jivs `ValueHostName` 
 * for the validation system to associate it with the appropriate form control.
 * ```ts
 * <tag [directive]="valueHostName"></tag>
 * ```
 * However, the valueHostName can be inherited from a parent ValueHostNameDirective.
 * ```ts
 * <tag [valueHostName]="valueHostName">
 *    <tag [directive]>
 * </tag>
 * ```
 * 
 * ### [fivase-target]
 * This optional input allows the directive to target a specific element within a component's template 
 * where this directive will do its work. If not provided, the directive will use the host element.
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IRendererAction from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 */
@Directive()
export abstract class RenderingDirectiveBase extends FivaseDirectiveBase {

    /**
     * Select a custom implementation of `IRendererAction` from the factory
     * by supplying the name of the implementation. The name is case-insensitive.
     */
    @Input('fivase-render') renderFactoryName: string | undefined;

    private subscription: Subscription | null = null;
    protected directiveRenderer: IRendererAction | null = null;

    constructor(
        el: ElementRef,
        renderer: Renderer2,
        fivaseServices: FivaseServices,
        fivaseForm: IFivaseForm,
        @Optional() @SkipSelf() valueHostNameDirective: ValueHostNameDirective
    ) {
        super(el, renderer, fivaseServices, fivaseForm, valueHostNameDirective);
    }

    /**
     * The constant used to identity the directive in factory lookups.
     */
    protected abstract get directiveNameInFactory(): string;

    /**
     * Establishes the IRendererAction implementation from either the [fivase-render] input or the Factory.
     * Establishes a subscription to the validation state changes for the ValueHost.
     * @param valueHostName 
     */
    protected setupDirective(valueHostName: string): void {
        this.directiveRenderer = this.resolveRendererFactory.resolve(
            this.el.nativeElement, this.renderFactoryName);

        this.setupSubscription(valueHostName);
        this.setupInitialRender(valueHostName);
    }

    /** 
     * Gets the factory from fivaseServices used to create the IRendererAction implementation.
    */
    protected get resolveRendererFactory(): RendererActionFactory
    {
        return this.fivaseServices.getFactory(this.directiveNameInFactory, ACTION_RENDERER) as RendererActionFactory;
    }

    /**
     * Uses the FivaseForm to subscribe to validation state changes for the ValueHost.
     * Passes the validation state to the IRendererAction implementation.
     * @param valueHostName 
     */
    private setupSubscription(valueHostName: string): void {
        this.subscription = this.fivaseForm.subscribeToValueHostValidationState(valueHostName, (validationState) => {
            this.onValueHostValidationStateChanged(this.getTargetElement(), validationState);
        });
    }

    /**
     * Ensures the UI conforms with the current validation state
     */
    protected setupInitialRender(valueHostName: string): void {
        let vh = this.fivaseForm.validationManager.getValidatorsValueHost(valueHostName)!;
        if (!vh)
            throw new Error(`Unknown valueHostName "${valueHostName}"`);
        this.onValueHostValidationStateChanged(this.getTargetElement(), vh.currentValidationState);
    }

    /**
     * Handles the render of a validation state change on a ValueHost.
     * 
     * This method applies validation render using the `IRendererAction`.
     * 
     * @param targetElement - The resolved HTML element to apply the render to.
     * @param validationState - The current validation state of the ValueHost.
     */
    protected onValueHostValidationStateChanged(targetElement: HTMLElement, validationState: ValueHostValidationState): void {
        this.directiveRenderer!.render(
            targetElement,
            this.renderer,
            this.valueHostName!,
            validationState,
            this.fivaseForm,
            this.getRenderOptions()
        );
    }

    /**
     * Utility to add or remove the data-severity attribute on the targetElement. This attribute indicates
     * the highest severity of the issues found in the validation state when present. Its values are 'error', 'severe', or 'warn'.
     * @param targetElement 
     * @param validationState 
     */
    protected severityAttribute(targetElement: HTMLElement, validationState: ValueHostValidationState): void {
        const issuesFound = validationState.issuesFound;
        const isValid = !issuesFound || issuesFound.length === 0;   // instead of checking doNotSave, which will be false if there are warning issues that we want to display

        if (isValid) {
            this.renderer.removeAttribute(targetElement, 'data-severity');
        } else {
            // find the highest severity and set it as data-severity
            let highestSeverity = issuesFound.reduce((highest, issue) => issue.severity > highest ? issue.severity : highest, ValidationSeverity.Warning);
            this.renderer.setAttribute(targetElement, 'data-severity', ValidationSeverity[highestSeverity].toLowerCase());
        }
    }
    /**
     * Returns the options for validation render. 
     * Subclasses can override this method to provide options such as CSS classes or other attributes.
     * 
     * @returns An object with configuration options for validation render.
     */
    protected getRenderOptions(): IRendererActionOptions {
        return {};
    }

    /**
     * Cleans up by unsubscribing from validation state changes when the directive is destroyed.
     */
    public ngOnDestroy(): void {
        this.resolveRendererFactory.unavailable(this.el.nativeElement);

        if (this.subscription) {
            this.fivaseForm.unsubscribeFromValueHostValidationState(this.subscription);
            (this.subscription as any) = undefined;
        }
        // not required but good form
        (this.directiveRenderer as any) = undefined;

        super.ngOnDestroy();
    }
}
/**
 * Directive `validate` manages how an input element interacts with Fivase.
 * It must supply the value to be validated to ValidationManager and update the 
 * UI to show any validation state changes.
 * 
 * 'validate' takes the value of the ValueHostName registered with Jivs ValidationManager.
 * 
 * It either must be assigned the `ValueHostName` or be contained within a `ValueHostNameDirective`.
 * ```ts
 * <tag [validate]="valueHostName"></tag>
 * ```
 * ```ts
 * <tag [valueHostName]="valueHostName">
 *    <tag [validate]>
 * </tag>
 * ```
 * ### [fivase-target]
 * This optional input allows the directive to target a specific element within a component's template 
 * where this directive will do its work. If not provided, the directive will use the host element.
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IRendererAction from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * When not assigned, the factory defaults to the IssuesFoundRenderer.
 * 
 * ### [fivase-valuechangelistener]
 * Use to select the custom implementation of IValueChangeListenerAction from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * When not assigned, the factory defaults to the HtmlTagValueChangeListener.
 */
@Directive({
    selector: '[validate]'
})
export class ValidateInputDirective extends RenderingDirectiveBase {

    /**
     * The internal property that will be used in the directive to manage
     * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
     * which form field is being represented for validation.
     * 
     * This allows the directive to either take a value directly via input or 
     * inherit it from a parent `ValueHostNameDirective`.
     */

    @Input('validate') valueHostName: string | undefined;

    /**
     * CSS class applied when validation fails (invalid state).
     * Passed along to the IRendererAction implementation.
     */
    @Input('invalid-class') invalidCssClass: string = 'input-invalid';

    /**
     * CSS class applied when validation succeeds (valid state).
     * Passed along to the IRendererAction implementation.
     */
    @Input('valid-class') validCssClass: string = 'input-valid';

    /**
     * Select a custom implementation of `IValueChangeListenerAction` from the factory
     * by supplying the name of the implementation. The name is case-insensitive.
     */
    @Input('fivase-valuechangelistener') eventHandlerName:string |  undefined;

    constructor(
        el: ElementRef,
        renderer: Renderer2,
        fivaseServices: FivaseServices,
        fivaseForm: IFivaseForm,
        valueHostNameDirective: ValueHostNameDirective
    ) {
        super(el, renderer, fivaseServices, fivaseForm, valueHostNameDirective);
    }

    protected get directiveNameInFactory(): string {
        return DIRECTIVE_VALIDATE_INPUT;
    }

    protected get resolveEventHandlerFactory(): ValueChangeListenerActionFactory {
        return this.fivaseServices.getFactory(this.directiveNameInFactory, ACTION_VALUE_CHANGE_LISTENER) as ValueChangeListenerActionFactory;
    }

    /**
     * resolves the IValueChangeListenerAction implementation from either the [fivase-valuechangelistener] input or the Factory.
     * Has the event handler setup the input events to deliver the input value to the ValidationManager.
     * @param valueHostName 
     */
    protected setupDirective(valueHostName: string): void {
        let eventHandler = this.resolveEventHandlerFactory
            .resolve(this.el.nativeElement, this.eventHandlerName);

        if (!eventHandler)
            throw new Error('No event handler was created for the directive.');

        eventHandler.listenForValueChanges(
            this.getTargetElement(),
            this.renderer,
            valueHostName,
            this.fivaseForm
        );
    }

    /**
     * Override to manage the data-invalid attribute based on validation issues.
     * This method sets or removes the 'data-invalid' and 'data-severity' attributes based on whether 
     * validation issues are found.
     * The data-invalid attribute is used by ContainsInvalidChildrenDirective to find invalid children.
     * 
     * NOTE: While its possible to combine data-severity into data-invalid as a single attribute,
     * we want to use data-severity in other cases, whereas data-invalid is specific to the input, so you can find the input.
     */
    protected onValueHostValidationStateChanged(targetElement: HTMLElement, validationState: ValueHostValidationState): void {
        const issuesFound = validationState.issuesFound;
        const isValid = !issuesFound || issuesFound.length === 0;   // instead of checking doNotSave, which will be false if there are warning issues that we want to display

        if (isValid) {
            this.renderer.removeAttribute(targetElement, 'data-invalid');
        } else {
            this.renderer.setAttribute(targetElement, 'data-invalid', 'true');
        }
        this.severityAttribute(targetElement, validationState);

        // Call the base class to handle render
        super.onValueHostValidationStateChanged(targetElement, validationState);
    }

    /**
     * Override the method to pass the valid and invalid CSS classes to the render.
     * 
     * @returns An object containing the valid and invalid CSS classes.
     */
    protected getRenderOptions(): IRendererActionOptions {
        return {
            enabledCssClass: this.invalidCssClass,
            disabledCssClass: this.validCssClass
        };
    }
    public ngOnDestroy(): void {
        this.resolveEventHandlerFactory
            .unavailable(this.el.nativeElement);
        super.ngOnDestroy();
    }
}

/**
 * Directive `validationErrors` manages the display of validation error messages for a single
 * input. While its target element can be used as the entire error message container, it is
 * typically used to target a specific element within a component designed to show error messages.
 * That component often has other parts, like icons or other text, that are not part of the error message.
 * 
 * 'validationErrors' takes the value of the ValueHostName registered with Jivs ValidationManager.
 * 
 * It either must be assigned the `ValueHostName` or be contained within a `ValueHostNameDirective`.
 * ```ts
 * <tag [validationErrors]="valueHostName"></tag>
 * ```
 * ```ts
 * <tag [valueHostName]="valueHostName">
 *    <tag [validationErrors]>
 * </tag>
 * ```
 * ### [fivase-target]
 * This optional input allows the directive to target a specific element within a component's template 
 * where this directive will do its work. If not provided, the directive will use the host element.
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IRendererAction, instead of using the Factory.
 * It takes the class name of the desired IRendererAction object.
 * When not assigned, the factory defaults to ErrorMessagesRenderer which displays a list of error messages in <ul><li> tags.
 * 
 * Example usage:
 * ```html
 * <div [validationErrors]="valueHostName"></div>
 * ```
 * ```html
 * \\ a component called "errorMessages" that includes icons and other text, plus uses this for the error messages:
 * <div [showWhenInvalid]="valueHostName">
 *  <div>
 *      <img src="error-icon.png" />
 *      <span>Errors are listed:</span>
 *  </div>
 *  <div [validationErrors]="valueHostName"></div>
 * </div>
 * ```
 */
@Directive({
    selector: '[validationErrors]',
})
export class ValidationErrorsDirective extends RenderingDirectiveBase {
    protected get directiveNameInFactory(): string {
        return DIRECTIVE_VALIDATION_ERRORS;
    }   

    /**
     * The internal property that will be used in the directive to manage
     * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
     * which form field is being represented for validation.
     * 
     * This allows the directive to either take a value directly via input or 
     * inherit it from a parent `ValueHostNameDirective`.
     */
    @Input('validationErrors') valueHostName: string | undefined;
    /**
     * CSS class applied when validation fails (invalid state).
     * Passed along to the IRendererAction implementation.
  
     */
    @Input('invalid-class') invalidCssClass: string = 'error-invalid';

    /**
     * CSS class applied when validation succeeds (valid state).
     * Passed along to the IRendererAction implementation.
     */
    @Input('valid-class') validCssClass: string = 'error-valid';

    /**
     * Supplies valid and invalid CSS classes to the render.
     * 
     * @returns An object containing the valid and invalid CSS classes.
     */
    protected getRenderOptions(): IRendererActionOptions {
        return {
            enabledCssClass: this.invalidCssClass,
            disabledCssClass: this.validCssClass
        };
    }
}

/**
 * Directive `showWhenCorrected` manages the appearance of an element based on whether the input
 * has been corrected (it was invalid and now it is valid). 
 * It shows the element when the input is corrected and hides otherwise.
 * 
 * 'showWhenCorrected' takes the value of the ValueHostName registered with Jivs ValidationManager.
 * 
 * It either must be assigned the `ValueHostName` or be contained within a `ValueHostNameDirective`.
 * ```ts
 * <tag [showWhenCorrected]="valueHostName"></tag>
 * ```
 * ```ts
 * <tag [valueHostName]="valueHostName">
 *   <tag [showWhenCorrected]>
 * </tag>
 * ```
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IRendererAction from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * The default is ShowWhenCorrectedRenderer which shows the element when the input is corrected
 * and hides otherwise.
 */
@Directive({
    selector: '[showWhenCorrected]'
})
export class ShowWhenCorrectedDirective extends RenderingDirectiveBase {
    protected get directiveNameInFactory(): string {
        return DIRECTIVE_SHOW_WHEN_CORRECTED;
    }

    /**
     * The internal property that will be used in the directive to manage
     * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
     * which form field is being represented for validation.
     * 
     * This allows the directive to either take a value directly via input or 
     * inherit it from a parent `ValueHostNameDirective`.
     */
    @Input('showWhenCorrected') valueHostName: string | undefined;
}

/**
 * Directive `showWhenRequired` manages the appearance of an element based on whether the input
 * has a required validator (InputValueHost.requiresInput) 
 * It shows the element when the input is required and hides otherwise.
 * 
 * 'showWhenRequired' takes the value of the ValueHostName registered with Jivs ValidationManager.
 * 
 * It either must be assigned the `ValueHostName` or be contained within a `ValueHostNameDirective`.
 * ```ts
 * <tag [showWhenRequired]="valueHostName"></tag>
 * ```
 * ```ts
 * <tag [valueHostName]="valueHostName">
 *   <tag [showWhenRequired]>
 * </tag>
 * ```
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IRendererAction from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * The default is showWhenRequiredRenderer which shows the element when the input is corrected
 * and hides otherwise.
 */
@Directive({
    selector: '[showWhenRequired]'
})
export class ShowWhenRequiredDirective extends RenderingDirectiveBase {
    protected get directiveNameInFactory(): string {
        return DIRECTIVE_SHOW_WHEN_REQUIRED;
    }

    /**
     * The internal property that will be used in the directive to manage
     * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
     * which form field is being represented for validation.
     * 
     * This allows the directive to either take a value directly via input or 
     * inherit it from a parent `ValueHostNameDirective`.
     */
    @Input('showWhenRequired') valueHostName: string | undefined;
}

/**
 * Directive `showWhenIssuesFound` manages the appearance of an element based on whether the input
 * has at least one IssueFound in the validation state.
 * It shows the element when the input is required and hides otherwise.
 * 
 * 'showWhenIssuesFound' takes the value of the ValueHostName registered with Jivs ValidationManager.
 * 
 * It either must be assigned the `ValueHostName` or be contained within a `ValueHostNameDirective`.
 * ```ts
 * <tag [showWhenIssuesFound]="valueHostName"></tag>
 * ```
 * ```ts
 * <tag [valueHostName]="valueHostName">
 *   <tag [showWhenIssuesFound]>
 * </tag>
 * ```
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IRendererAction from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * The default is showWhenIssuesFoundRenderer which shows the element when the input is corrected
 * and hides otherwise.
 */
@Directive({
    selector: '[showWhenIssuesFound]'
})
export class ShowWhenIssuesFounddDirective extends RenderingDirectiveBase {
    protected get directiveNameInFactory(): string {
        return DIRECTIVE_SHOW_WHEN_ISSUES_FOUND;
    }

    /**
     * The internal property that will be used in the directive to manage
     * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
     * which form field is being represented for validation.
     * 
     * This allows the directive to either take a value directly via input or 
     * inherit it from a parent `ValueHostNameDirective`.
     */
    @Input('showWhenIssuesFound') valueHostName: string | undefined;
}

/**
 * Directive `containsInvalid` manages the appearance of a containing tag, like <div>,
 * that contains inputs. It applies a CSS class to the container based on whether any child elements are invalid.
 * 
 * ### [invalid-class]
 * CSS class applied when any child element is invalid. If an empty string is provided, no class will be applied.
 * Default is 'invalidChildren'.
 * 
 * ### [valid-class]
 * CSS class applied when all child elements are valid. If an empty string is provided, no class will be applied.
 * Default is ''.
 * 
 * Example usage:
 * ```html
 * <div containsInvalid [invalid-class]="container-invalid" [valid-class]="container-valid">
 *   <input validate="username" />
 * </div>
 * ```
 */
@Directive({
    selector: '[containsInvalid]'
})
export class ContainsInvalidChildrenDirective {
    /**
     * CSS class applied when any child element is invalid.
     * An empty string means no class will be applied.
     * Defaults to 'invalidChildren'.
     */
    @Input('invalid-class') invalidCssClass: string = 'invalidChildren';

    /**
     * CSS class applied when all child elements are valid.
     * An empty string means no class will be applied.
     */
    @Input('valid-class') validCssClass: string = '';

    private subscription: Subscription | null = null;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private fivaseForm: IFivaseForm
    ) { }

    public ngOnInit(): void {
        this.subscription = this.fivaseForm.subscribeToValidationState(() => {
            this.checkChildValidation();
        });
    }

    public ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }

    /**
     * Checks child elements of the container to see if any are invalid.
     * Ingnores those that are hidden.
     */
    private checkChildValidation(): void {
        let elements = (this.el.nativeElement as HTMLElement).querySelectorAll('[data-invalid="true"]:not([hidden])');
        // remove hidden elements that were not using 'hidden' attribute.
        const invalidElements = Array.from(elements)
            .filter((el: Element) => (el as HTMLElement).offsetParent !== null);

        if (invalidElements.length > 0) {
            changeCssClasses(this.validCssClass, this.invalidCssClass, this.el.nativeElement, this.renderer);
        } else {
            changeCssClasses(this.invalidCssClass, this.validCssClass, this.el.nativeElement, this.renderer);
        }
    }
}

/**
 * The `ValueHostNameDirective` is used to define a `valueHostName` that can be inherited by 
 * child directives within a component hierarchy. This simplifies the management of validation 
 * across multiple form fields by allowing child directives to automatically reference the 
 * same `valueHostName`.
 * 
 * The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
 * which form field is being represented for validation.
 * 
 * When applied, this directive makes the `valueHostName` available to child directives 
 * via Angular's dependency injection system. Child directives, such as `[validate]`, 
 * can either use the provided `valueHostName` or supply their own if needed.
 * 
 * Example usage:
 * ```html
 * <div [valueHostName]="'FirstName'">
 *   <input validate></input>
 *   <div validationErrors></div>
 * </div>
 * ```
 * 
 * In this example, the `valueHostName` of `FirstName` is inherited by the child directives 
 * `[validate]` and `[validationErrors]`, allowing them to use the same validation target.
 */
@Directive({
    selector: '[valueHostName]'
})
export class ValueHostNameDirective {
    /**
     * The valueHostName will be provided to child directives through Angular's DI system.
     * Any directive that depends on valueHostName (e.g., ChildDirective) can inject it 
     * automatically, as this directive is registered in the element's injector.
     */
    @Input('valueHostName') valueHostName!: string;

    constructor() {
        // Optional: Initialization logic, if needed
    }
}


/**
 * Interface for managing the lifecycle and behavior of a `ValidationManager` in Angular.
 * Provides methods for validating forms, setting values, and managing subscriptions to validation state changes.
 *
 * Provides an abstraction over `ValidationManager`, making it easier to manage form validation in Angular applications. 
 * Ensures that the core validation logic can be integrated seamlessly into Angular’s dependency injection and lifecycle.
 *
 * Used by directives and components to trigger validation, retrieve validation state, and manage input values.
 */
export interface IFivaseForm {
    readonly validationManager: IValidationManager;
    readonly services: IFivaseServices;
    validate(options?: any): ValidationState;
    setValue(valueHostName: string, value: any, options?: SetValueOptions): void;
    setInputValue(valueHostName: string, inputValue: string, options?: SetInputValueOptions): void;

    subscribeToValidationState(callback: (state: ValidationState) => void): Subscription;
    unsubscribeFromValidationState(subscription: Subscription): void;

    subscribeToValueHostValidationState(valueHostName: string, callback: (state: ValueHostValidationState) => void): Subscription;
    unsubscribeFromValueHostValidationState(subscription: Subscription): void;

    subscribeToValueHostMessaging(valueHostName: string, callback: (command: string, payload?: any) => void): Subscription;
    unsubscribeFromValueHostMessaging(subscription: Subscription): void;
    sendMessage(valueHostName: string, command: string, payload?: any): void;

    destroy(): void;

}


/**
 * The Fivase validation manager service.
 * Manages validation logic in Angular using the underlying ValidationManager from Jivs.
 * Handles state changes, value updates, validation subscriptions, and destruction of the manager.
 *
 * Integrates the core Jivs ValidationManager into Angular, allowing form validation and state management in Angular components.
 *
 * Used by directives to trigger validation, manage input values, and handle state subscriptions for forms.
 */
export class FivaseForm implements IFivaseForm {

    constructor(config: ValidationManagerConfig, services: IFivaseServices) {
        this._services = services;
        this._validationManager = new ValidationManager(config);

        config.onValidationStateChanged = (validationManager: IValidationManager, validationState: ValidationState) => {
            this._validationStateSubject.next(validationState);
        };
        config.onValueHostValidationStateChanged = (valueHost: IValueHost, validationState: ValueHostValidationState) => {
            this._valueHostValidationStateSubject.next({ valueHostName: valueHost.getName(), validationState });
        };
    }

    /**
     * Access to the FivaseServices instance
     */
    public get services(): IFivaseServices
    {
        return this._services;
    }
    private _services: IFivaseServices;


    /**
     * Central object in Fivase that represents all of the ValueHosts.
     * Some of its most prominent members have been exposed on FivaseForm,
     * but use this to access the rest.
     */
    public get validationManager(): IValidationManager {
        return this._validationManager;
    }
    private _validationManager: IValidationManager;

    /**
     * Execute validation across all ValueHosts. Same as calling `validationManager.validate(options)`.
     * See Fivase documentation for details.
     * @param options 
     * @returns 
     */
    public validate(options?: any): ValidationState {
        return this.validationManager.validate(options);
    }

    /**
     * Call when a value supported within the ValueHosts has changed. 
     * Consider using setInputValue instead for InputValueHosts.
     * Same as calling `validationManager.setValue(valueHostName, value, options)`.
     * See Fivase documentation for details.
     * @param valueHostName 
     * @param value 
     * @param options 
     */
    public setValue(valueHostName: string, value: any, options?: SetValueOptions): void {
        this.validationManager.vh.input(valueHostName).setValue(value, options);
    }
/**
 * Call when an input value has changed.  Same as calling `validationManager.vh.input(vaueHostName).setInputValue(inputValue,options)`.
 * See Fivase documentation for details.
 * @param valueHostName 
 * @param inputValue 
 * @param options 
 */
    public setInputValue(valueHostName: string, inputValue: string, options?: SetInputValueOptions): void {
        this.validationManager.vh.input(valueHostName).setInputValue(inputValue, options);
    }

    /**
     * Subscribes to the validation state changes. Some jivs-angular Directives subscribe to it automatically.
     *
     * @param callback - A function to be called whenever the validation state changes.
     * @returns A Subscription object that can be used to unsubscribe from the validation state updates.
     */
    public subscribeToValidationState(callback: (state: ValidationState) => void): Subscription {
        return this._validationStateSubject.subscribe(callback);
    }
    /**
     * ValidationManager level validation state changes
     */
    private _validationStateSubject = new BehaviorSubject<ValidationState>({
        isValid: true,
        doNotSave: false,
        issuesFound: null,
        asyncProcessing: false
    });

    /**
     * Unsubscribes from the validation state by calling the unsubscribe method on the provided subscription.
     *
     * @param subscription - The subscription to unsubscribe from.
     */
    public unsubscribeFromValidationState(subscription: Subscription): void {
        subscription.unsubscribe();
    }

    /**
     * Subscribes to the validation state of a specified value host. Some jivs-angular Directives subscribe to it automatically.
     *
     * @param valueHostName - The name of the value host to subscribe to.
     * @param callback - A callback function that will be invoked with the validation state of the value host.
     * @returns A Subscription object that can be used to unsubscribe from the validation state updates.
     */
    public subscribeToValueHostValidationState(valueHostName: string, callback: (state: ValueHostValidationState) => void): Subscription {
        return this._valueHostValidationStateSubject
            .pipe(filter(forCallback => forCallback.valueHostName === valueHostName))
            .subscribe(event => callback(event.validationState));
    }

    /**
     * Individual ValueHost level validation state changes
     */
    private _valueHostValidationStateSubject = new BehaviorSubject<{ valueHostName: string, validationState: ValueHostValidationState }>({
        valueHostName: '',
        validationState: {
            isValid: true,
            status: ValidationStatus.NotAttempted,
            doNotSave: false,
            issuesFound: null,
            corrected: false,
            asyncProcessing: false
        }
    });

    /**
     * Unsubscribes from the validation state by calling the unsubscribe method on the provided subscription.
     *
     * @param subscription - The subscription to unsubscribe from.
     */
    public unsubscribeFromValueHostValidationState(subscription: Subscription): void {
        subscription.unsubscribe();
    }

    /**
     * General communication between validation UI elements through the FivaseForm.
     * Designed for these use cases, but can be used for other purposes:
     * - ValidationSummary contains error messages from all ValueHosts. A click on an error message should set focus to the input.
     *   However, ValidationSummary shouldn't care about the implemention. It sends a message and the input registers with 
     *   subscribeToValueHostMessaging to receive the message and set focus.
     * - ValidationInputDirective tells ValidationErrorsDirective that it has gained or lost focus,
     *   allowing the ValidationErrorsDirective to show or hide the error messages in popup or notification view scenarios.
     * - To work, each case must have a command string and an optional payload. Here are some examples:
     *   - 'setFocus' - Set focus to the input. ValidationInputDirective should be listening to act when ValidationSummary sends this message.
     *   - 'gainedFocus' - The input has gained focus. ValidationErrorDirective should be listening if it uses a popup or notification view.
     *   - 'lostFocus' - The input has lost focus. ValidationErrorDirective should be listening if it uses a popup or notification view.
     * @param valueHostName 
     * @param callback 
     */
    public subscribeToValueHostMessaging(valueHostName: string, callback: (command: string, payload?: any) => void): Subscription
    {
        return this._valueHostMessagingSubject
            .pipe(filter(forCallback => forCallback.valueHostName === valueHostName))
            .subscribe(event => callback(event.command, event.payload));
    }
    /**
     * Unsubscribes from the value host messaging by calling the unsubscribe method on the provided subscription.
     * @param subscription 
     */
    public unsubscribeFromValueHostMessaging(subscription: Subscription): void
    {
        subscription.unsubscribe();
    }
    /**
     * UI element sends a command to other UI elements through the FivaseForm.
     * @param valueHostName - The name of the value host to send the message to.
     * @param command - The command to send.
     * @param payload - Optional data to send with the command.
     */
    public sendMessage(valueHostName: string, command: string, payload?: any): void
    {
        this._valueHostMessagingSubject.next({ valueHostName, command, payload });
    }

    /**
     * ValueHost level messaging
     */
    private _valueHostMessagingSubject = new BehaviorSubject<{ valueHostName: string, command: string, payload?: any }>({
        valueHostName: '',
        command: '',
        payload: null
    });

    public destroy(): void {
        this._validationManager?.dispose();
        (this._validationManager as any) = undefined;
        (this._services as any) = undefined;
        this._validationStateSubject.complete();
        this._valueHostValidationStateSubject.complete();
        this._valueHostMessagingSubject.complete();
    }
}

/**
 * Interface for a service responsible for managing ValidationManagerConfigs and states of the ValidationManager + ValueHost objects.
 */
export interface IFivaseConfigHost {
    getConfig(formId: string): ValidationManagerConfig;

    // Register a configuration for a formId
    register(formId: string, config: ValidationManagerConfig | ((formId: string) => ValidationManagerConfig)): void;
}

/**
 * In Jivs, each Form must have a configuration found in ValidationManagerConfig to setup a ValidationManager.
 * This configuration includes the ValueHosts, Validators, and other settings for the form.
 * FivaseConfigHost is an Angular service where the configurations are stored during setup and retrieved
 * when a form is being created.
 * 
 * ValidationManager and its ValueHosts have a state that should be saved and restored across sessions.
 * This service uses an implementation of IFivaseStateStore to persist form states across sessions.
 * Each form has 2 states: instanceState and valueHostInstanceStates. They are stored with these keys:
 * - instanceState: formId
 * - valueHostInstanceStates: formId + '|ValueHosts' (all ValueHosts are in the same key)
 * 
 * As a result, every form must have a unique formId, used to register the configuration and save the state.
 * 
 * Use register() to store the configuration for a formId and getConfig() to retrieve the configuration.
 * getConfig() will supply several parts to the ValidationManagerConfig:
 * - The ValueHostConfigs array, which is the ValueHost configuration for the form.
 * - The savedInstanceState, which is the state of the ValidationManager in the session.
 * - The savedValueHostInstanceStates, which is the state of each ValueHost in the session.
 * - The onInstanceStateChanged and onValueHostInstanceStateChanged callbacks, which are used to save the state.
 *   You can also use these callbacks to handle the state changes in the application, as yours will be called
 *   after this class saves the state.
 */
export class FivaseConfigHost implements IFivaseConfigHost {
    private configs: Map<string, ValidationManagerConfig | ((formId: string) => ValidationManagerConfig)> = new Map();

    constructor(private stateStore: IFivaseStateStore) { }

    
    /**
     * Retrieves the configuration for a given form ID, including any saved state and callbacks.
     * 
     * @param formId - The unique identifier for the form.
     * @returns The configuration object for the specified form ID.
     * @throws Will throw an error if no configuration is found for the given form ID.
     * 
     * The returned configuration will have these assigned, but will still call your original
     * callback if it was supplied:
     * `savedInstanceState`, 
     * `savedValueHostInstanceStates`, 
     * `onInstanceStateChanged`, 
     * `onValueHostInstanceStateChanged`
     */
    public getConfig(formId: string): ValidationManagerConfig {
        const configOrFactory = this.configs.get(formId);

        if (!configOrFactory) {
            throw new Error(`No configuration found for formId: ${formId}`);
        }

        // Get the config either directly or by calling the factory function
        const config = typeof configOrFactory === 'function'
            ? (configOrFactory as (formId: string) => ValidationManagerConfig)(formId)
            : configOrFactory;
        let valueHostKey = `${formId}|ValueHosts`;

        // Retrieve any saved state for this formId
        const savedInstanceState = this.stateStore.getState(formId);
        const savedValueHostInstanceStates = this.stateStore.getState(valueHostKey);

        // Assign the callbacks, preserving any that were already present in the config
        return {
            ...config,  // do not modify the original config
            savedInstanceState: savedInstanceState ?? config.savedInstanceState ?? null,
            savedValueHostInstanceStates: savedValueHostInstanceStates ?? config.savedValueHostInstanceStates ?? null,
            onInstanceStateChanged: (valueHostsManager, state) => {
                this.saveState(formId, state);
                if (config.onInstanceStateChanged) {  // Call the original callback if it exists
                    config.onInstanceStateChanged(valueHostsManager, state);
                }
            },
            onValueHostInstanceStateChanged: (valueHost, state) => {
                this.saveState(valueHostKey, state);
                if (config.onValueHostInstanceStateChanged) {  // Call the original callback if it exists
                    config.onValueHostInstanceStateChanged(valueHost, state);
                }
            }
        };
    }

    /**
     * Register a configuration for a formId
     * ```ts
     * configHost.register('userFormId', (formId: string) => {
     *   let builder = build(createValidationServices());
     *   
     *   // Define validation for the username field
     *   builder.input('username', LookupKey.String)
     *     .requireText() // Requires the field to be non-empty
     *     .regExp(/^[\w\.\-]*$/, null, { errorMessage: 'Invalid format for username' });
     *   
     *   // Define validation for the email field
     *   builder.input('email', 'EmailAddress')
     *     .requireText(); // Requires non-empty text for email
     *   
     *   // Complete the configuration and return it
     *   return builder.complete();
     * });
     * ```
     * @param formId 
     * @param config - Supply either an instance or a function. When it is a function,
     * it creates the config. The function provides a lazy loading pattern.
     */
    public register(formId: string, config: ValidationManagerConfig | ((formId: string) => ValidationManagerConfig)): void {
        this.configs.set(formId, config);
    }

    /**
     * Save the state of the form validation (used for persisting state)
     */
    protected saveState(formId: string, state: any): void {
        this.stateStore.saveState(formId, state);
    }
}

/**
 * Interface representing the services provided by Fivase.
 * - Use configHost to register configurations for forms and create FivaseForm objects
 *   that consume them.
 * - Use each Factory to provide customizations for each Directive supplied.
 */
export interface IFivaseServices {

    /**
     * Creates a FivaseForm with the configuration specific to formId.
     * Throws error if the formId is not registered.
     * @param formId 
     * @returns The instance created.
     */
    createFivaseForm(formId: string): IFivaseForm;

    /**
     * The FivaseConfigHost service, which manages the configurations for forms and their states.
     * Use this service to register configurations for forms and retrieve them when needed.
     * For example, when creating a new form, register the configuration for that form like this:
     * ```ts
     * fivaseServices.configHost.register('myFormId', (formId: string) => {
     * let builder = build(createValidationServices());
     * ... use the Jivs Builder to create the configuration ...
     *    return builder.complete();
     * });
     * ```
     * Retrieve the configuration for that form using the getConfig method.
     * ```ts
     * const config = fivaseServices.configHost.getConfig('myFormId');
     * ```
     */
    configHost: IFivaseConfigHost;

    /**
     * Adds or replaces a factory for creating instances of Directive Actions.
     * @param factory 
     */
    registerFactory(factory: IActionFactory): void;
    
    /**
     * Retrieves the factory for creating instances of Directive Actions.
     * Throws an error if the factory is not found.
     * @param directiveName 
     * @param actionName 
     */
    getFactory(directiveName: string, actionName: string): IActionFactory;
}

/**
 * Services provided by Fivase. This must be registered as a provider in an NgModule,
 * and configured there too.
 * ```ts
 * @NgModule({
 *   declarations: [AppComponent, MyFormComponent],
 *   imports: [BrowserModule],
 *   providers: [
 *     {
 *       provide: FivaseServices,
 *       useFactory: ()=> new FivaseServices(new InMemoryFivaseStateStore())
 *     }
 *   ],
 *   bootstrap: [AppComponent]
 * })
 * export class AppModule {
 * 	constructor(private fivaseServices: FivaseServices)
 * 	{
 * 		// populate fivaseServices.configHost
 *      // populate various Factories in fivaseServices
 * 	}
 * }
 * ```
 * - Use configHost to register configurations for forms and create FivaseForm objects
 *   that consume them.
 * - Use each Factory to provide customizations for each Directive supplied.
 * - Supply an implementation of IFivaseStateStore into the constructor to retain stateful
 *   information between form rebuilds.
 */
export class FivaseServices implements IFivaseServices {
    constructor(stateStore: IFivaseStateStore) { 
        this._configHost = new FivaseConfigHost(stateStore);
    }
    /**
     * Creates a FivaseForm with the configuration specific to formId.
     * Throws error if the formId is not registered.
     * @param formId 
     * @returns The instance created.
     */
    public createFivaseForm(formId: string): IFivaseForm
    {
        let config = this.configHost.getConfig(formId);
        return new FivaseForm(config, this);
    }
    /**
     * The FivaseConfigHost service, which manages the configurations for forms and their states.
     * Use this service to register configurations for forms and retrieve them when needed.
     * For example, when creating a new form, register the configuration for that form like this:
     * ```ts
     * fivaseServices.configHost.register('myFormId', (formId: string) => {
     * let builder = build(createValidationServices());
     * ... use the Jivs Builder to create the configuration ...
     *    return builder.complete();
     * });
     * ```
     * Retrieve the configuration for that form using the getConfig method.
     * ```ts
     * const config = fivaseServices.configHost.getConfig('myFormId');
     * ```
     */
    public get configHost(): IFivaseConfigHost
    {
        return this._configHost;
    }
    private _configHost: FivaseConfigHost;

    /**
     * Adds or replaces a factory for creating instances of Directive Actions for a directive.
     * The key is DirectiveName|DirectiveActionName.
     */
    protected factories: Map<string, IActionFactory> = new Map();

    protected resolveKey(directiveName: string, actionName: string): string {
        return `${directiveName}|${actionName}`;
    }   
    /**
     * Adds or replaces a factory for creating instances of Directive Actions for a directive.
     * @param factory 
     */
    public registerFactory(factory: IActionFactory): void
    {
        let key = this.resolveKey(factory.directiveName, factory.actionName);
        this.factories.set(key, factory);
    }
    
    /**
     * Retrieves the factory for creating instances of Directive Actions for a directive.
     * Throws an error if the factory is not found.
     * @param directiveName 
     * @param actionName 
     */
    public getFactory(directiveName: string, actionName: string): IActionFactory { 
        let key = this.resolveKey(directiveName, actionName);
        let factory = this.factories.get(key);
        if (!factory) {
            throw new Error(`Factory not found for ${directiveName}:${actionName}`);
        }
        return factory;
    }

    protected preRegisterFactories(): void {
        this.registerFactory(new ValueChangeListenerActionFactory(DIRECTIVE_VALIDATE_INPUT, 
            new HtmlTagValueChangeListener()));
        this.registerFactory(new RendererActionFactory(DIRECTIVE_VALIDATE_INPUT,
            new IssuesFoundRenderer()));
        this.registerFactory(new RendererActionFactory(DIRECTIVE_VALIDATION_ERRORS,
            new ErrorMessagesRenderer()));
        this.registerFactory(new RendererActionFactory(DIRECTIVE_SHOW_WHEN_CORRECTED,
            new ShowWhenCorrectedRenderer()));
        this.registerFactory(new RendererActionFactory(DIRECTIVE_SHOW_WHEN_REQUIRED,
            new ShowWhenRequiredRenderer()));
        this.registerFactory(new RendererActionFactory(DIRECTIVE_SHOW_WHEN_ISSUES_FOUND,
            new ShowWhenIssuesFoundRenderer()));
    }
}

/**
 * Interface responsible for storing and retrieving any state from Fivase, 
 * allowing validation progress to be saved across sessions or page reloads.
 * Required by FivaseConfigHost to save and retrieve the state of the ValidationManager and ValueHosts.
 *
 * Provides an abstraction for state management, allowing different implementations (e.g., local storage, Redux, or other state management libraries) 
 * to be used without altering the core validation logic. This flexibility ensures the validation system can work with various state management approaches.
 *
 * Implemented by services like `InMemoryFivaseStateStore` to save and retrieve validation states for forms.
 */
export interface IFivaseStateStore {
    getState(key: string): any;
    saveState(key: string, state: any): void;
}

/**
 * A simple implementation of `IFivaseStateStore` using an in-memory map to store state.
 */
export class InMemoryFivaseStateStore implements IFivaseStateStore {
    private stateMap: Map<string, any> = new Map();

    getState(key: string): any {
        return this.stateMap.get(key);
    }

    saveState(key: string, state: any): void {
        this.stateMap.set(key, state);
    }
}
