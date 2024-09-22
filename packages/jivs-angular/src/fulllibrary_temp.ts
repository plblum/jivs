// // This is the new code for the new library, jivs-angular.
// // ChatGPT, we are collaborating on this source code.

// import { Directive, Input, ElementRef, Renderer2, OnInit, OnDestroy, Optional, SkipSelf } from '@angular/core';
// import { Subscription, fromEvent, debounceTime, BehaviorSubject, filter } from 'rxjs';
// import { ValidationManagerConfig, IValidationManager } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
// import { ValidationState, ValidationStatus, IssueFound, ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
// import { SetValueOptions, IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
// import { SetInputValueOptions } from '@plblum/jivs-engine/build/Interfaces/InputValueHost';
// import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
// import { ValidationManager } from '@plblum/jivs-engine/build/Validation/ValidationManager';

// /**
//  * Interface for handling validation-related render logic on elements associated with a ValueHost. 
//  * This is used to apply various visual effects such as error messages, positioning, or styling based on validation
//  * results. It targets DirectiveActions, which allow Fivase's directives to offload render logic to standalone classes.
//  * 
//  * The `IDirectiveRenderer` interface is implemented by standalone `DirectiveAction`
//  * classes. These classes handle validation render purely at the DOM level, without requiring
//  * involvement from Angular components.
//  * 
//  * Classes implementing this interface can be registered with a Factory and associated with specific HTML tags.
//  * Components that target a specific implementation of `IDirectiveRenderer` can use
//  * the attachDirectiveActionsToElement() method to provide the Factory with the appropriate instance.
//  * Each Directive class that uses IDirectiveRenderer has its own Factory: InputRenderDirectiveActionFactory,
//  * ErrorRenderDirectiveActionFactory, and ContainerRenderDirectiveActionFactory.
//  * Unless you use the [fivase-render] input, the Factory will provide the appropriate instance
//  * to the Directive.
//  * 
//  * Classes implementing this interface should not expect any Angular Dependency Injection into their constructor.
//  * They are created explicitly when registering with the factory.
//  */
// export interface IDirectiveRenderer {
//     /**
//      * Applies validation-related render logic to the element based on validation results.
//      * 
//      * @param element - The DOM element.
//      * @param renderer - The Angular Renderer2 service, to allow changing the element's appearance.
//      * @param valueHostName - The name of the value host associated with this element, used to
//      * identify which validation rules apply.
//      * @param validationState - A ValeuHosts' ValidationState, which includes the current validation status,
//      * issues found, and other relevant data.
//      * @param fivaseValidationManager - The validation manager responsible for managing the validation
//      * logic, errors, and state.
//      * @param options - Determined by the Directive to deliver any attribute values it gets from the user.
//      */
//     renderForFivaseDirective(
//         element: HTMLElement,
//         renderer: Renderer2,
//         valueHostName: string,
//         validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string; disabledCssClass?: string }
//     ): void;
// }

// /**
//  * Interface for setting up event handlers related to validation for elements. This is used to
//  * listen to user interactions (such as typing or selecting) and trigger validation or other actions.
//  * 
//  * The `IDirectiveEventHandler` interface can be implemented in standalone `DirectiveAction` classes.
//  * These classes handle event management purely at the DOM level, without requiring any involvement
//  * from Angular components.
//  * 
//  * Classes implementing this interface can be registered with a Factory and associated with specific HTML tags.
//  * Components that target a specific implementation of `IDirectiveEventHandler` can use
//  * the attachDirectiveActionsToElement() method to provide the Factory with the appropriate instance.
//  * Each Directive class that uses IDirectiveEventHandler has its own Factory: EventsDirectiveActionFactory.
//  * Unless you use the [fivase-eventHandler] input, the Factory will provide the appropriate instance
//  * to the Directive.
//  * 
//  * Classes implementing this interface should not expect any Angular Dependency Injection into their constructor.
//  * They are created explicitly when registering with the factory.
//  */
// export interface IDirectiveEventHandler {
//     /**
//      * Sets up validation-related event handlers on the target element.
//      * 
//      * @param element - The target DOM element. It could be an input field, a
//      * container, etc.
//      * @param renderer - The Angular Renderer2 service used to attach event listeners to the DOM.
//      * @param valueHostName - The name of the value host associated with this element, used to identify
//      * the data being validated.
//      * @param fivaseValidationManager - The validation manager responsible for handling validation,
//      * which will be invoked when events occur.
//      */
//     setupEventHandlers(
//         element: HTMLElement,
//         renderer: Renderer2,
//         valueHostName: string,
//         fivaseValidationManager: FivaseValidationManager
//     ): void;
// }

// /**
//  * The `DirectiveActionBase` class serves as an abstract base for directive actions in the Jivs-angular library.
//  * 
//  * The primary goal of directive actions is to handle component and HTML tag-specific work needed by directives, 
//  * allowing the system to be extended easily to support new components. Directive actions manage tasks such as 
//  * handling value changes and presenting validation states to components, like input fields, error message components, and more.
//  * 
//  * Subclasses are expected to implement either `IDirectiveEventHandler` for event handling or 
//  * `IDirectiveRenderer` for updating UI render.
//  * 
//  * See additional notes about using a Factory and Angular Dependency Injection limitations in the interface definitions.
//  */
// export abstract class DirectiveActionBase {

// }


// /**
//  * Concrete implementation of `IDirectiveEventHandler` that targets all HTML tags supporting
//  * validation-related events, including 'input', 'textarea', 'select', 'checkbox', and 'file' types. 
//  * This class listens for 'input', 'change' events and triggers validation logic accordingly.
//  * 
//  * The event listeners are attached to the DOM element supplied. The class also includes the ability to enable
//  * or disable 'input' event listeners through a protected getter, making it accessible for subclasses.
//  */
// export class StandardHtmlTagEventDirectiveAction extends DirectiveActionBase implements IDirectiveEventHandler {

//     /**
//      * Creates an instance of `StandardHtmlTagEventDirectiveAction`.
//      * 
//      * @param inputEventEnabled - Optional parameter to control whether 'input' event listeners are attached 
//      *  (default is true). This allows control over whether real-time validation 
//      *  (via 'input' events) is enabled or disabled.
//      * @param inputEventDebounceTime - Optional parameter to control the debounce time for 'input' events,
//      *  which determines how long to wait before handling the event (default is 300ms),
//      *  This allows control over how often validation is triggered during typing.
//      *  Default is 300ms.
//      */
//     constructor(inputEventEnabled: boolean = true, inputEventDebounceTime: number = 300) {
//         super();
//         this._inputEventEnabled = inputEventEnabled;
//         this._inputEventDebounceTime = inputEventDebounceTime;
//     }

//     /**
//      * Protected getter for `inputEventEnabled`, used to control whether 'input' events are attached.
//      * 
//      * Subclasses can access this property to determine whether the 'input' event listeners should be 
//      * installed. It defaults to true but can be customized via the constructor.
//      * 
//      * @returns A boolean indicating if 'input' events should be attached (true) or not (false).
//      */
//     protected get inputEventEnabled(): boolean {
//         return this._inputEventEnabled;
//     }
//     private _inputEventEnabled: boolean;

//     /**
//      * The input event fires as fast as the user types. When this is assigned to a number,
//      * it will wait that many milliseconds before handling the event, allowing for fast typing
//      * to complete before validating.
//      */
//     protected get inputEventDebounceTime(): number {
//         return this._inputEventDebounceTime;
//     }
//     private _inputEventDebounceTime: number;

//     /**
//      * Sets up validation-related event handlers on the target element. 
//      * 
//      * This method attaches event listeners for the 'input' and 'change' events for 'input' and 'textarea' tags, 
//      * the 'change' event for 'select', 'checkbox', and 'file' input types. The `inputEventEnabled` flag determines 
//      * if 'input' event listeners should be attached for 'input' and 'textarea'.
//      * 
//      * The appropriate event handlers are installed using a switch statement based on the tag name.
//      * 
//      * @param element - The target HTMLElement to apply the render to.
//      * @param fivaseValidationManager - The validation manager responsible for handling validation logic and errors.
//      * @param valueHostName - The name of the value host associated with this element, used to identify the validation target.
//      */
//     public setupEventHandlers(
//         element: HTMLElement,
//         renderer: Renderer2,
//         valueHostName: string,
//         fivaseValidationManager: FivaseValidationManager
//     ): void {
//         let self = this;
//         const tagName = element.tagName.toLowerCase();

//         switch (tagName) {
//             case 'input':
//                 setupForInputTag();
//                 break;
//             case 'select':
//                 setupSelectHandler();
//                 break;
//             case 'textarea':
//                 setupChangeEventHandler();
//                 setupInputEventHandler();
//                 break;
//             default:
//                 console.warn(`Unsupported tagName: ${tagName}`);
//         }
    

//         function setupForInputTag(): void {
//             // Handle input types like checkbox and file
//             switch ((element.getAttribute('type') || '').toLowerCase()) {
//                 case 'checkbox':
//                     setupCheckboxHandler();
//                     break;
//                 case 'file':
//                     setupFileHandler();
//                     break;
//                 default:
//                     setupChangeEventHandler();
//                     setupInputEventHandler();
//                     break;
//             }
//         }

//         function setupCheckboxHandler(): void {
//             // Handle checkbox validation
//             renderer.listen(element, 'change', (event: Event) => {
//                 const isChecked = (event.target as HTMLInputElement).checked;
//                 fivaseValidationManager.setValue(valueHostName, isChecked, { validate: true });
//             });
//         }

//         function setupFileHandler(): void {
//             // Handle file input validation
//             renderer.listen(element, 'change', (event: Event) => {
//                 const files = (event.target as HTMLInputElement).files;
//                 const fileData = files
//                     ? JSON.stringify(
//                         Array.from(files).map(file => ({
//                             name: file.name,
//                             size: file.size,
//                             type: file.type,
//                         }))
//                     )
//                     : ''; // Send empty string if no files are selected
//                 fivaseValidationManager.setValue(valueHostName, fileData, { validate: true });
//             });
//         }

//         function setupSelectHandler(): void {
//             // Handle select element validation (only listen for 'change' event)
//             renderer.listen(element, 'change', (event: Event) => {
//                 const selectValue = (event.target as HTMLSelectElement).value;
//                 fivaseValidationManager.setInputValue(valueHostName, selectValue, { validate: true });
//             });
//         }

//         function setupInputEventHandler(): void {
//             if (self.inputEventEnabled) {
//                 //   renderer.listen(element, 'input', (event: Event) => {
//                 //     const inputValue = (event.target as HTMLInputElement).value;
//                 //     fivaseValidationManager.setInputValue(valueHostName,  inputValue, { validate: true, duringEdis: true });
//                 //   });
//                 fromEvent(element, 'input')
//                     .pipe(debounceTime(self.inputEventDebounceTime))  // Wait before handling the event
//                     .subscribe((event: Event) => {
//                         const inputValue = (event.target as HTMLInputElement).value;
//                         fivaseValidationManager.setInputValue(valueHostName, inputValue, { validate: true, duringEdit: true });
//                     });
//             }
//         }

//         function setupChangeEventHandler(): void {
//             // Handle change event
//             renderer.listen(element, 'change', (event: Event) => {
//                 const inputValue = (event.target as HTMLInputElement).value;
//                 fivaseValidationManager.setInputValue(valueHostName, inputValue, { validate: true });
//             });
//         }
//     }
// }

// /**
//  * RenderDirectiveActionBase provides a foundation for applying CSS-based validation render.
//  * This class offers the ability to apply or remove CSS classes based on validation states (valid/invalid).
//  * 
//  * Key features include:
//  * - Two states based on ValidationState and valuehostname, useful to apply CSS classes and hide elements.
//  *   States are named "Enabled" and "Disabled".
//  * - Configurable CSS classes for Enabled and Disabled states.
//  * - Can hide elements by applying a CSS class that sets display: none and the hidden attribute.
//  * 
//  */
// export abstract class RenderDirectiveActionBase extends DirectiveActionBase implements IDirectiveRenderer {
//     /**
//      * Creates an instance of `RenderDirectiveActionBase`.
//      * 
//      * @param enabledCssClass - Default CSS class applied when in enabled state. Overridden
//      * by options.enabledCssClass if provided.
//      * @param disabledCssClass - Default CSS class applied when in disabled state. Overridden
//      * by options.disabledCssClass if provided.
//      * @param hideElementWhenTwoStateIs - Optional parameter to hide the element when two states are present.
//      * Its value determines with of the two states will hide the element. For true, hide when enabled.
//      * For false, hide when disabled. Default is false. When null, do not support hidding.
//      */
//     constructor(
//         enabledCssClass: string | null = null,
//         disabledCssClass: string | null = null,
//         hideElementWhenTwoStateIs: boolean | null = false
//     ) {
//         super();
//         this._enabledCssClass = enabledCssClass;
//         this._disabledCssClass = disabledCssClass;
//         this._hideElementWhenTwoStateIs = hideElementWhenTwoStateIs;
//     }

//     /**
//      * Default CSS class applied when in enabled state.
//      * Overridden by options.enabledCssClass if provided.
//      * 
//      * @returns The CSS class for enabled state (can be an empty string or null).
//      */
//     protected get enabledCssClass(): string | null {
//         return this._enabledCssClass;
//     }
//     private _enabledCssClass: string | null;

//     /**
//      * Default CSS class applied when in disabled state.
//      * Overridden by options.disabledCssClass if provided.
//      * 
//      * @returns The CSS class for disabled state (can be an empty string or null).
//      */
//     protected get disabledCssClass(): string | null {
//         return this._disabledCssClass;
//     }
//     private _disabledCssClass: string | null;
    
//     /**
//      * Optional parameter to hide the element when two states are present.
//      * Its value determines which of the two states will hide the element.
//      * For true, hide when enabled. For false, hide when disabled. Default is false.
//      * When null, do not support hiding.
//      * Hiding involves sets display: none and adding the hidden attribute to the element.
//      * Removing hiding removes both the display style and the hidden attribute.
//      */
//     protected get hideElementWhenTwoStateIs(): boolean | null {
//         return this._hideElementWhenTwoStateIs;
//     }
//     private _hideElementWhenTwoStateIs: boolean | null;


//     /**
//      * Applies validation-related render logic to the target element.
//      * This class handles enabledCssClass and disabledCssClass properties.
//      * 
//      * @param element - The DOM element.
//      * @param renderer - The Angular Renderer2 service, to allow changing the element's appearance.
//      * @param valueHostName - The name of the value host associated with this element, used to
//      * identify which validation rules apply.
//      * @param validationState - A ValeuHosts' ValidationState, which includes the current validation status,
//      * issues found, and other relevant data.
//      * @param fivaseValidationManager - The validation manager responsible for managing the validation
//      * logic, errors, and state.
//      * @param options - Determined by the Directive to deliver any attribute values it gets from the user.
//      */
//     public renderForFivaseDirective(
//         element: HTMLElement,
//         renderer: Renderer2,
//         valueHostName: string,
//         validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string | null; disabledCssClass?: string | null }
//     ): void {
//         let twoStates = this.resolveTwoStates(valueHostName, validationState, fivaseValidationManager, options);
//         if (twoStates !== null) {
//             this.twoStateRender(twoStates, element, renderer, valueHostName, validationState, fivaseValidationManager, options);
//             this.twoStateHideElement(twoStates, element, renderer);
//         }
//     }

//     /**
//      * Applies the UI render based on the two states (enabled/disabled). 
//      * At this level, it applies enabledCssClass and disabledCssClass to the element.
//      * @param enabledState 
//      * @param element 
//      * @param renderer 
//      * @param valueHostName 
//      * @param validationState 
//      * @param fivaseValidationManager 
//      * @param options 
//      */
//     protected twoStateRender(
//         enabledState: boolean,
//         element: HTMLElement,
//         renderer: Renderer2,
//         valueHostName: string,
//         validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string | null; disabledCssClass?: string | null }
//     )
//     {
//         let enabledCssClass = options?.enabledCssClass ?? this.enabledCssClass;
//         let disabledCssClass = options?.disabledCssClass ?? this.disabledCssClass;

//         if (enabledState) {
//             changeCssClasses(enabledCssClass, disabledCssClass, element, renderer);
//         } else {
//             changeCssClasses(disabledCssClass, enabledCssClass, element, renderer);
//         }
//     }

//     /**
//      * UI Render to hide or unhide the element based on the two states
//      * and the hideElementWhenTwoStateIs property.
//      * @param enabledState 
//      * @param element 
//      * @param renderer 
//      * @returns 
//      */
//     protected twoStateHideElement(enabledState: boolean, element: HTMLElement, renderer: Renderer2): void {
//         if (this.hideElementWhenTwoStateIs !== null) {
//             let enabledStateForHide = this.hideElementWhenTwoStateIs;
//             if (enabledState === enabledStateForHide) {
//                 renderer.setStyle(element, 'display', 'none');
//                 renderer.setAttribute(element, 'hidden', 'true');
//             } else {
//                 renderer.removeStyle(element, 'display');
//                 renderer.removeAttribute(element, 'hidden');
//             }    
//         }
//     }

//     /**
//      * Abstract method to determine whether the element should be enabled or disabled based on the validation state
//      * and/or value host. If the render does not use two-states, it should return null.
//      * When not-null, the enabledCssClass and disabledCssClass will be applied based on the return value.
//      */
//     protected abstract resolveTwoStates(
//         valueHostName: string,
//         validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string | null; disabledCssClass?: string | null }): boolean | null;

//     /**
//      * Utility to add an error message to an element and apply appropriate attributes, including data-severity='error|severe|warn'.
//      * @param element 
//      * @param renderer 
//      * @param errorMessage 
//      */
//     protected addErrorMessageToElement(element: HTMLElement, renderer: Renderer2, issueFound: IssueFound): void {
//         renderer.setProperty(element, 'innerHTML', issueFound.errorMessage);    // NOTE: errorMessage is already in HTML format
//         renderer.setAttribute(element, 'data-severity', ValidationSeverity[issueFound.severity].toLowerCase());
//         //!!!PENDING: ARIA attributes
//     }
// }

// /**
//  * Utility adds one css class and removes another. Classes can be null or undefined to take no action.
//  */
// export function changeCssClasses(toAdd: string | null | undefined, toRemove: string | null | undefined, element: HTMLElement, renderer: Renderer2): void {
//     if (toAdd) {
//         renderer.addClass(element, toAdd);
//     }
//     if (toRemove) {
//         renderer.removeClass(element, toRemove);
//     }
// }    
// /**
//  * Concrete implementation of `IDirectiveRenderer` that applies a CSS class to the target element
//  * depending on ValidationState.IssuesFound. It uses enabledCssClass when there are issues found and disabledCssClass
//  * when there are no issues found.
//  * The default classes are enabledCssClass = 'invalid' and disabledCssClass = 'valid'.
//  */
// export class IssuesFoundRenderDirectiveAction extends RenderDirectiveActionBase {

//     constructor(
//         enabledCssClass: string | null = 'invalid',
//         disabledCssClass: string | null = 'valid') {
//         super(enabledCssClass, disabledCssClass, false);
//     }
    
//     protected resolveTwoStates(valueHostName: string, validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string | null; disabledCssClass?: string | null; } | undefined): boolean | null {
//         return validationState.issuesFound && validationState.issuesFound.length > 0;
//     }
// }

// /**
//  * Concrete implementation of `IDirectiveRenderer` that hides or shows the element based on the presence of issues.
//  * It does not change any CSS classes.
//  * It is the default UI for ShowWhenIssuesFoundDirective.
//  */
// export class ShowWhenIssuesFoundRenderDirectiveAction extends RenderDirectiveActionBase {
//     constructor(
//         enabledCssClass: string | null = null,
//         disabledCssClass: string | null = null) {
//         super(enabledCssClass, disabledCssClass, true);
//     }

//     protected resolveTwoStates(valueHostName: string, validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string | null; disabledCssClass?: string | null; } | undefined): boolean | null {
//         return validationState.issuesFound && validationState.issuesFound.length > 0;
//     }
// }

// /**
//  * Concrete implementation of `IDirectiveRenderer` that shows or hides the element based on 
//  * the ValidationState.corrected property. It does not change any CSS classes.
//  */
// export class ShowWhenCorrectedRenderDirectiveAction extends RenderDirectiveActionBase {
//     constructor(
//         enabledCssClass: string | null = null,
//         disabledCssClass: string | null = null) {
//         super(enabledCssClass, disabledCssClass, true);
//     }
//     protected resolveTwoStates(valueHostName: string,
//         validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: {
//             enabledCssClass?: string | null | undefined;
//             disabledCssClass?: string | null | undefined;
//         } | undefined): boolean | null {
//         return validationState.corrected;
//     }
// }



// /**
//  * This implementation of `IDirectiveRenderer` generates a list of error messages from
//  * the IssuesFound array in the validation state. While it can be used to fully display the UI
//  * for errors, it is designed to be used in conjunction with other render directives within
//  * a component that offers complexities found in UIs that display errors, such as popups
//  * and icons.
//  * 
//  * The list has two tags: an outer tag (default is 'ul') and an inner tag (default is 'li'). 
//  * The outer tag encloses the list.
//  * The inner tag contains the error message.
//  * If there are no issues found, the element is hidden and existing error messages are discarded.
//  * Expects issueFound.errorMessage to contain HTML. 
//  * 
//  * You can provide alternative tags through the constructor. You can omit the outer tag by setting it to null.
//  * You can also provide CSS classes for the outer and inner tags through the constructor. They have defaults
//  * of 'error-messages' and 'error-message' respectively.
//  * 
//  * This is a two-state class where 'enabled' means
//  * there are issues found and 'disabled' means there are no issues found.
//  * 
//  * The enabledCssClass and disabledCssClass properties are not provided a default value.
//  * We expect the user to assign any classes they need directly to the tag, as its value is not influenced by 
//  * the issuesFound.
//  */
// export class ErrorMessagesRenderDirectiveAction extends RenderDirectiveActionBase {
//     constructor(
//         outerTag: string | null = 'ul',
//         innerTag: string = 'li',
//         outerTagCssClass: string | null = 'error-messages',
//         innerTagCssClass: string | null = 'error-message',
//         enabledCssClass?: string,
//         disabledCssClass?: string
//     ) {
//         super(enabledCssClass, disabledCssClass);
//         this._outerTag = outerTag;
//         this._innerTag = innerTag;
//         this._outerTagCssClass = outerTagCssClass;
//         this._innerTagCssClass = innerTagCssClass;
//     }

//     /**
//      * Determines the outer tag surrounding a list of error messages.
//      * It defaults to 'ul'.
//      */
//     protected get outerTag(): string | null{
//         return this._outerTag;
//     }
//     private _outerTag: string | null;

//     /**
//      * Provides a class for the element that surrounds the list of error messages.
//      * Use null to not apply a class.
//      */
//     protected get outerTagCssClass(): string | null {
//         return this._outerTagCssClass;
//     }
//     private _outerTagCssClass: string | null;

//     /**
//      * Provides a class for the inner tag that contains each error message in the list.
//      * Use null to not apply a class.
//      */
//     protected get innerTagCssClass(): string | null {
//         return this._innerTagCssClass;
//     }
//     private _innerTagCssClass: string | null;

//     /**
//      * Determines the inner tag for each error message in the list.
//      * It defaults to 'li'.
//      */
//     protected get innerTag(): string {
//         return this._innerTag;
//     }   
//     private _innerTag: string;

//     public renderForFivaseDirective(
//         element: HTMLElement,
//         renderer: Renderer2,
//         valueHostName: string,
//         validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string; disabledCssClass?: string }
//     ): void {
//         // Clear existing content inside the element
//         renderer.setProperty(element, 'innerHTML', '');

//         let issuesFound = validationState.issuesFound;
//         if (issuesFound && issuesFound.length > 0) {
//             if (this.outerTag === null) {
//                 // No outer tag, so just display the first error message
//                 const listItem = renderer.createElement(this.innerTag);
//                 changeCssClasses(this.innerTagCssClass, null, listItem, renderer);
//                 this.addErrorMessageToElement(listItem, renderer, issuesFound[0]);
//                 renderer.appendChild(element, listItem);
//             }
//             else {
//                 // Create a the outer tag element to display the list
//                 const outer = renderer.createElement(this.outerTag);
//                 changeCssClasses(this.outerTagCssClass, null, outer, renderer);

//                 // Loop through issues and create an inner tag for each error message
//                 issuesFound.forEach(issue => {
//                     const listItem = renderer.createElement(this.innerTag);
//                     changeCssClasses(this.innerTagCssClass, null, listItem, renderer);
//                     this.addErrorMessageToElement(listItem, renderer, issue);
//                     renderer.appendChild(outer, listItem);
//                 });

//                 // Append the <ul> to the component's element
//                 renderer.appendChild(element, outer);
//             }
//         }

//         // Apply the CSS class logic from the base class
//         super.renderForFivaseDirective(element, renderer, valueHostName, validationState, fivaseValidationManager, options);
//     }

//     /**
//      * Enables when validationState.issuesFound is not empty.
//      * @param valueHostName 
//      * @param validationState 
//      * @param fivaseValidationManager 
//      * @param options 
//      * @returns true if issuesFound is not empty.
//      */
//     protected resolveTwoStates(
//         valueHostName: string,
//         validationState: ValueHostValidationState,
//         fivaseValidationManager: FivaseValidationManager,
//         options?: { enabledCssClass?: string; disabledCssClass?: string }): boolean | null {
//         return validationState.issuesFound && validationState.issuesFound.length > 0;
//     }
// }



// /**
//  * Abstract factory class that manages the creation and registration of `IDirectiveEventHandler` and
//  * `IDirectiveRenderer` instances. Provides logic for creating objects based on the tag or
//  * `input:type` pattern for input elements.
//  * 
//  * The class centralizes the instantiation and management of `IDirectiveEventHandler` and
//  * `IDirectiveRenderer` objects, ensuring directives can access and reuse these objects
//  * based on tag or input type.
//  * 
//  * - Registers standard HTML tags (e.g., 'div', 'button') via `registerTag`.
//  * - Registers HTML input elements by type (e.g., 'input:text', 'input:number') via `registerInputByType`.
//  */
// export abstract class DirectiveActionFactoryBase<T> {
//     private registryByName: Map<string, T> = new Map();

//     public get defaultFallback(): T {
//         if (!this._defaultFallback) {
//             this._defaultFallback = this.createDefaultFallback();
//         }
//         return this._defaultFallback;
//     }
//     public set defaultFallback(directiveAction: T) {
//         this._defaultFallback = directiveAction;
//     }
//     private _defaultFallback: T | undefined = undefined;

//     protected abstract createDefaultFallback(): T;

//     /**
//      * Registers an instance of a directive action by HTML tag name.
//      * 
//      * @param tag - The tag name used to register the instance (e.g., 'div', 'button').
//      * @param instance - The instance of the directive action.
//      */
//     public registerTag(tag: string, instance: T): void {
//         if (!this.isValidInstance(instance)) {
//             throw new Error('Invalid instance provided.');
//         }
//         this.registryByName.set(tag.toLowerCase(), instance);
//     }

//     /**
//      * Registers an instance of a directive action for input elements by type.
//      * 
//      * @param inputType - The input type used to register the instance (e.g., 'text', 'number').
//      * @param instance - The instance of the directive action.
//      */
//     public registerInputByType(inputType: string, instance: T): void {
//         if (!this.isValidInstance(instance)) {
//             throw new Error('Invalid instance provided.');
//         }
//         this.registryByName.set(`input:${inputType.toLowerCase()}`, instance);
//     }

//     /**
//      * Creates or retrieves a registered directive action based on the tag name or `input:type` of an
//      * element.
//      * 
//      * @param element - The HTML element for which the directive action is needed.
//      * @returns The created or retrieved directive action instance.
//      */
//     public create(element: HTMLElement): T {
//         return this.getFromRegistry(element) ?? this.defaultFallback;
//     }

//     /**
//      * Validates the given instance to ensure it matches the required type.
//      * 
//      * @param instance - The instance to validate.
//      * @returns A boolean indicating whether the instance is valid.
//      */
//     protected abstract isValidInstance(instance: T): boolean;

//     /**
//      * Retrieves a directive action from the registry, either by tag name or `input:type`.
//      * 
//      * @param element - The HTML element to retrieve the directive action for.
//      * @returns The directive action instance, if found.
//      */
//     private getFromRegistry(element: HTMLElement): T | undefined {
//         const tagName = element.tagName.toLowerCase();

//         // Check for "input:type" registration for input elements
//         if (tagName === 'input' && element.hasAttribute('type')) {
//             const inputType = element.getAttribute('type')?.toLowerCase();
//             return this.registryByName.get(`input:${inputType}`);
//         }

//         return this.registryByName.get(tagName);
//     }
// }

// /**
//  * Extends `DirectiveActionFactoryBase` to handle `IDirectiveRenderer` instances,
//  * ensuring valid presenters are created or retrieved based on the provided HTML element or tag.
//  * 
//  * This factory ensures that different elements can have customized render behavior.
//  * 
//  * This factory checks multiple sources for `IDirectiveRenderer` instances:
//  *  - Instances attached via `attachDirectiveActionsToElement()`
//  *  - Instances created based on the tag name of the DOM element
//  *  - Falls back to a default, which is specific to each subclass.
//  * 
//  * @param el - The ElementRef representing the target DOM element.
//  * @returns An instance of `IDirectiveRenderer`, either registered for the element or
//  * resolved via the default factory logic.
//  */
// export abstract class PresenterDirectiveActionFactoryBase extends DirectiveActionFactoryBase<IDirectiveRenderer> {

//     /**
//      * Creates or resolves the appropriate `IDirectiveRenderer` for a given element.
//      * 
//      * @param element - The HTMLElement representing the target DOM element.
//      * @returns An instance of `IDirectiveRenderer`.
//      */
//     public create(element: HTMLElement): IDirectiveRenderer {

//         // Check for an existing render directive action
//         const existingRenderAction = (element as any)[FIVASE_PRESENTATION_PROPERTY] as IDirectiveRenderer | undefined;
//         if (existingRenderAction) {
//             return existingRenderAction;
//         }

//         // Fall back to the default creation logic using the tag name
//         return super.create(element);
//     }

//     /**
//      * Validates whether the instance is a valid `IDirectiveRenderer`.
//      * 
//      * @param instance - The instance to validate.
//      * @returns True if the instance is valid.
//      */
//     protected isValidInstance(instance: IDirectiveRenderer): boolean {
//         return !!instance && typeof instance.renderForFivaseDirective === 'function';
//     }
// }


// /**
//  * Concrete factory class for creating `IDirectiveRenderer` instances specific to input elements.
//  * Provides a default presenter for handling validation display logic.
//  *
//  * Designed to manage the creation of input-specific render logic, ensuring that inputs are visually updated when 
//  * validation results are received. This factory allows for custom or default behavior depending on input type.
//  *
//  * Used in directives like `ValidateInputDirective` to retrieve or create an appropriate presenter for input components.
//  * Its default is IssuesFoundRenderDirectiveAction which assigns css class 'invalid' when issues are found
//  * and 'valid' when no issues are found.
//  */
// export class InputRenderDirectiveActionFactory extends PresenterDirectiveActionFactoryBase {

//     protected createDefaultFallback(): IDirectiveRenderer {
//         return new IssuesFoundRenderDirectiveAction();
//     }
// }

// /**
//  * Factory class for generating `IDirectiveRenderer` instances that handle error messages for invalid inputs.
//  * Manages the display of validation errors on the UI.
//  *
//  * Provides specialized render logic for error messages, allowing different styles or behaviors to be applied to error 
//  * messages displayed next to form inputs.
//  *
//  * Used by the `ValidationErrorsDirective` to manage how error messages are displayed when validation fails.
//  * 
//  * The default is ErrorMessagesRenderDirectiveAction which displays a list of error messages in an 'ul' tag.
//  * If you want to change the tags or classes, you can provide them in the constructor of ErrorMessagesRenderDirectiveAction
//  * and assign that to the defaultFallback property.
//  */
// export class ErrorMessagesRenderDirectiveActionFactory extends PresenterDirectiveActionFactoryBase {

//     protected createDefaultFallback(): IDirectiveRenderer {
//         return new ErrorMessagesRenderDirectiveAction();
//     }
// }

// /**
//  * Factory class for handling the render logic of container components, applying styles based on the validation state of child elements.
//  *
//  * Developed to manage the visual feedback for container elements (e.g., `div` or `section` wrapping multiple inputs), allowing 
//  * containers to visually indicate if any of their child elements are invalid.
//  *
//  * Used in directives like `ContainsInvalidChildrenDirective` to handle validation state changes at a higher level and apply styles accordingly.
//  */
// export class ContainerRenderDirectiveActionFactory extends PresenterDirectiveActionFactoryBase {

//     protected createDefaultFallback(): IDirectiveRenderer {
//         return new ClassNameRenderDirectiveAction();
//     }
// }

// /**
//  * This factory is responsible for creating and retrieving instances of `IDirectiveEventHandler`
//  * that handle the setup of event listeners on HTML elements, based on tag names or `input:type`.
//  * 
//  * It centralizes and simplifies the logic for setting up event handlers for different HTML elements,
//  * allowing directives to dynamically assign event handlers without hardcoding specific logic.
//  * The factory allows for reuse and customization of event capturing strategies.
//  * 
//  * This factory is used in directives like `ValidateInputDirective` to attach event listeners to UI
//  * elements (e.g., form inputs) and forward those events to the validation system through
//  * `IDirectiveEventHandler` implementations.
//  * 
//  * This factory checks multiple sources for `IDirectiveEventHandler` instances:
//  *  - Instances attached via `attachDirectiveActionsToElement()`
//  *  - Instances created based on the tag name of the DOM element
//  *  - Falls back to a default, StandardHtmlTagEventDirectiveAction.
//  * 
//  * @param el - The ElementRef representing the target DOM element.
//  * @returns An instance of `IDirectiveEventHandler`, either registered for the element or
//  * resolved via the default factory logic.
//  */
// export class EventsDirectiveActionFactory extends DirectiveActionFactoryBase<IDirectiveEventHandler> {

//     /**
//      * Creates or resolves the appropriate `IDirectiveEventHandler` for a given element.
//      * 
//      * @param element - The HTMLElement representing the target DOM element.
//      * @returns An instance of `IDirectiveEventHandler`.
//      */
//     public create(element: HTMLElement): IDirectiveEventHandler {

//         // Check for an existing event handler directive action
//         const existingEventsAction = (element as any)[FIVASE_EVENT_HANDLER_PROPERTY] as IDirectiveEventHandler | undefined;
//         if (existingEventsAction) {
//             return existingEventsAction;
//         }

//         // Fall back to the default creation logic using the tag name
//         return super.create(element);
//     }

//     /**
//      * Validates whether the instance is a valid `IDirectiveEventHandler`.
//      * 
//      * @param instance - The instance to validate.
//      * @returns True if the instance is valid.
//      */
//     protected isValidInstance(instance: IDirectiveEventHandler): boolean {
//         return !!instance && typeof instance.setupEventHandlers === 'function';
//     }

//     protected createDefaultFallback(): IDirectiveEventHandler {
//         return new StandardHtmlTagEventDirectiveAction();
//     }
// }


// /**
//  * Abstract base class for Fivase-related directives.
//  * 
//  * Subclasses define the directive name, like "validate" or "validationErrors",
//  * and all take the value of a ValueHostName, which identifies the input
//  * whose validation state is being used. 
//  * Its up to the subclass to determine how to modify the UI and consume the validation state
//  * or ValueHost values.
//  *
//  * Key functionality includes:
//  * - Resolving the target HTML element based on the `fivase-target` input.
//  * - Can inherit the valueHostName from a ValueHostNameDirective applied to a containing tag.
//  *   In that case, this directive does not need anything assigned to it.
//  * 
//  * ### [fivase-target]
//  * This optional input allows the directive to target a specific element within a component's template 
//  * where this directive will do its work. If not provided, the directive will use the host element.
//  * 
//  * Every implementation requires it to be assigned to a Jivs `ValueHostName` for the validation system to associate 
//  * it with the appropriate form control.
//  * ```ts
//  * <tag [validate]="valueHostName">
//  * ```
//  */
// @Directive()
// export abstract class FivaseDirectiveBase implements OnInit, OnDestroy {
//     /**
//      * The internal property that will be used in the directive to manage
//      * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
//      * which form field is being represented for validation.
//      * 
//      * This property is defined in the base class but must be overridden
//      * in the subclass using the `@Input()` decorator to assign it a formal
//      * input name (e.g., 'validate', 'validationErrors', etc.).
//      * 
//      * This allows the directive to either take a value directly via input or 
//      * inherit it from a parent `ValueHostNameDirective`.
//      */
//     @Input() valueHostName: string | undefined;

//     /**
//      * Input to support finding a specific host element for the directive action.
//      * This input can be passed as a string or an object, where:
//      * - A string can be a CSS selector or a template reference.
//      * - An object can specify either a selector or a template reference.
//      */
//     @Input('fivase-target') target: string | { selector?: string } | undefined;

//     constructor(
//         protected el: ElementRef,
//         protected renderer: Renderer2,
//         protected fivaseValidationManager: FivaseValidationManager,
//         @Optional() @SkipSelf() private valueHostNameDirective: ValueHostNameDirective,
//     ) {
//     }

//     ngOnInit(): void {
//         this.setupDirective(this.resolveValueHostName());
//     }

//     /**
//     * Provide Directive-specific setup during the ngOnInit phase, such as 
//     * subscribing to events or creating the initial visual content.
//     */
//     protected abstract setupDirective(valueHostName: string): void;

//     /**
//     * ValueHostName is required and comes from the valueHostName property if already assigned,
//     * or looks for a containing ValueHostNameDirective to get it.
//     * Throws error if neither have supplied it.
//     */
//     protected resolveValueHostName(): string {
//         let valueHostName = this.valueHostName;
//         // Inherit valueHostName from ValueHostNameDirective if not provided via @Input()
//         if (!valueHostName && this.valueHostNameDirective) {
//             valueHostName = this.valueHostNameDirective.valueHostName;
//         }

//         if (!valueHostName)
//             throw new Error('valueHostName is required and cannot be null or empty for FivaseDirectiveBase.');

//         return valueHostName;
//     }

//     /**
//      * Resolves the target HTML element based on the `target` input.
//      * If a CSS selector is provided, it will be used to query for the target element.
//      * If no selector is provided, the host element will be returned.
//      * 
//      * @returns The resolved HTML element to which the directive applies.
//      */
//     protected getTargetElement(): HTMLElement {
//         const targetOptions = typeof this.target === 'string'
//             ? { selector: this.target }
//             : this.target;

//         if (targetOptions?.selector) {
//             const element = this.el.nativeElement.querySelector(targetOptions.selector);
//             if (element) {
//                 return element;
//             } else {
//                 throw new Error(`Selector ${targetOptions.selector} did not match any elements.`);
//             }
//         }

//         return this.el.nativeElement;
//     }

//     ngOnDestroy(): void {
//         // not required but good form
//         (this.el as any) = undefined;
//         (this.fivaseValidationManager as any) = undefined;
//         (this.valueHostNameDirective as any) = undefined;
//     }

// }


// /**
//  * Abstract base class for Fivase Directives that observe validation state changes
//  * on a ValueHost and uses an implementation of `IDirectiveRenderer` to 
//  * update the user interface based on the state.
//  *  *
//  * Key functionality includes:
//  * - Subscribing to validation state changes via the `FivaseValidationManager`.
//  * - Applying a render through an object that supports `IPRenderDirectiveAction`, which
//  *   comes by default from `InputRenderDirectiveActionFactory`.
//  * 
//  * ### [fivase-target]
//  * This optional input allows the directive to target a specific element within a component's template 
//  * where this directive will do its work. If not provided, the directive will use the host element.
//  * 
//  * ### [fivase-render]
//  * Use to select the custom implementation of IDirectiveRenderer, instead of using the Factory.
//  * It takes the class name of the desired IDirectiveRenderer object.
//  * 
//  * Every implementation requires it to be assigned to a Jivs `ValueHostName` for the validation system to associate 
//  * it with the appropriate form control.
//  * ```ts
//  * <tag [validate]="valueHostName">
//  * ```
//  */
// @Directive()
// export abstract class RenderDirectiveBase extends FivaseDirectiveBase {

//     /**
//      * Input to support custom render logic by passing a class directly.
//      * The user can pass an `IDirectiveRenderer` class to this input, which will be instantiated
//      * and used for handling validation render (e.g., applying CSS classes, showing error messages).
//      */
//     //!!! Consider supporting both class and instance, perhaps a callback function to create the instance?
//     @Input('fivase-render') renderClass: undefined | (new () => IDirectiveRenderer);

//     private subscription: Subscription | null = null;
//     protected presenter: IDirectiveRenderer | null = null;

//     constructor(
//         el: ElementRef,
//         renderer: Renderer2,
//         fivaseValidationManager: FivaseValidationManager,
//         @Optional() @SkipSelf() valueHostNameDirective: ValueHostNameDirective,
//         private presenterFactory: PresenterDirectiveActionFactoryBase
//     ) {
//         super(el, renderer, fivaseValidationManager, valueHostNameDirective);
//     }

//     /**
//      * Establishes the PresentionDirectiveAction implementation from either the [fivase-render] input or the Factory.
//      * Establishes a subscription to the validation state changes for the ValueHost.
//      * @param valueHostName 
//      */
//     protected setupDirective(valueHostName: string): void {
//         this.presenter = this.renderClass
//             ? new this.renderClass()
//             : this.presenterFactory.create(this.el.nativeElement);
//         if (!this.presenter)
//             throw new Error('No presenter was created for the directive.');
//         this.setupSubscription(valueHostName);
//         this.setupInitialRender(valueHostName);
//     }

//     /**
//      * Uses the FivaseValidationManager to subscribe to validation state changes for the ValueHost.
//      * Passes the validation state to the IDirectiveRenderer implementation.
//      * @param valueHostName 
//      */
//     private setupSubscription(valueHostName: string): void {
//         this.subscription = this.fivaseValidationManager.subscribeToValueHostValidationState(valueHostName, (validationState) => {
//             this.onValueHostValidationStateChanged(this.getTargetElement(), validationState);
//         });
//     }

//     /**
//      * Ensures the UI conforms with the current validation state
//      */
//     protected setupInitialRender(valueHostName: string): void {
//         let vh = this.fivaseValidationManager.validationManager.getValidatorsValueHost(valueHostName)!;
//         if (!vh)
//             throw new Error(`Unknown valueHostName "${valueHostName}"`);
//         this.onValueHostValidationStateChanged(this.getTargetElement(), vh.currentValidationState);
//     }

//     /**
//      * Handles the render of a validation state change on a ValueHost.
//      * 
//      * This method applies validation render using the `IDirectiveRenderer`.
//      * 
//      * @param targetElement - The resolved HTML element to apply the render to.
//      * @param validationState - The current validation state of the ValueHost.
//      */
//     protected onValueHostValidationStateChanged(targetElement: HTMLElement, validationState: ValueHostValidationState): void {
//         this.presenter!.renderForFivaseDirective(
//             targetElement,
//             this.renderer,
//             this.valueHostName!,
//             validationState,
//             this.fivaseValidationManager,
//             this.getRenderOptions()
//         );
//     }

//     /**
//      * Utility to add or remove the data-severity attribute on the targetElement. This attribute indicates
//      * the highest severity of the issues found in the validation state when present. Its values are 'error', 'severe', or 'warn'.
//      * @param targetElement 
//      * @param validationState 
//      */
//     protected severityAttribute(targetElement: HTMLElement, validationState: ValueHostValidationState): void {
//         const issuesFound = validationState.issuesFound;
//         const isValid = !issuesFound || issuesFound.length === 0;   // instead of checking doNotSave, which will be false if there are warning issues that we want to display

//         if (isValid) {
//             this.renderer.removeAttribute(targetElement, 'data-severity');
//         } else {
//             // find the highest severity and set it as data-severity
//             let highestSeverity = issuesFound.reduce((highest, issue) => issue.severity > highest ? issue.severity : highest, ValidationSeverity.Warning);
//             this.renderer.setAttribute(targetElement, 'data-severity', ValidationSeverity[highestSeverity].toLowerCase());
//         }
//     }
//     /**
//      * Returns the options for validation render. 
//      * Subclasses can override this method to provide options such as CSS classes or other attributes.
//      * 
//      * @returns An object with configuration options for validation render.
//      */
//     protected getRenderOptions(): { [key: string]: string | number | boolean } {
//         return {};
//     }

//     /**
//      * Cleans up by unsubscribing from validation state changes when the directive is destroyed.
//      */
//     public ngOnDestroy(): void {
//         if (this.subscription) {
//             this.fivaseValidationManager.unsubscribeFromValueHostValidationState(this.subscription);
//             (this.subscription as any) = undefined;
//         }
//         // not required but good form
//         (this.presenter as any) = undefined;
//         (this.presenterFactory as any) = undefined;

//         super.ngOnDestroy();
//     }
// }

// /**
//  * Directive `validate` manages how an input element interacts with Fivase.
//  * It must supply the value to be validated to ValidationManager and update the 
//  * UI to show any validation state changes.
//  * 
//  * 'validate' takes the value of the ValueHostName registered with Jivs ValidationManager.
//  *
//  * ### [fivase-target]
//  * This optional input allows the directive to target a specific element within a component's template 
//  * where this directive will do its work. If not provided, the directive will use the host element.
//  * 
//  * ### [fivase-render]
//  * Use to select the custom implementation of IDirectiveRenderer, instead of using the Factory.
//  * It takes the class name of the desired IDirectiveRenderer object.
//  * 
//  * ### [fivase-eventHandler]
//  * Use to select the custom implementation of IDirectiveEventHandler, instead of using the Factory.
//  * It takes the class name of the desired IDirectiveEventHandler object.
//  * 
//  * Example usage:
//  * ```html
//  * <input validate="username"></input>
//  * ```
//  */
// @Directive({
//     selector: '[validate]'
// })
// export class ValidateInputDirective extends RenderDirectiveBase {

//     /**
//      * The internal property that will be used in the directive to manage
//      * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
//      * which form field is being represented for validation.
//      * 
//      * This allows the directive to either take a value directly via input or 
//      * inherit it from a parent `ValueHostNameDirective`.
//      */

//     @Input('validate') valueHostName: string | undefined;

//     /**
//      * CSS class applied when validation fails (invalid state).
//      * Passed along to the IDirectiveRenderer implementation.
//      */
//     @Input('invalid-class') invalidCssClass: string = 'input-invalid';

//     /**
//      * CSS class applied when validation succeeds (valid state).
//      * Passed along to the IDirectiveRenderer implementation.
//      */
//     @Input('valid-class') validCssClass: string = 'input-valid';

//     /**
//      * Input to support custom event handler logic by passing a class directly.
//      * The user can pass an `IDirectiveEventHandler` class to this input, which will be instantiated
//      * and used for handling event-related validation logic (e.g., triggering validation on specific events).
//      */
//     //!!! Consider supporting both class and instance, perhaps a callback function to create the instance?
//     @Input('fivase-eventHandler') eventHandlerClass: undefined | (new () => IDirectiveEventHandler);

//     constructor(
//         el: ElementRef,
//         renderer: Renderer2,
//         fivaseValidationManager: FivaseValidationManager,
//         valueHostNameDirective: ValueHostNameDirective,
//         private eventsFactory: EventsDirectiveActionFactory,
//         inputPresenterFactory: InputRenderDirectiveActionFactory
//     ) {
//         super(el, renderer, fivaseValidationManager, valueHostNameDirective, inputPresenterFactory);
//     }

//     /**
//      * resolves the IDirectiveEventHandler implementation from either the [fivase-eventHandler] input or the Factory.
//      * Has the event handler setup the input events to deliver the input value to the ValidationManager.
//      * @param valueHostName 
//      */
//     protected setupDirective(valueHostName: string): void {
//         let eventHandler = this.eventHandlerClass ?
//             new this.eventHandlerClass() :
//             this.eventsFactory.create(this.el.nativeElement);
//         if (!eventHandler)
//             throw new Error('No event handler was created for the directive.');

//         eventHandler.setupEventHandlers(
//             this.getTargetElement(),
//             this.renderer,
//             valueHostName,
//             this.fivaseValidationManager
//         );
//     }

//     /**
//      * Override to manage the data-invalid attribute based on validation issues.
//      * This method sets or removes the 'data-invalid' and 'data-severity' attributes based on whether 
//      * validation issues are found.
//      * The data-invalid attribute is used by ContainsInvalidChildrenDirective to find invalid children.
//      * 
//      * NOTE: While its possible to combine data-severity into data-invalid as a single attribute,
//      * we want to use data-severity in other cases, whereas data-invalid is specific to the input, so you can find the input.
//      */
//     protected onValueHostValidationStateChanged(targetElement: HTMLElement, validationState: ValueHostValidationState): void {
//         const issuesFound = validationState.issuesFound;
//         const isValid = !issuesFound || issuesFound.length === 0;   // instead of checking doNotSave, which will be false if there are warning issues that we want to display

//         if (isValid) {
//             this.renderer.removeAttribute(targetElement, 'data-invalid');
//         } else {
//             this.renderer.setAttribute(targetElement, 'data-invalid', 'true');
//         }
//         this.severityAttribute(targetElement, validationState);

//         // Call the base class to handle render
//         super.onValueHostValidationStateChanged(targetElement, validationState);
//     }

//     /**
//      * Override the method to pass the valid and invalid CSS classes to the render.
//      * 
//      * @returns An object containing the valid and invalid CSS classes.
//      */
//     protected getRenderOptions(): { [key: string]: string | number | boolean } {
//         return {
//             invalidCssClass: this.invalidCssClass,
//             validCssClass: this.validCssClass
//         };
//     }
// }

// /**
//  * Directive `validationErrors` manages the display of validation error messages for a single
//  * input. While its target element can be used as the entire error message container, it is
//  * typically used to target a specific element within a component designed to show error messages.
//  * That component often has other parts, like icons or other text, that are not part of the error message.
//  * 
//  * 'validationErrors' takes the value of the ValueHostName registered with Jivs ValidationManager.
//  *
//  * ### [fivase-target]
//  * This optional input allows the directive to target a specific element within a component's template 
//  * where this directive will do its work. If not provided, the directive will use the host element.
//  * 
//  * ### [fivase-render]
//  * Use to select the custom implementation of IDirectiveRenderer, instead of using the Factory.
//  * It takes the class name of the desired IDirectiveRenderer object.
//  * 
//  * Example usage:
//  * ```html
//  * <div [validationErrors]="valueHostName"></div>
//  * ```
//  * ```html
//  * \\ a component called "errorMessages" that includes icons and other text, plus uses this for the error messages:
//  * <div [showWhenInvalid]="valueHostName">
//  *  <div>
//  *      <img src="error-icon.png" />
//  *      <span>Errors are listed:</span>
//  *  </div>
//  *  <div [validationErrors]="valueHostName"></div>
//  * </div>
//  * ```
//  */

// @Directive({
//     selector: '[validationErrors]',
// })
// export class ValidationErrorsDirective extends RenderDirectiveBase {
//     /**
//      * The internal property that will be used in the directive to manage
//      * the name of the value host. The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
//      * which form field is being represented for validation.
//      * 
//      * This allows the directive to either take a value directly via input or 
//      * inherit it from a parent `ValueHostNameDirective`.
//      */
//     @Input('validationErrors') valueHostName: string | undefined;
//     /**
//      * CSS class applied when validation fails (invalid state).
//      * Passed along to the IDirectiveRenderer implementation.
  
//      */
//     @Input('invalid-class') invalidCssClass: string = 'error-invalid';

//     /**
//      * CSS class applied when validation succeeds (valid state).
//      * Passed along to the IDirectiveRenderer implementation.
//      */
//     @Input('valid-class') validCssClass: string = 'error-valid';

//     constructor(
//         el: ElementRef,
//         renderer: Renderer2,
//         fivaseValidationManager: FivaseValidationManager,
//         valueHostNameDirective: ValueHostNameDirective,
//         errorPresenterFactory: ErrorMessagesRenderDirectiveActionFactory
//     ) {
//         super(el, renderer, fivaseValidationManager, valueHostNameDirective, errorPresenterFactory);
//     }
//     /**
//      * Supplies valid and invalid CSS classes to the render.
//      * 
//      * @returns An object containing the valid and invalid CSS classes.
//      */
//     protected getRenderOptions(): { [key: string]: string | number | boolean } {
//         return {
//             invalidCssClass: this.invalidCssClass,
//             validCssClass: this.validCssClass
//         };
//     }
// }

// /**
//  * Directive `containsInvalid` manages the appearance of a containing tag, like <div>,
//  * that contains inputs. It applies a CSS class to the container based on whether any child elements are invalid.
//  * 
//  * ### [invalid-class]
//  * CSS class applied when any child element is invalid. If an empty string is provided, no class will be applied.
//  * Default is 'invalidChildren'.
//  * 
//  * ### [valid-class]
//  * CSS class applied when all child elements are valid. If an empty string is provided, no class will be applied.
//  * Default is ''.
//  * 
//  * Example usage:
//  * ```html
//  * <div containsInvalid [invalid-class]="container-invalid" [valid-class]="container-valid">
//  *   <input validate="username" />
//  * </div>
//  * ```
//  */
// @Directive({
//     selector: '[containsInvalid]'
// })
// export class ContainsInvalidChildrenDirective {
//     /**
//      * CSS class applied when any child element is invalid.
//      * An empty string means no class will be applied.
//      * Defaults to 'invalidChildren'.
//      */
//     @Input('invalid-class') invalidCssClass: string = 'invalidChildren';

//     /**
//      * CSS class applied when all child elements are valid.
//      * An empty string means no class will be applied.
//      */
//     @Input('valid-class') validCssClass: string = '';

//     private subscription: Subscription | null = null;

//     constructor(
//         private el: ElementRef,
//         private renderer: Renderer2,
//         private fivaseValidationManager: FivaseValidationManager
//     ) { }

//     ngOnInit(): void {
//         this.subscription = this.fivaseValidationManager.subscribeToValidationState(() => {
//             this.checkChildValidation();
//         });
//     }

//     ngOnDestroy(): void {
//         if (this.subscription) {
//             this.subscription.unsubscribe();
//             this.subscription = null;
//         }
//     }

//     /**
//      * Checks child elements of the container to see if any are invalid.
//      * Ingnores those that are hidden.
//      */
//     private checkChildValidation(): void {
//         let elements = (this.el.nativeElement as HTMLElement).querySelectorAll('[data-invalid="true"]:not([hidden])');
//         // remove hidden elements that were not using 'hidden' attribute.
//         const invalidElements = Array.from(elements)
//             .filter((el: Element) => (el as HTMLElement).offsetParent !== null);

//         if (invalidElements.length > 0) {
//             changeCssClasses(this.validCssClass, this.invalidCssClass, this.el.nativeElement, this.renderer);
//         } else {
//             changeCssClasses(this.invalidCssClass, this.validCssClass, this.el.nativeElement, this.renderer);
//         }
//     }
// }

// /**
//  * The `ValueHostNameDirective` is used to define a `valueHostName` that can be inherited by 
//  * child directives within a component hierarchy. This simplifies the management of validation 
//  * across multiple form fields by allowing child directives to automatically reference the 
//  * same `valueHostName`.
//  * 
//  * The `valueHostName` is part of the Jivs validation system and allows Jivs to identify 
//  * which form field is being represented for validation.
//  * 
//  * When applied, this directive makes the `valueHostName` available to child directives 
//  * via Angular's dependency injection system. Child directives, such as `[validate]`, 
//  * can either use the provided `valueHostName` or supply their own if needed.
//  * 
//  * Example usage:
//  * ```html
//  * <div [valueHostName]="'FirstName'">
//  *   <input validate></input>
//  *   <div validationErrors></div>
//  * </div>
//  * ```
//  * 
//  * In this example, the `valueHostName` of `FirstName` is inherited by the child directives 
//  * `[validate]` and `[validationErrors]`, allowing them to use the same validation target.
//  */
// @Directive({
//     selector: '[valueHostName]'
// })
// export class ValueHostNameDirective {
//     /**
//      * The valueHostName will be provided to child directives through Angular's DI system.
//      * Any directive that depends on valueHostName (e.g., ChildDirective) can inject it 
//      * automatically, as this directive is registered in the element's injector.
//      */
//     @Input('valueHostName') valueHostName!: string;

//     constructor() {
//         // Optional: Initialization logic, if needed
//     }
// }

// /**
//  * Interface for a service responsible for managing ValidationManagerConfigs and states of the ValidationManager + ValueHost objects.
//  */
// export interface IFivaseConfigHost {
//     getConfig(formId: string): ValidationManagerConfig;

//     // Register a configuration for a formId
//     register(formId: string, config: ValidationManagerConfig | ((formId: string) => ValidationManagerConfig)): void;
// }


// /**
//  * Interface for managing the lifecycle and behavior of a `ValidationManager` in Angular.
//  * Provides methods for validating forms, setting values, and managing subscriptions to validation state changes.
//  *
//  * Provides an abstraction over `ValidationManager`, making it easier to manage form validation in Angular applications. 
//  * Ensures that the core validation logic can be integrated seamlessly into Angular’s dependency injection and lifecycle.
//  *
//  * Used by directives and components to trigger validation, retrieve validation state, and manage input values.
//  */
// export interface IFivaseValidationManager {
//     validate(options?: any): ValidationState;
//     setValue(valueHostName: string, value: any, options?: SetValueOptions): void;
//     setInputValue(valueHostName: string, inputValue: string, options?: SetInputValueOptions): void;

//     subscribeToValidationState(callback: (state: ValidationState) => void): Subscription;
//     unsubscribeFromValidationState(subscription: Subscription): void;

//     subscribeToValueHostValidationState(valueHostName: string, callback: (state: ValueHostValidationState) => void): Subscription;
//     unsubscribeFromValueHostValidationState(subscription: Subscription): void;

//     destroy(): void;

//     readonly validationManager: IValidationManager;
// }


// /**
//  * The Fivase validation manager service.
//  * Manages validation logic in Angular using the underlying ValidationManager from Jivs.
//  * Handles state changes, value updates, validation subscriptions, and destruction of the manager.
//  *
//  * Integrates the core Jivs ValidationManager into Angular, allowing form validation and state management in Angular components.
//  *
//  * Used by directives to trigger validation, manage input values, and handle state subscriptions for forms.
//  */
// export class FivaseValidationManager implements IFivaseValidationManager {
//     private _validationManager: IValidationManager;
//     /**
//      * ValidationManager level validation state changes
//      */
//     private _validationStateSubject = new BehaviorSubject<ValidationState>({
//         isValid: true,
//         doNotSave: false,
//         issuesFound: null,
//         asyncProcessing: false
//     });
//     /**
//      * Individual ValueHost level validation state changes
//      */
//     private _valueHostValidationStateSubject = new BehaviorSubject<{ valueHostName: string, validationState: ValueHostValidationState }>({
//         valueHostName: '',
//         validationState: {
//             isValid: true,
//             status: ValidationStatus.NotAttempted,
//             doNotSave: false,
//             issuesFound: null,
//             corrected: false,
//             asyncProcessing: false
//         }
//     });

//     constructor(config: ValidationManagerConfig) {
//         this._validationManager = new ValidationManager(config);

//         config.onValidationStateChanged = (validationManager: IValidationManager, validationState: ValidationState) => {
//             this._validationStateSubject.next(validationState);
//         };
//         config.onValueHostValidationStateChanged = (valueHost: IValueHost, validationState: ValueHostValidationState) => {
//             this._valueHostValidationStateSubject.next({ valueHostName: valueHost.getName(), validationState });
//         };
//     }

//     public get validationManager(): IValidationManager {
//         return this._validationManager;
//     }

//     public validate(options?: any): ValidationState {
//         return this._validationManager.validate(options);
//     }

//     public setValue(valueHostName: string, value: any, options?: SetValueOptions): void {
//         this._validationManager.vh.input(valueHostName).setValue(value, options);
//     }

//     public setInputValue(valueHostName: string, inputValue: string, options?: SetInputValueOptions): void {
//         this._validationManager.vh.input(valueHostName).setInputValue(inputValue, options);
//     }

//     public subscribeToValidationState(callback: (state: ValidationState) => void): Subscription {
//         return this._validationStateSubject.subscribe(callback);
//     }

//     public unsubscribeFromValidationState(subscription: Subscription): void {
//         subscription.unsubscribe();
//     }

//     public subscribeToValueHostValidationState(valueHostName: string, callback: (state: ValueHostValidationState) => void): Subscription {
//         return this._valueHostValidationStateSubject
//             .pipe(filter(forCallback => forCallback.valueHostName === valueHostName))
//             .subscribe(event => callback(event.validationState));
//     }

//     public unsubscribeFromValueHostValidationState(subscription: Subscription): void {
//         subscription.unsubscribe();
//     }

//     public destroy(): void {
//         this._validationManager.dispose();
//         this._validationStateSubject.complete();
//         this._valueHostValidationStateSubject.complete();
//     }
// }

// /**
//  * In Jivs, each Form must have a configuration found in ValidationManagerConfig to setup a ValidationManager.
//  * This configuration includes the ValueHosts, Validators, and other settings for the form.
//  * FivaseConfigHost is an Angular service where the configurations are stored during setup and retrieved
//  * when a form is being created.
//  * 
//  * ValidationManager and its ValueHosts have a state that should be saved and restored across sessions.
//  * This service uses an implementation of IFivaseStateStore to persist form states across sessions.
//  * Each form has 2 states: instanceState and valueHostInstanceStates. They are stored with these keys:
//  * - instanceState: formId
//  * - valueHostInstanceStates: formId + '|ValueHosts' (all ValueHosts are in the same key)
//  * 
//  * As a result, every form must have a unique formId, used to register the configuration and save the state.
//  * 
//  * Use register() to store the configuration for a formId and getConfig() to retrieve the configuration.
//  * getConfig() will supply several parts to the ValidationManagerConfig:
//  * - The ValueHostConfigs array, which is the ValueHost configuration for the form.
//  * - The savedInstanceState, which is the state of the ValidationManager in the session.
//  * - The savedValueHostInstanceStates, which is the state of each ValueHost in the session.
//  * - The onInstanceStateChanged and onValueHostInstanceStateChanged callbacks, which are used to save the state.
//  *   You can also use these callbacks to handle the state changes in the application, as yours will be called
//  *   after this class saves the state.
//  */
// export class FivaseConfigHost implements IFivaseConfigHost {
//     private configs: Map<string, ValidationManagerConfig | ((formId: string) => ValidationManagerConfig)> = new Map();

//     constructor(private stateStore: IFivaseStateStore) { }

//     // Retrieve the configuration for a specific formId
//     public getConfig(formId: string): ValidationManagerConfig {
//         const configOrFactory = this.configs.get(formId);

//         if (!configOrFactory) {
//             throw new Error(`No configuration found for formId: ${formId}`);
//         }

//         // Get the config either directly or by calling the factory function
//         const config = typeof configOrFactory === 'function'
//             ? (configOrFactory as (formId: string) => ValidationManagerConfig)(formId)
//             : configOrFactory;
//         let valueHostKey = `${formId}|ValueHosts`;

//         // Retrieve any saved state for this formId
//         const savedInstanceState = this.stateStore.getState(formId);
//         const savedValueHostInstanceStates = this.stateStore.getState(valueHostKey);

//         // Assign the callbacks, preserving any that were already present in the config
//         return {
//             ...config,  // do not modify the original config
//             savedInstanceState: savedInstanceState ?? config.savedInstanceState ?? null,
//             savedValueHostInstanceStates: savedValueHostInstanceStates ?? config.savedValueHostInstanceStates ?? null,
//             onInstanceStateChanged: (valueHostsManager, state) => {
//                 this.saveState(formId, state);
//                 if (config.onInstanceStateChanged) {  // Call the original callback if it exists
//                     config.onInstanceStateChanged(valueHostsManager, state);
//                 }
//             },
//             onValueHostInstanceStateChanged: (valueHost, state) => {
//                 this.saveState(valueHostKey, state);
//                 if (config.onValueHostInstanceStateChanged) {  // Call the original callback if it exists
//                     config.onValueHostInstanceStateChanged(valueHost, state);
//                 }
//             }
//         };
//     }

//     // Register a configuration for a formId
//     public register(formId: string, config: ValidationManagerConfig | ((formId: string) => ValidationManagerConfig)): void {
//         this.configs.set(formId, config);
//     }

//     // Save the state of the form validation (used for persisting state)
//     protected saveState(formId: string, state: any): void {
//         this.stateStore.saveState(formId, state);
//     }
// }

// /**
//  * Interface responsible for storing and retrieving any state from Fivase, 
//  * allowing validation progress to be saved across sessions or page reloads.
//  * Required by FivaseConfigHost to save and retrieve the state of the ValidationManager and ValueHosts.
//  *
//  * Provides an abstraction for state management, allowing different implementations (e.g., local storage, Redux, or other state management libraries) 
//  * to be used without altering the core validation logic. This flexibility ensures the validation system can work with various state management approaches.
//  *
//  * Implemented by services like `InMemoryFivaseStateStore` to save and retrieve validation states for forms.
//  */
// export interface IFivaseStateStore {
//     getState(key: string): any;
//     saveState(key: string, state: any): void;
// }

// /**
//  * A simple implementation of `IFivaseStateStore` using an in-memory map to store state.
//  */
// export class InMemoryFivaseStateStore implements IFivaseStateStore {
//     private stateMap: Map<string, any> = new Map();

//     getState(key: string): any {
//         return this.stateMap.get(key);
//     }

//     saveState(key: string, state: any): void {
//         this.stateMap.set(key, state);
//     }
// }

// /**
//  * Custom property name used to store the event handler directive action on an HTML element.
//  */
// export const FIVASE_EVENT_HANDLER_PROPERTY = 'fivaseeventhandler';
// /**
//  * Custom property name used to store the render directive action on an HTML element.
//  */
// export const FIVASE_PRESENTATION_PROPERTY = 'fivaserender';

// /**
//  * Attaches event and render directive actions to the given DOM element.
//  * 
//  * This function binds the provided directive action instances to the native element by
//  * assigning them to custom properties ('fivaseeventhandler' and 'fivaserender') on the element.
//  *
//  * @param element - The DOM element where the directive actions will be attached.
//  * @param eventsAction - An instance of IDirectiveEventHandler, or null if not applicable.
//  * @param renderAction - An instance of IDirectiveRenderer, or null if not applicable.
//  */
// export function attachDirectiveActionsToElement(
//     element: HTMLElement,
//     eventsAction: IDirectiveEventHandler | null,
//     renderAction: IDirectiveRenderer | null
// ): void {
//     if (eventsAction) {
//         (element as any)[FIVASE_EVENT_HANDLER_PROPERTY] = eventsAction;
//     }
//     if (renderAction) {
//         (element as any)[FIVASE_PRESENTATION_PROPERTY] = renderAction;
//     }
// }

// /**
//  * Cleans up the event and render directive actions from the given DOM element.
//  * 
//  * This function removes the directive actions from the native element and calls the `destroy()`
//  * method on each directive action, if it exists, to handle proper resource cleanup.
//  *
//  * @param element - The DOM element where the directive actions will be cleaned up.
//  */
// export function cleanupDirectiveActionsFromElement(element: HTMLElement): void {
//     const eventsAction = (element as any)[FIVASE_EVENT_HANDLER_PROPERTY];
//     if (eventsAction && 'destroy' in eventsAction) {
//         (eventsAction as IDestroyable).destroy();
//     }

//     const renderAction = (element as any)[FIVASE_PRESENTATION_PROPERTY];
//     if (renderAction && 'destroy' in renderAction) {
//         (renderAction as IDestroyable).destroy();
//     }

//     delete (element as any)[FIVASE_EVENT_HANDLER_PROPERTY];
//     delete (element as any)[FIVASE_PRESENTATION_PROPERTY];
// }

// /**
//  * Interface to let some classes - including DirectiveActions - clean up resources when they are no longer needed.
//  */
// export interface IDestroyable {
//     destroy(): void;
// }