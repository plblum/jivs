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
 * Each Directive class that uses IDirectiveRenderer has its own Factory, based on
 * DirectiveActionFactoryBase which is a property of the FivaseServicesHost class.
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
export interface IDirectiveRenderer {
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
     * @param fivaseValidationManager - The validation manager responsible for managing the validation
     * logic, errors, and state.
     * @param options - Determined by the Directive to deliver any attribute values it gets from the user.
     */
    renderForFivaseDirective(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions
    ): void;
}

export interface IDirectiveRendererOptions {
    enabledCssClass?: string | null;
    disabledCssClass?: string | null
}

/**
 * Interface for setting up event handlers needed by a Fivase Directive
 * to handle changes in the value of the inputs, and supply it to FivaseValidationManager.
 * 
 * Each Directive class that uses IDirectiveEventHandler has its own Factory, based on
 * DirectiveActionFactoryBase which is a property of the FivaseServicesHost class.
 * That factory provides a default instance, which can be overridden by the [fivase-eventHandler] attribute
 * on the same element or component as the directive. Components can also provide a specific
 * implementation that handles their unique Render requirements. They can either implement standalone
 * classes or implement the interfaces directly on the component class. Within the component,
 * they notify the factory to use their implementation by calling the available method.
 * The factory's resolve function will look for that instance, before falling back to the default instance.
 * 
 * Classes implementing this interface should not expect any Angular Dependency Injection 
 * into their constructor.  They are created explicitly when registering with the factory.
 */
export interface IDirectiveEventHandler {
    /**
     * Sets up validation-related event handlers on the target element.
     * 
     * @param element - The target DOM element. It could be an input field, a
     * container, etc.
     * @param renderer - The Angular Renderer2 service used to attach event listeners to the DOM.
     * @param valueHostName - The name of the value host associated with this element, used to identify
     * the data being validated.
     * @param fivaseValidationManager - The validation manager responsible for handling validation,
     * which will be invoked when events occur.
     */
    setupEventHandlers(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseValidationManager: FivaseValidationManager
    ): void;

    /**
     * Remove any event handlers that were attached to the element.
     * @param element 
     */
    cleanupEventHandlers?(element: HTMLElement, renderer: Renderer2): void;
}

/**
 * Concrete implementation of `IDirectiveEventHandler` that targets all HTML tags supporting
 * validation-related events, including 'input', 'textarea', 'select', 'checkbox', and 'file' types. 
 * This class listens for 'input', 'change' events and triggers validation logic accordingly.
 * 
 * The event listeners are attached to the DOM element supplied. The class also includes the ability to enable
 * or disable 'input' event listeners through a protected getter, making it accessible for subclasses.
 */
export class StandardHtmlTagEventDirectiveAction implements IDirectiveEventHandler {

    /**
     * Creates an instance of `StandardHtmlTagEventDirectiveAction`.
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
     * @param fivaseValidationManager - The validation manager responsible for handling validation logic and errors.
     * @param valueHostName - The name of the value host associated with this element, used to identify the validation target.
     */
    public setupEventHandlers(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseValidationManager: FivaseValidationManager
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
                fivaseValidationManager.setValue(valueHostName, isChecked, { validate: true });
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
                fivaseValidationManager.setValue(valueHostName, fileData, { validate: true });
            });
        }

        function setupSelectHandler(): void {
            // Handle select element validation (only listen for 'change' event)
            renderer.listen(element, 'change', (event: Event) => {
                const selectValue = (event.target as HTMLSelectElement).value;
                fivaseValidationManager.setInputValue(valueHostName, selectValue, { validate: true });
            });
        }

        function setupInputEventHandler(): void {
            if (self.inputEventEnabled) {
                //   renderer.listen(element, 'input', (event: Event) => {
                //     const inputValue = (event.target as HTMLInputElement).value;
                //     fivaseValidationManager.setInputValue(valueHostName,  inputValue, { validate: true, duringEdis: true });
                //   });
                fromEvent(element, 'input')
                    .pipe(debounceTime(self.inputEventDebounceTime))  // Wait before handling the event
                    .subscribe((event: Event) => {
                        const inputValue = (event.target as HTMLInputElement).value;
                        fivaseValidationManager.setInputValue(valueHostName, inputValue, { validate: true, duringEdit: true });
                    });
            }
        }

        function setupChangeEventHandler(): void {
            // Handle change event
            renderer.listen(element, 'change', (event: Event) => {
                const inputValue = (event.target as HTMLInputElement).value;
                fivaseValidationManager.setInputValue(valueHostName, inputValue, { validate: true });
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
 * DirectiveRendererBase provides a foundation for rendering.
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
export abstract class DirectiveRendererBase implements IDirectiveRenderer {
    /**
     * Creates an instance of `DirectiveRendererBase`.
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
     * @param fivaseValidationManager - The validation manager responsible for managing the validation
     * logic, errors, and state.
     * @param options - Determined by the Directive to deliver any attribute values it gets from the user.
     */
    public renderForFivaseDirective(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions
    ): void {
        let twoStates = this.resolveTwoStates(valueHostName, validationState, fivaseValidationManager, options);
        if (twoStates !== null) {
            this.twoStateRender(twoStates, element, renderer, valueHostName, validationState, fivaseValidationManager, options);
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
     * @param fivaseValidationManager 
     * @param options 
     */
    protected twoStateRender(
        enabledState: boolean,
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions
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
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions): boolean | null;

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
 * Concrete implementation of `IDirectiveRenderer` that applies a CSS class to the target element
 * depending on ValidationState.IssuesFound. It uses enabledCssClass when there are issues found and disabledCssClass
 * when there are no issues found.
 * The default classes are enabledCssClass = 'invalid' and disabledCssClass = 'valid'.
 * 
 * This class does not show the error messages within IssuesFound. 
 * For that, use ErrorMessagesDirectiveRender.
 * This class does not change the visibility of the element, unless
 * the CSS classes have styles for that. Consider ShowWhenIssuesFoundDirectiveRenderer instead.
 */
export class IssuesFoundDirectiveRenderer extends DirectiveRendererBase {

    constructor(
        enabledCssClass: string | null = 'invalid',
        disabledCssClass: string | null = 'valid') {
        super(enabledCssClass, disabledCssClass, false);
    }
    
    protected resolveTwoStates(valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions): boolean | null {
        return validationState.issuesFound && validationState.issuesFound.length > 0;
    }
}

/**
 * Concrete implementation of `IDirectiveRenderer` that hides or shows the element based on the presence of issues.
 * It does not change any CSS classes.
 * It is the default UI for ShowWhenIssuesFoundDirective.
 */
export class ShowWhenIssuesFoundDirectiveRenderer extends DirectiveRendererBase {
    constructor(
        enabledCssClass: string | null = null,
        disabledCssClass: string | null = null) {
        super(enabledCssClass, disabledCssClass, true);
    }

    protected resolveTwoStates(valueHostName: string, validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions): boolean | null {
        return validationState.issuesFound && validationState.issuesFound.length > 0;
    }
}

/**
 * Concrete implementation of `IDirectiveRenderer` that shows or hides the element based on 
 * the ValidationState.corrected property. By default, it has no CSS classes assigned to enabledCssClass
 * or disabledCssClass because its focus is visibility.
 */
export class ShowWhenCorrectedDirectiveRenderer extends DirectiveRendererBase {
    constructor(
        enabledCssClass: string | null = null,
        disabledCssClass: string | null = null) {
        super(enabledCssClass, disabledCssClass, true);
    }
    protected resolveTwoStates(valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions): boolean | null {
        return validationState.corrected;
    }
}

/**
 * Concrete implementation of `IDirectiveRenderer` that shows or hides the element based on
 * the ValueHost.requiresInput property. By default, it has no CSS classes assigned to enabledCssClass
 * or disabledCssClass because its focus is visibility.
 */
export class ShowWhenRequiredDirectiveRenderer extends DirectiveRendererBase {
    
    constructor(
        enabledCssClass: string | null = null,
        disabledCssClass: string | null = null) {
        super(enabledCssClass, disabledCssClass, true);
    }
    protected resolveTwoStates(valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions): boolean | null {
        let vh = fivaseValidationManager.validationManager.getInputValueHost(valueHostName);
        if (!vh) {
            throw new Error(`ValueHost not found for ${valueHostName}.`);
        }
        return vh.requiresInput;
    }
}

/**
 * This implementation of `IDirectiveRenderer` generates a list of error messages from
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
 */
export class ErrorMessagesDirectiveRender extends DirectiveRendererBase {
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

    public renderForFivaseDirective(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions
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
        super.renderForFivaseDirective(element, renderer, valueHostName, validationState, fivaseValidationManager, options);
    }

    /**
     * Enables when validationState.issuesFound is not empty.
     * @param valueHostName 
     * @param validationState 
     * @param fivaseValidationManager 
     * @param options 
     * @returns true if issuesFound is not empty.
     */
    protected resolveTwoStates(
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: IDirectiveRendererOptions): boolean | null {
        return validationState.issuesFound && validationState.issuesFound.length > 0;
    }
}

/**
 * Abstract factory class that manages the `IDirectiveEventHandler` and
 * `IDirectiveRenderer` instances needed by Fivase Directives. 
 * 
 * Each Directive may declare its own Factories and make them properties of the 
 * FivaseServicesHost class.
 * The Directive will get the FivaseServicesHost through DI in the constructor,
 * and will use the factory's resolve method to get the appropriate instance.
 * There are several sources for the instance: 
 * - A default instance, which is normally used. It is created by the factory and
 *   in the defaultFallback property. The user can override it during factory setup.
 * - Instances registered to a unique name. That name will be supplied by attributes
 *   found on the same element or component as the directive: [fivase-Render] and
 *   [fivase-eventHandler]. So the user can supply the unique name through the attribute
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
export abstract class DirectiveActionFactoryBase<T> {
    constructor (defaultFallback: T) {
        this._defaultFallback = defaultFallback;
    }

    /**
     * Contains instances that were registered by name.
     * Names are case insensitive and stored here in lowercase.
     */
    private registryByName: Map<string, T> = new Map();

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

    /**
     * Registers an instance of a directive action associated with a unique 
     * name. These values are only used when the resolve function is supplied
     * the name parameter. The name parameter value is expected to come from the Directive's
     * [fivase-Render] or [fivase-eventHandler] attribute, and is null or undefined
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
    protected abstract get customPropertyName(): string;

    /**
     * Validates the given instance to ensure it matches the required type.
     * 
     * @param instance - The instance to validate.
     * @returns A boolean indicating whether the instance is valid.
     */
    protected abstract isValidInstance(instance: T): boolean;
}

/**
 * Abstract class that provides a base implementation for the `IDirectiveEventHandler` interface.
 */
export abstract class DirectiveRendererFactoryBase extends DirectiveActionFactoryBase<IDirectiveRenderer> {
    protected isValidInstance(instance: IDirectiveRenderer): boolean {
        return instance && typeof instance.renderForFivaseDirective === 'function';
    }
}

/**
 * Implementation that is used by ValidationInputDirective for rendering.
 */
export class ValidationInputDirectiveRendererFactory extends DirectiveRendererFactoryBase {
    constructor(directiveRenderer?: IDirectiveRenderer) {
        super(directiveRenderer ?? new IssuesFoundDirectiveRenderer());
    }   
    protected get customPropertyName(): string {
        return 'validationInputRenderer';
    }
}   

/**
 * Abstract class that provides a base implementation for the `IDirectiveEventHandler` interface.
 */
export abstract class DirectiveEventHandlerFactoryBase extends DirectiveActionFactoryBase<IDirectiveEventHandler> {
    protected isValidInstance(instance: IDirectiveEventHandler): boolean {
        return instance && typeof instance.setupEventHandlers === 'function';
    }
}

/**
 * Implementation that is used by ValidationInputDirective for handling events.
 */
export class ValidationInputDirectiveEventHandlerFactory extends DirectiveEventHandlerFactoryBase {
    constructor(directiveEventHandler?: IDirectiveEventHandler) {
        super(directiveEventHandler ?? new StandardHtmlTagEventDirectiveAction());
    }
    protected get customPropertyName(): string {
        return 'validationInputEventHandler';
    }
    protected isValidInstance(instance: IDirectiveEventHandler): boolean {
        return instance && typeof instance.setupEventHandlers === 'function';
    }
}

/**
 * Implementation that is used by ValidationErrorsDirective for rendering.
 */
export class ValidationErrorDirectiveRendererFactory extends DirectiveRendererFactoryBase {
    constructor(directiveRenderer?: IDirectiveRenderer) {
        super(directiveRenderer ?? new ErrorMessagesDirectiveRender());
    }
    protected get customPropertyName(): string {
        return 'validationErrorRenderer';
    }
}

/**
 * Implementation that is used by CorrectedDirective for rendering.
 */
export class CorrectedDirectiveRendererFactory extends DirectiveRendererFactoryBase {
    constructor(directiveRenderer?: IDirectiveRenderer) {
        super(directiveRenderer ?? new ShowWhenCorrectedDirectiveRenderer());
    }
    protected get customPropertyName(): string {
        return 'correctedRenderer';
    }
}

/**
 * Implementation that is used by RequiredDirective for rendering.
 */
export class RequiredDirectiveRendererFactory extends DirectiveRendererFactoryBase {
    constructor(directiveRenderer?: IDirectiveRenderer) {
        super(directiveRenderer ?? new ShowWhenRequiredDirectiveRenderer());
    }
    protected get customPropertyName(): string {
        return 'requiredRenderer';
    }
}

/**
 * Implementation that is used by ShowWhenIssuesFoundDirective for rendering.
 */
export class ShowWhenIssuesFoundDirectiveRendererFactory extends DirectiveRendererFactoryBase {
    constructor(directiveRenderer?: IDirectiveRenderer) {
        super(directiveRenderer ?? new ShowWhenIssuesFoundDirectiveRenderer());
    }
    protected get customPropertyName(): string {
        return 'showWhenIssuesFoundRenderer';
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
 * <tag [fivase-valueHostName]="valueHostName">
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
        protected fivaseServicesHost: FivaseServicesHost,
        protected fivaseValidationManager: FivaseValidationManager,
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
        (this.fivaseServicesHost as any) = undefined;        
        (this.fivaseValidationManager as any) = undefined;
        (this.valueHostNameDirective as any) = undefined;
    }

}

/**
 * Abstract base class for Fivase Directives that observe validation state changes
 * on a ValueHost and uses an implementation of `IDirectiveRenderer` to 
 * update the user interface based on the state.
 * 
 * Key functionality includes:
 * - Subscribing to validation state changes via the `FivaseValidationManager`.
 * - Applying a render through an object that supports `IDirectiveRenderer`, which
 *   comes from a factory property on FivasServicesHost.
 * 
 * Every implementation requires it to be assigned to a Jivs `ValueHostName` 
 * for the validation system to associate it with the appropriate form control.
 * ```ts
 * <tag [directive]="valueHostName"></tag>
 * ```
 * However, the valueHostName can be inherited from a parent ValueHostNameDirective.
 * ```ts
 * <tag [fivase-valueHostName]="valueHostName">
 *    <tag [directive]>
 * </tag>
 * ```
 * 
 * ### [fivase-target]
 * This optional input allows the directive to target a specific element within a component's template 
 * where this directive will do its work. If not provided, the directive will use the host element.
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IDirectiveRenderer from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 */
@Directive()
export abstract class RenderDirectiveBase extends FivaseDirectiveBase {

    /**
     * Select a custom implementation of `IDirectiveRenderer` from the factory
     * by supplying the name of the implementation. The name is case-insensitive.
     */
    @Input('fivase-render') renderFactoryName: string | undefined;

    private subscription: Subscription | null = null;
    protected directiveRenderer: IDirectiveRenderer | null = null;

    constructor(
        el: ElementRef,
        renderer: Renderer2,
        fivaseServicesHost: FivaseServicesHost,
        fivaseValidationManager: FivaseValidationManager,
        @Optional() @SkipSelf() valueHostNameDirective: ValueHostNameDirective
    ) {
        super(el, renderer, fivaseServicesHost, fivaseValidationManager, valueHostNameDirective);
    }

    /**
     * Establishes the PresentionDirectiveAction implementation from either the [fivase-render] input or the Factory.
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
     * Gets the factory from fivaseServicesHost used to create the IDirectiveRenderer implementation.
    */
    protected abstract get resolveRendererFactory(): DirectiveRendererFactoryBase;

    /**
     * Uses the FivaseValidationManager to subscribe to validation state changes for the ValueHost.
     * Passes the validation state to the IDirectiveRenderer implementation.
     * @param valueHostName 
     */
    private setupSubscription(valueHostName: string): void {
        this.subscription = this.fivaseValidationManager.subscribeToValueHostValidationState(valueHostName, (validationState) => {
            this.onValueHostValidationStateChanged(this.getTargetElement(), validationState);
        });
    }

    /**
     * Ensures the UI conforms with the current validation state
     */
    protected setupInitialRender(valueHostName: string): void {
        let vh = this.fivaseValidationManager.validationManager.getValidatorsValueHost(valueHostName)!;
        if (!vh)
            throw new Error(`Unknown valueHostName "${valueHostName}"`);
        this.onValueHostValidationStateChanged(this.getTargetElement(), vh.currentValidationState);
    }

    /**
     * Handles the render of a validation state change on a ValueHost.
     * 
     * This method applies validation render using the `IDirectiveRenderer`.
     * 
     * @param targetElement - The resolved HTML element to apply the render to.
     * @param validationState - The current validation state of the ValueHost.
     */
    protected onValueHostValidationStateChanged(targetElement: HTMLElement, validationState: ValueHostValidationState): void {
        this.directiveRenderer!.renderForFivaseDirective(
            targetElement,
            this.renderer,
            this.valueHostName!,
            validationState,
            this.fivaseValidationManager,
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
    protected getRenderOptions(): IDirectiveRendererOptions {
        return {};
    }

    /**
     * Cleans up by unsubscribing from validation state changes when the directive is destroyed.
     */
    public ngOnDestroy(): void {
        if (this.subscription) {
            this.fivaseValidationManager.unsubscribeFromValueHostValidationState(this.subscription);
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
 * <tag [fivase-valueHostName]="valueHostName">
 *    <tag [validate]>
 * </tag>
 * ```
 * ### [fivase-target]
 * This optional input allows the directive to target a specific element within a component's template 
 * where this directive will do its work. If not provided, the directive will use the host element.
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IDirectiveRenderer from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * When not assigned, the factory defaults to the IssuesFoundDirectiveRenderer.
 * 
 * ### [fivase-eventHandler]
 * Use to select the custom implementation of IDirectiveEventHandler from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * When not assigned, the factory defaults to the StandardHtmlTagEventDirectiveAction.
 * 
 * Uses the fivaseServicesHost.validationInputDirectiveRendererFactory
 * and fivaseServicesHost.validationInputDirectiveEventHandlerFactory to resolve the implementations.
 */
@Directive({
    selector: '[validate]'
})
export class ValidateInputDirective extends RenderDirectiveBase {

    protected get resolveRendererFactory(): DirectiveRendererFactoryBase {
        return this.fivaseServicesHost.validationInputDirectiveRendererFactory;
    }

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
     * Passed along to the IDirectiveRenderer implementation.
     */
    @Input('invalid-class') invalidCssClass: string = 'input-invalid';

    /**
     * CSS class applied when validation succeeds (valid state).
     * Passed along to the IDirectiveRenderer implementation.
     */
    @Input('valid-class') validCssClass: string = 'input-valid';

    /**
     * Select a custom implementation of `IDirectiveEventHandler` from the factory
     * by supplying the name of the implementation. The name is case-insensitive.
     */
    @Input('fivase-eventHandler') eventHandlerName:string |  undefined;

    constructor(
        el: ElementRef,
        renderer: Renderer2,
        fivaseServicesHost: FivaseServicesHost,
        fivaseValidationManager: FivaseValidationManager,
        valueHostNameDirective: ValueHostNameDirective
    ) {
        super(el, renderer, fivaseServicesHost, fivaseValidationManager, valueHostNameDirective);
    }

    /**
     * resolves the IDirectiveEventHandler implementation from either the [fivase-eventHandler] input or the Factory.
     * Has the event handler setup the input events to deliver the input value to the ValidationManager.
     * @param valueHostName 
     */
    protected setupDirective(valueHostName: string): void {
        let eventHandler = this.fivaseServicesHost.validationInputDirectiveEventHandlerFactory.resolve(
            this.el.nativeElement, this.eventHandlerName);

        if (!eventHandler)
            throw new Error('No event handler was created for the directive.');

        eventHandler.setupEventHandlers(
            this.getTargetElement(),
            this.renderer,
            valueHostName,
            this.fivaseValidationManager
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
    protected getRenderOptions(): IDirectiveRendererOptions {
        return {
            enabledCssClass: this.invalidCssClass,
            disabledCssClass: this.validCssClass
        };
    }
    public ngOnDestroy(): void {
        this.fivaseServicesHost.validationInputDirectiveEventHandlerFactory
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
 * <tag [fivase-valueHostName]="valueHostName">
 *    <tag [validationErrors]>
 * </tag>
 * ```
 * ### [fivase-target]
 * This optional input allows the directive to target a specific element within a component's template 
 * where this directive will do its work. If not provided, the directive will use the host element.
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IDirectiveRenderer, instead of using the Factory.
 * It takes the class name of the desired IDirectiveRenderer object.
 * When not assigned, the factory defaults to ErrorMessagesDirectiveRender which displays a list of error messages in <ul><li> tags.
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
export class ValidationErrorsDirective extends RenderDirectiveBase {
    protected get resolveRendererFactory(): DirectiveRendererFactoryBase {
        return this.fivaseServicesHost.validationErrorDirectiveRendererFactory;
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
     * Passed along to the IDirectiveRenderer implementation.
  
     */
    @Input('invalid-class') invalidCssClass: string = 'error-invalid';

    /**
     * CSS class applied when validation succeeds (valid state).
     * Passed along to the IDirectiveRenderer implementation.
     */
    @Input('valid-class') validCssClass: string = 'error-valid';

    /**
     * Supplies valid and invalid CSS classes to the render.
     * 
     * @returns An object containing the valid and invalid CSS classes.
     */
    protected getRenderOptions(): IDirectiveRendererOptions {
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
 * <tag [fivase-valueHostName]="valueHostName">
 *   <tag [showWhenCorrected]>
 * </tag>
 * ```
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IDirectiveRenderer from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * The default is ShowWhenCorrectedRenderDirectiveAction which shows the element when the input is corrected
 * and hides otherwise.
 */
@Directive({
    selector: '[showWhenCorrected]'
})
export class ShowWhenCorrectedDirective extends RenderDirectiveBase {
    protected get resolveRendererFactory(): DirectiveRendererFactoryBase {
        return this.fivaseServicesHost.correctedDirectiveRendererFactory;
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
 * <tag [fivase-valueHostName]="valueHostName">
 *   <tag [showWhenRequired]>
 * </tag>
 * ```
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IDirectiveRenderer from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * The default is showWhenRequiredRenderDirectiveAction which shows the element when the input is corrected
 * and hides otherwise.
 */
@Directive({
    selector: '[showWhenRequired]'
})
export class ShowWhenRequiredDirective extends RenderDirectiveBase {
    protected get resolveRendererFactory(): DirectiveRendererFactoryBase {
        return this.fivaseServicesHost.requiredDirectiveRendererFactory;
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
 * <tag [fivase-valueHostName]="valueHostName">
 *   <tag [showWhenIssuesFound]>
 * </tag>
 * ```
 * 
 * ### [fivase-render]
 * Use to select the custom implementation of IDirectiveRenderer from the factory
 * by providing the name of the implementation. The name is case-insensitive.
 * The default is showWhenIssuesFoundRenderDirectiveAction which shows the element when the input is corrected
 * and hides otherwise.
 */
@Directive({
    selector: '[showWhenIssuesFound]'
})
export class ShowWhenIssuesFounddDirective extends RenderDirectiveBase {
    protected get resolveRendererFactory(): DirectiveRendererFactoryBase {
        return this.fivaseServicesHost.showWhenIssuesFoundDirectiveRendererFactory;
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
        private fivaseValidationManager: FivaseValidationManager
    ) { }

    public ngOnInit(): void {
        this.subscription = this.fivaseValidationManager.subscribeToValidationState(() => {
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
export interface IFivaseValidationManager {
    validate(options?: any): ValidationState;
    setValue(valueHostName: string, value: any, options?: SetValueOptions): void;
    setInputValue(valueHostName: string, inputValue: string, options?: SetInputValueOptions): void;

    subscribeToValidationState(callback: (state: ValidationState) => void): Subscription;
    unsubscribeFromValidationState(subscription: Subscription): void;

    subscribeToValueHostValidationState(valueHostName: string, callback: (state: ValueHostValidationState) => void): Subscription;
    unsubscribeFromValueHostValidationState(subscription: Subscription): void;

    destroy(): void;

    readonly validationManager: IValidationManager;
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
export class FivaseValidationManager implements IFivaseValidationManager {
    private _validationManager: IValidationManager;
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

    constructor(config: ValidationManagerConfig) {
        this._validationManager = new ValidationManager(config);

        config.onValidationStateChanged = (validationManager: IValidationManager, validationState: ValidationState) => {
            this._validationStateSubject.next(validationState);
        };
        config.onValueHostValidationStateChanged = (valueHost: IValueHost, validationState: ValueHostValidationState) => {
            this._valueHostValidationStateSubject.next({ valueHostName: valueHost.getName(), validationState });
        };
    }

    public get validationManager(): IValidationManager {
        return this._validationManager;
    }

    public validate(options?: any): ValidationState {
        return this._validationManager.validate(options);
    }

    public setValue(valueHostName: string, value: any, options?: SetValueOptions): void {
        this._validationManager.vh.input(valueHostName).setValue(value, options);
    }

    public setInputValue(valueHostName: string, inputValue: string, options?: SetInputValueOptions): void {
        this._validationManager.vh.input(valueHostName).setInputValue(inputValue, options);
    }

    public subscribeToValidationState(callback: (state: ValidationState) => void): Subscription {
        return this._validationStateSubject.subscribe(callback);
    }

    public unsubscribeFromValidationState(subscription: Subscription): void {
        subscription.unsubscribe();
    }

    public subscribeToValueHostValidationState(valueHostName: string, callback: (state: ValueHostValidationState) => void): Subscription {
        return this._valueHostValidationStateSubject
            .pipe(filter(forCallback => forCallback.valueHostName === valueHostName))
            .subscribe(event => callback(event.validationState));
    }

    public unsubscribeFromValueHostValidationState(subscription: Subscription): void {
        subscription.unsubscribe();
    }

    public destroy(): void {
        this._validationManager.dispose();
        this._validationStateSubject.complete();
        this._valueHostValidationStateSubject.complete();
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

    // Retrieve the configuration for a specific formId
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

    // Register a configuration for a formId
    public register(formId: string, config: ValidationManagerConfig | ((formId: string) => ValidationManagerConfig)): void {
        this.configs.set(formId, config);
    }

    // Save the state of the form validation (used for persisting state)
    protected saveState(formId: string, state: any): void {
        this.stateStore.saveState(formId, state);
    }
}

export class FivaseServicesHost {
    constructor(private stateStore: IFivaseStateStore) { 
        this._configHost = new FivaseConfigHost(stateStore);
    }

    /**
     * The FivaseConfigHost service, which manages the configurations for forms and their states.
     * Use this service to register configurations for forms and retrieve them when needed.
     * For example, when creating a new form, register the configuration for that form like this:
     * ```ts
     * fivaseServicesHost.configHost.register('myFormId', (formId: string) => {
     * let builder = build(createValidationServices());
     * ... use the Jivs Builder to create the configuration ...
     *    return builder.complete();
     * });
     * ```
     * Retrieve the configuration for that form using the getConfig method.
     * ```ts
     * const config = fivaseServicesHost.configHost.getConfig('myFormId');
     * ```
     */
    public get configHost(): IFivaseConfigHost
    {
        return this._configHost;
    }
    private _configHost: FivaseConfigHost;

    /**
     * Factory for creating instances of IDirectiveRenderer for ValidationInputDirective.
     */
    public get validationInputDirectiveRendererFactory(): ValidationInputDirectiveRendererFactory {
        return this._validationInputDirectiveRendererFactory;
    }
    private _validationInputDirectiveRendererFactory = new ValidationInputDirectiveRendererFactory();

    /**
     * Factory for creating instances of IDirectiveEventHandler for ValidationInputDirective.
     */
    public get validationInputDirectiveEventHandlerFactory(): ValidationInputDirectiveEventHandlerFactory {
        return this._validationInputDirectiveEventHandlerFactory;
    }
    private _validationInputDirectiveEventHandlerFactory = new ValidationInputDirectiveEventHandlerFactory();

    /**
     * Factory for creating instances of IDirectiveRenderer for ValidationErrorsDirective.
     */
    public get validationErrorDirectiveRendererFactory(): ValidationErrorDirectiveRendererFactory {
        return this._validationErrorDirectiveRendererFactory;
    }
    private _validationErrorDirectiveRendererFactory = new ValidationErrorDirectiveRendererFactory();

    /**
     * Factory for creating instances of IDirectiveRenderer for CorrectedDirective.
     */
    public get correctedDirectiveRendererFactory(): CorrectedDirectiveRendererFactory {
        return this._correctedDirectiveRendererFactory;
    }
    private _correctedDirectiveRendererFactory = new CorrectedDirectiveRendererFactory();

    public get requiredDirectiveRendererFactory(): RequiredDirectiveRendererFactory {
        return this._requiredDirectiveRendererFactory;
    }   
    private _requiredDirectiveRendererFactory = new RequiredDirectiveRendererFactory();

    public get showWhenIssuesFoundDirectiveRendererFactory(): ShowWhenIssuesFoundDirectiveRendererFactory
    {
        return this._showWhenIssuesFoundDirectiveRendererFactory;
    }
    private _showWhenIssuesFoundDirectiveRendererFactory = new ShowWhenIssuesFoundDirectiveRendererFactory();
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
