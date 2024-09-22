# Documentation for using [fivase-target]

### **Using `[fivase-target]` to Expand the Reach of Jivs' Directives**

The `[fivase-target]` attribute provides flexibility in specifying the target element for `DirectiveActions` like `validate`, `validationErrors`, and `containsInvalid`. It allows for more precise control when the target element differs from the default `ElementRef` or when complex selections are required.

This document covers common use cases for `[fivase-target]` and how to apply it effectively, using strong string forms and avoiding potential issues with duplicate `id` values by leveraging the `name` attribute.

---

### **Use Case 1: Using a CSS Selector to Target an Element**

When the directive is applied to a container, but you want to target a specific form element inside (e.g., `input`, `select`, or `textarea`), you can use a CSS selector with `[fivase-target]` to specify the correct element by its `name` attribute.

#### Example:

**Component Template (email-form.component.html):**

```html
<!-- Inside the email-form component template -->
<div>
  <label for="emailInput">Email:</label>
  <input name="emailInput" />
</div>
```
### **Parent Component (app.component.html):**
```html
<!-- Applying the validate directive to the custom email-form component and using target -->
<email-form validate="email" [fivase-target]="'[name=emailInput]'"></email-form>
... or ...
<email-form validate="email" target="[name=emailInput]"></email-form>

```
In this example:

- The `validate` directive is applied to the email-form component.
- The `[fivase-target]` attribute is used to target the input element inside the email-form component's template by using the name attribute (`[name=emailInput]`).

---

### **Use Case 2: Using a Template Reference to Target an Element**

In scenarios where the target element is defined using Angular's template reference (e.g., `#usernameRef`), `[fivase-target]` can use that reference to point the directive to the correct element.

#### Example:

**Component Template (email-form.component.html):**

```html
<!-- Inside the email-form component template -->
<div>
  <label for="email">Email:</label>
  <input #emailRef name="email" />
</div>
```
**Parent Component (app.component.html):**

```html
<!-- Applying the validate directive to the custom email-form component and using target with a template reference -->
<email-form validate="email" [fivase-target]="'emailRef'"></email-form>
... or ...
<email-form validate="email" target="emailRef"></email-form>

```

In this example:

- The `validate` directive is applied to the email-form component.
- The `[fivase-target]` attribute uses the emailRef template reference to target the input element inside the email-form component's template.

---

### **Use Case 3: Targeting a Specific Element Among Multiple Hidden Inputs in a Component**

For components that store multiple hidden inputs, such as a calendar or form, `[fivase-target]` can target a specific input to retrieve or interact with its value using the `name` attribute.

#### Example:

**Component Template (date-range.component.html):**

```html
<!-- Inside the date-range component template -->
<div>
  <input type="hidden" name="startDate" value="2024-01-01" />
  <input type="hidden" name="currentDate" value="2024-09-15" />
  <input type="hidden" name="endDate" value="2024-12-31" />
</div>
```
**Parent Component (app.component.html):**

```html
<!-- Applying the validate directive to the custom date-range component and using target to target currentDate -->
<date-range validate="selectedDate" [fivase-target]="'[name=currentDate]'"></date-range>
... or ...
<date-range validate="selectedDate" target="[name=currentDate]"></date-range>
```

In this example:

- The `validate` directive is applied to the date-range component.
- The `[fivase-target]` attribute is used to target the input element with the `[name=currentDate]` attribute inside the date-range component's template.

---

### **Advanced Use Cases Requiring Interface Implementation and Factory Registration**

In some scenarios, `[fivase-target]` may not provide enough control, particularly when custom event handling or complex logic is required. In these cases, developers can extend the existing `IEventsDirectiveAction` or `IPresentationDirectiveAction` implementations by registering custom actions with the appropriate factory. This ensures that your directive actions remain modular and reusable.

#### Example of a Custom `IEventsDirectiveAction`:

```ts
export class CustomEventsDirectiveAction implements IEventsDirectiveAction {
    public setupEventHandlers(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseValidationManager: FivaseValidationManager
		)
	{
    // Custom event handling logic
    el.renderer.listen(element, 'change', (event: Event)=> {
      // Handle event, e.g., update validationManager with the new value
	  const inputValue = (event.target as HTMLInputElement).value;
	  fivaseValidationManager.setInputValue(valueHostName, inputValue, { validate: true, 	
		duringEdit: true });	  
    });
  }
}
```
### **Registering the Custom DirectiveAction in the Factory via `@NgModule`**

Your project’s design follows an approach where `EventsDirectiveActionFactory` and related factories are singletons defined in the `@NgModule` provider list. Custom actions, such as `CustomEventsDirectiveAction`, are registered in the module’s constructor to ensure they are available throughout the application.

```typescript
@NgModule({
  declarations: [AppComponent, UserFormComponent],
  imports: [BrowserModule],
  providers: [
    {
      provide: FivaseConfigHost,
      useFactory: createFivaseConfigHost
    },
    {
      provide: EventsDirectiveActionFactory,
      useClass: EventsDirectiveActionFactory
    },
    {
      provide: InputPresentationDirectiveActionFactory,
      useClass: InputPresentationDirectiveActionFactory
    },
    {
      provide: ErrorPresentationDirectiveActionFactory,
      useClass: ErrorPresentationDirectiveActionFactory
    },
    {
      provide: ContainerPresentationDirectiveActionFactory,
      useClass: ContainerPresentationDirectiveActionFactory
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    private errorPresentationFactory: ErrorPresentationDirectiveActionFactory,
    private eventsFactory: EventsDirectiveActionFactory
  ) {
    // Register the custom error presentation action
    this.errorPresentationFactory.register('MyErrorPresentation', MyErrorPresentation);

    // Register the custom events directive action
    this.eventsFactory.register('CustomEvents', CustomEventsDirectiveAction);
  }
}
```
# Documentation for [fivase-presentation] and [fivase-eventHandler].

## Using `[fivase-presentation]` and the Presentation Factory

When working with form validation, the `IPresentationDirectiveAction` interface controls how validation results are presented. You can supply your custom implementations either through the **PresentationDirectiveActionFactory** (set up in `@NgModule`) or with the `[fivase-presentation]` attribute.

Use the factory for consistent, reusable presentation logic across your application. If you need a one-off custom implementation for a specific input or prefer to handle the presentation logic directly, you can use the `[fivase-presentation]` attribute by passing the class name as the attribute value.

### Example Usage:

```html
<!-- Using a custom presentation class -->
<input 
  validate="username" 
  [fivase-presentation]="CustomPresentationDirectiveAction">
```
In this example, `CustomPresentationDirectiveAction` is a class implementing `IPresentationDirectiveAction`, which provides custom presentation logic for the username field.

## Using `[fivase-eventHandler]` and the Events Factory

The `IEventsDirectiveAction` interface manages how **events on your inputs deliver their values to Jivs**, triggering validation updates. You can supply your custom implementations either through the **EventsDirectiveActionFactory** (set up in `@NgModule`) or with the `[fivase-eventHandler]` attribute.

The factory is suitable for most cases, providing consistent and reusable event handling logic. If you need one-off event handling or direct control over when and how validation is triggered, you can use the `[fivase-eventHandler]` attribute by passing the class name as the attribute value.

### Example Usage:

```html
<!-- Using a custom event handler class -->
<input 
  validate="email" 
  [fivase-eventHandler]="CustomEventsDirectiveAction">
```
In this example, `CustomEventsDirectiveAction` is a class implementing `IEventsDirectiveAction`, ensuring that events on this input deliver their values to Jivs for validation.



# **Using Custom DirectiveActions**

## **Overview**

In this guide, we will explore how to connect Fivase with your own custom components. Your component does not know how to send data to Jivs for validation nor how to take in the validation results to show there are errors. Instead, we have you write DirectiveAction classes to handle those, and connect them to your component.

This approach allows the developer to easily connect validation to the UI without modifying the core logic of the component itself.

---

## **Concepts**

### **DirectiveAction**

A **DirectiveAction** is a class that encapsulates specific behavior, such as handling events or updating the UI presentation based on validation states. There are two types of DirectiveActions used in this guide:
1. **Events DirectiveAction**: Manages user input events (e.g., button clicks) and triggers validation.
2. **Presentation DirectiveAction**: Updates the UI, typically by applying or removing CSS classes, based on the result of the validation.

### **Companion DirectiveActions**

In this use case, the component leverages **companion objects** to handle event and presentation logic. This means:
- The component does not directly implement validation interfaces.
- Instead, it provides companion classes (`QuantitySelectorEventHandler`, `QuantitySelectorValidationPresentation`) to handle validation and UI updates.

---

## **Two Approaches for Using Companion DirectiveActions**

There are two main ways to utilize **Companion DirectiveActions**:

1. **Using Attributes in the Template**:  
   You can declare the directive actions directly within your component's template using the `[fivase-eventHandler]` and `[fivase-presentation]` attributes.
   
   Example:
   ```html
   <app-quantityselector [validate]="quantity" [fivase-eventHandler]="value" [fivase-presentation]="value"></app-quantityselector>
   ```
   
2.  **Using Helper Functions:**
    Alternatively, you can “teach” the component to supply the companion directive actions by defining the directive actions within the component and attaching them to the DOM via helper functions. This approach is discussed in detail below, where we provide examples and explanations.

## **Adding Jivs Support by Example**

Let’s go through the process of implementing the **Companion DirectiveActions** using a **QuantitySelector component** that tracks a `quantity` value.

### Initial Component

We start with a simple component that tracks a `quantity` value and emits changes via an `EventEmitter`. This is the base component, without any connection to validation or presentation logic from Jivs.

```ts
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-quantityselector',
  template: `
    <div>
      <button (click)="decrement()">-</button>
      <span>{{ quantity }}</span>
      <button (click)="increment()">+</button>
    </div>
  `
})
export class QuantitySelector {
  quantity = 0;

  @Output() quantityChange = new EventEmitter<{ oldValue: number, newValue: number }>();

  increment(): void {
    const oldValue = this.quantity;
    this.quantity++;
    this.quantityChange.emit({ oldValue, newValue: this.quantity });
  }

  decrement(): void {
    if (this.quantity > 0) {
      const oldValue = this.quantity;
      this.quantity--;
      this.quantityChange.emit({ oldValue, newValue: this.quantity });
    }
  }
}
```

### Implement IEventsDirectiveAction to handle the emitted event
We need to intercept the quantityChange event and in doing so, pass the value to Jivs.

Supposing we already have an instance of QuantitySelector in this.component, here's the relevant code:
```ts
    setupEventHandlers(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseValidationManager: FivaseValidationManager
    ): void {
    // Subscribe to quantityChange EventEmitter
    this.subscription = this.component.quantityChange.subscribe(({ oldValue, newValue }) => {
      // Trigger validation when the quantity changes
      fivaseValidationManager.setValue(valueHostName, newValue, { validate: true });
    });
  }
```

Here is the full implementation of the **QuantitySelectorEventHandler**.

```ts
import { DirectiveActionBase } from 'your-library-path';
import { IEventsDirectiveAction, FivaseValidationManager } from 'your-library-path';
import { ElementRef, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { QuantitySelector } from './quantityselector';

export class QuantitySelectorEventHandler extends DirectiveActionBase implements IEventsDirectiveAction, IDestroyableDirectiveAction {
  private subscription: Subscription;

  constructor(private component: QuantitySelector) {
    super();
  }

    setupEventHandlers(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseValidationManager: FivaseValidationManager
	): void {
    // Subscribe to quantityChange EventEmitter
    this.subscription = this.component.quantityChange.subscribe(({ oldValue, newValue }) => {
      // Trigger validation when the quantity changes
      fivaseValidationManager.setValue(valueHostName, newValue, { validate: true });
    });
  }

  destroy(): void {
    // Cleanup subscription to avoid memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
```

### Implement IPresentationDirectiveAction to update the UI
Through the applyValidationPresentation method, Jivs will pass us an array of IssueFound objects when there are issues and null when there is not. We want to add the 'invalid' class to the native element when there are issues and remove it when there are not.

Here is the full implementation of the **QuantitySelectorValidationPresentation**, which applies or removes CSS classes based on the validation results for the `quantity`.

```ts
import { DirectiveActionBase } from 'your-library-path';
import { IPresentationDirectiveAction } from 'your-library-path';
import { ElementRef, Renderer2 } from '@angular/core';
import { IssueFound } from 'jivs-angular';

export class QuantitySelectorValidationPresentation extends DirectiveActionBase implements IPresentationDirectiveAction {
  constructor() {
    super();
  }

  applyValidationPresentation(
    el: ElementRef,
    issuesFound: IssueFound[] | null,
    fivaseValidationManager: any,
    valueHostName: string,
    options?: { selector?: string } //NOTE: we ignore the selector here because this class knows exactly which element to update
  ): void {
    const element = el.nativeElement;

    if (issuesFound.length > 0) {
      this.renderer.addClass(element, 'invalid');
    } else {
      this.renderer.removeClass(element, 'invalid');
    }
  }
}
```


### Updating the Component with Helper Functions

Next, we introduce the **helper functions** from Jivs-angular into your component. These snippets show how to attach and clean up the companion directive actions:

#### **Imports from Jivs-angular**

```ts
import { attachDirectiveActionsToElement, cleanupDirectiveActionsFromElement } from 'jivs-angular';
```
#### **Attaching DirectiveActions in `ngOnInit`**:

We add `attachDirectiveActionsToElement()` in the `ngOnInit()` lifecycle hook to attach the directive actions to the DOM element.

```ts
ngOnInit(): void {
  attachDirectiveActionsToElement(this.elementRef.nativeElement, 
    new QuantitySelectorEventHandler(this), 
    new QuantitySelectorValidationPresentation());
}
```
> If you don't need one of these, pass in null.
#### **Cleaning Up DirectiveActions in `ngOnDestroy`**:

In the `ngOnDestroy()` lifecycle hook, we clean up the attached directive actions using `cleanupDirectiveActionsFromElement()`.

```ts
ngOnDestroy(): void {
  cleanupDirectiveActionsFromElement(this.elementRef.nativeElement);
}
```


Here is the completed implementation:

```ts
import { Component, ElementRef, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { QuantitySelectorEventHandler } from './quantityselector-event-handler';
import { QuantitySelectorValidationPresentation } from './quantityselector-validation-presentation';
import { attachDirectiveActionsToElement, cleanupDirectiveActionsFromElement } from 'jivs-angular';

@Component({
  selector: 'app-quantityselector',
  template: `
    <div>
      <button class="decrement">-</button>
      <span>{{ quantity }}</span>
      <button class="increment">+</button>
    </div>
  `
})
export class QuantitySelector implements OnInit, OnDestroy {
  quantity = 0;

  @Output() quantityChange = new EventEmitter<{ oldValue: number, newValue: number }>();

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
	  attachDirectiveActionsToElement(this.elementRef.nativeElement, 
	    new QuantitySelectorEventHandler(this.renderer, this), 
	    new QuantitySelectorValidationPresentation(this.renderer));
  }

  increment(): void {
    const oldValue = this.quantity;
    this.quantity++;
    this.quantityChange.emit({ oldValue, newValue: this.quantity });
  }

  decrement(): void {
    if (this.quantity > 0) {
      const oldValue = this.quantity;
      this.quantity--;
      this.quantityChange.emit({ oldValue, newValue: this.quantity });
    }
  }

  ngOnDestroy(): void {
    // Clean up the DirectiveActions and resources
    cleanupDirectiveActionsFromElement(this.elementRef.nativeElement);
  }
}
```

## **Alternative Approach: Implementing Interfaces on the Component**

While using companion `DirectiveAction` classes is a flexible solution, there is another approach that may be more suitable when you want to keep all the logic contained within the component itself. This approach involves having your component directly implement the necessary `DirectiveAction` interfaces: `IEventsDirectiveAction` and `IPresentationDirectiveAction`.

By implementing these interfaces on the component, you can directly handle validation events and UI updates within the component code, keeping everything in one place.

### **Why Use This Approach?**

This approach is ideal when:
- You want to maintain all component-related logic (including validation and UI presentation) in a single file.
- You prefer not to create separate `DirectiveAction` classes and would rather implement the required behaviors directly in the component.
- The validation or presentation logic is tightly coupled with the component's internal state, making it more convenient to handle events and validation results within the component.

---

### **Implementing Interfaces on the Component**

Let’s modify the previous example to show how the `QuantitySelector` component itself can implement the required interfaces (`IEventsDirectiveAction` and `IPresentationDirectiveAction`), allowing it to handle validation events and UI updates directly.

### **Updated QuantitySelector Component**

The component will now implement the `IEventsDirectiveAction` and `IPresentationDirectiveAction` interfaces directly:

```ts
import { Component, ElementRef, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { IEventsDirectiveAction, IPresentationDirectiveAction, FivaseValidationManager, IssueFound } from 'jivs-angular';

@Component({
  selector: 'app-quantityselector',
  template: `
    <div>
      <button class="decrement">-</button>
      <span>{{ quantity }}</span>
      <button class="increment">+</button>
    </div>
  `
})
export class QuantitySelector implements OnInit, OnDestroy, IEventsDirectiveAction, IPresentationDirectiveAction {
  quantity = 0;

  @Output() quantityChange = new EventEmitter<{ oldValue: number, newValue: number }>();

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Attach this component itself as both the event handler and the presentation handler
    attachDirectiveActionsToElement(this.elementRef.nativeElement, this, this);
  }

  increment(): void {
    const oldValue = this.quantity;
    this.quantity++;
    this.quantityChange.emit({ oldValue, newValue: this.quantity });
  }

  decrement(): void {
    if (this.quantity > 0) {
      const oldValue = this.quantity;
      this.quantity--;
      this.quantityChange.emit({ oldValue, newValue: this.quantity });
    }
  }

  ngOnDestroy(): void {
    // Clean up the directive actions and resources
    cleanupDirectiveActionsFromElement(this.elementRef.nativeElement);
  }

  // Implementing the IEventsDirectiveAction interface
    setupEventHandlers(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        fivaseValidationManager: FivaseValidationManager
  ): void {
    // Subscribe to quantityChange EventEmitter
    this.quantityChange.subscribe(({ oldValue, newValue }) => {
      // Trigger validation when the quantity changes
      fivaseValidationManager.setValue(valueHostName, newValue, { validate: true });
    });
  }

  // Implementing the IPresentationDirectiveAction interface
    applyValidationPresentation(
        element: HTMLElement,
        renderer: Renderer2,
        valueHostName: string,
        validationState: ValueHostValidationState,
        fivaseValidationManager: FivaseValidationManager,
        options?: { invalidCssClass?: string; validCssClass?: string }
  ): void {
    let issuesFound = validationState.issuesFound;
    if (issuesFound && issuesFound.length > 0) {
      this.renderer.addClass(element, 'invalid');
    } else {
      this.renderer.removeClass(element, 'invalid');
    }
  }
}
```

### **Key Points of This Approach**

1. **Interface Implementation**: The component now implements both `IEventsDirectiveAction` and `IPresentationDirectiveAction`. This allows the component to manage validation events and UI updates directly.

2. **Helper Functions**: Instead of attaching external `DirectiveAction` objects, we attach the component itself as both the event handler and the presentation handler via the `attachDirectiveActionsToElement` helper function.

3. **Streamlined Code**: With this approach, you avoid creating separate classes for `DirectiveAction`, keeping the component logic in a single file.

---

### **Choosing the Right Approach**

Now that you’ve seen both approaches—using companion `DirectiveAction` classes and implementing the interfaces directly on the component—it’s up to you to decide which method best suits your needs. If you prefer a more modular approach, you can use the companion classes. If you prefer to keep all your logic together in one place, implementing the interfaces directly on the component may be the better option.

---

