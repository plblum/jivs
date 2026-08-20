/** ------------------------------------------------------------------------------------------
 * Starter implementation for a simple DOM interface to the Jivs validation engine.
 * Add it to a DOM-drive UI (but not React, please).
 * Absolutely feel free to modify it to suit your needs. It is not a complete solution, but it is a good starting point.
 * 
 * It provides some functions found in this learning guide:
 * [Using the ValueHostsManager within the Client](docs/Learning_Jivs/Using_the_ValueHostsManager_within_the_Client.md)
 * 
 * - getElement(): Retrieves the HTML element associated with a FieldValueHost.
 * - attachJivsToFormControl(): Attaches event listeners to any form control element (input, textarea, or select) 
 *      update a FieldValueHost's text value. Basically a front-end for using these three functions:
 * - attachJivsToInput(): Attaches an input element's event listeners to update a FieldValueHost's text value.
 * - attachJivsToTextarea(): Attaches a textarea element's event listeners to update a FieldValueHost's text value.
 * - attachJivsToSelect(): Attaches a select element's event listeners to update a FieldValueHost's value.
 * - onTextValueChanged(): Callback function for ValueHostsManager.onTextValueChanged to update the text value 
 *      of the associated HTML form control element.
 * - jivsAttachedToEvents(): Use within your own attach() functions. Checks if event listeners have already been attached
 *      to a given HTML element to prevent duplicate attachments.
 * 
 * It provides types and classes that get you started with client-side submission too,
 * fleshing out what you learn in 
 * [Submitting the Client Form](docs/Learning_Jivs/Submitting_the_Client_Form.md):
 * - JivsClientSubmitBase: The base class for client-side submission, handling the overall submission process.
 * - ClientSubmitsToJivsOnServerBase: A subclass for clients whose server uses Jivs for validation.
 * - ClientSubmitsToServerBase: A subclass for clients whose server uses another validation system.
 *
 * It has a companion, jivs-simpleDom.ts, which offers the Jivs SimpleDom architecture for presentation
 * of validation issues in the DOM. It is described in the learning guide 
 * [Jivs Presentation Learning Guide](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md)
 ------------------------------------------------------------------------------------------ */
import { type IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { type IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { type IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ModelWriter } from '@plblum/jivs-engine/build/ModelReaderWriter/ModelWriter_classes';

/**
 * Retrieves the HTML element associated with the given FieldValueHost and optional pattern.
 * The Element Identifier is setup either like this:
 * ```ts
 * builder.field('FirstName', LookupKey.String, {
 *     elementIdentifier: 'FirstName'
 * });
 * ```
 * or after it is known:
 * ```ts
 * valueHost.setElementIdentifier('generated-FirstName');
 * ```
 * If not setup, expect the element Identifier to be the FieldValueHost's name.
 * @param valueHost The FieldValueHost instance to retrieve the element for.
 * @param pattern An optional pattern to identify the specific element.
 * It must contain the token {0} which will be replaced with the FieldValueHost's element identifier.
 * @returns The corresponding HTMLElement if found, otherwise null.
 */
export function getElement(
    valueHost: IFieldValueHost,
    pattern?: string
): HTMLElement | null
{
    const fldId = valueHost.getElementIdentifier(pattern);
    return fldId ? document.getElementById(fldId) : null;
}

/**
 * Attaches the appropriate event listeners to the given form control element based on its type 
 * (input, textarea, or select) to the FieldValueHost.
 * Changes will use FieldValueHost.setTextValue() to update the FieldValueHost's value.
 * @param element The HTML form control element (input, textarea, or select) to attach the event listeners to.
 * @param fieldValueHost The FieldValueHost instance to synchronize with the form control element.
 * @param duringEdit If true, updates the FieldValueHost's text value on input events as well.
 */
export function attachJivsToFormControl(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    fieldValueHost: IFieldValueHost,
    duringEdit: boolean = false
): void
{
    switch (element.tagName)
    {
        case 'INPUT':
            attachJivsToInput(element as HTMLInputElement, fieldValueHost, duringEdit);
            break;
        case 'TEXTAREA':
            attachJivsToTextarea(element as HTMLTextAreaElement, fieldValueHost, duringEdit);
            break;
        case 'SELECT':
            attachJivsToSelect(element as HTMLSelectElement, fieldValueHost);
            break;
    }
}

/**
 * Setup event listeners to connect an HTML input element to a FieldValueHost.
 * The input's value will be updated to the FieldValueHost's text value on change
 * and optionally on input events if duringEdit is true.
 * @param input The HTML input element to attach the event listeners to.
 * @param fieldValueHost The FieldValueHost instance to synchronize with the input element.
 * @param duringEdit If true, updates the FieldValueHost's text value on input events as well.
 */
export function attachJivsToInput(
    input: HTMLInputElement,
    fieldValueHost: IFieldValueHost,
    duringEdit: boolean = false
): void
{
    if (jivsAttachedToEvents(input)) return;
    if (input.type === 'checkbox' || input.type === 'radio')
    {
        // this isn't required. We could send input.value directly.
        // The FieldValueHost must be configured with the correct data type name to translate 
        // whatever we send in. The default, LookupKey.Boolean, will translate 'true' and 'false' to boolean values.
        // LookupKey.Boolean uses BooleanParser which you initialize its strings to match
        // when creating the JivsService. See createJivsServices() function.
        input.addEventListener('change', () =>
        {
            fieldValueHost.setTextValue(input.checked ? 'true' : 'false');
        });
        return; // Skip the rest of the function for checkboxes
    }

    input.addEventListener('change', () =>
    {
        fieldValueHost.setTextValue(input.value);
    });

    if (duringEdit)
    {
        input.addEventListener('input', () =>
        {
            fieldValueHost.setTextValue(input.value, {
                duringEdit: true
            });
        });
    }
}

/**
 * Setup an event listener to connect an HTML select element to a FieldValueHost.
 * The FieldValueHost's text value will be updated when the select element's value changes.
 * @param select The HTML select element to attach the event listener to.
 * @param fieldValueHost The FieldValueHost instance to synchronize with the select element.
 */
export function attachJivsToSelect(
    select: HTMLSelectElement,
    fieldValueHost: IFieldValueHost
): void
{
    if (jivsAttachedToEvents(select)) return;
    select.addEventListener('change', () =>
    {
        fieldValueHost.setTextValue(select.value);
    });
}

/**
 * Setup event listeners to connect an HTML textarea element to a FieldValueHost.
 * The FieldValueHost's text value will be updated when the textarea's value changes.
 * If duringEdit is true, the FieldValueHost will also be updated on input events.
 * @param textarea The HTML textarea element to attach the event listeners to.
 * @param fieldValueHost The FieldValueHost instance to synchronize with the textarea element.
 * @param duringEdit If true, updates the FieldValueHost's text value on input events as well.
 */
export function attachJivsToTextarea(
    textarea: HTMLTextAreaElement,
    fieldValueHost: IFieldValueHost,
    duringEdit: boolean = false
): void
{
    if (jivsAttachedToEvents(textarea)) return;
    textarea.addEventListener('change', () =>
    {
        fieldValueHost.setTextValue(textarea.value);
    });

    if (duringEdit)
    {
        textarea.addEventListener('input', () =>
        {
            fieldValueHost.setTextValue(textarea.value, {
                duringEdit: true
            });
        });
    }
}

//#region one-time attachment check support
/**
 * Use jivsAttachedToEvents() in your own attachment functions.
 * This prevents multiple event listeners from being attached to the same element.
 * Its intent is to allow you to use a selector to find all targets and let them
 * be passed to your attachment function, even if some of them have already been attached.
 * For example, after discarding and rebuilding those elements, but not all elements in the page.
 */
interface IJivsAttachedToEvents extends HTMLElement
{
    jivsAttachedToEvents?: boolean;
}

export function jivsAttachedToEvents(
    element: IJivsAttachedToEvents
): boolean
{
    if (element.jivsAttachedToEvents)
    {
        return true;
    }

    element.jivsAttachedToEvents = true;
    return false;
}
//#endregion
/**
 * Callback function for ValueHostsManager.onTextValueChanged to 
 * update the text value of the associated HTML form control element.
 * ```ts
 * const config = rules.configure();
 * config.onTextValueChanged = onTextValueChanged;
 * const vhm = new ValueHostsManager(config);
 * ```
 * Called in these two cases:
 * - When FieldValueHost.setValue is called, and it uses a formatter to update its own text value.
 * - When FieldValueHost.setTextValue is called, and due to having a reformatting option set,
 *   the text value is reformatted and updated.
 * @param valueHost The FieldValueHost instance whose text value has changed.
 * @param oldValue The previous text value before the change.
 */
export function onTextValueChanged(
    valueHost: IFieldValueHost,
    oldValue: string
): void
{
    const newValue = valueHost.getTextValue() ?? '';
    if (newValue === oldValue) return;
    const element = getElement(valueHost);
    // none of these will trigger validation, so we don't need to worry about infinite loops.
    if (element instanceof HTMLInputElement)
    {
        element.value = newValue;
    }
    else if (element instanceof HTMLTextAreaElement)
    {
        element.value = newValue;
    }
    else if (element instanceof HTMLSelectElement)
    {
        element.value = newValue;
    }
}

/** ---------------------------------------------------
 * Building your client-side submission logic. This is an adaptation of 
 * the learning guide [Submitting the Client Form](./learning/Submitting_the_Client_Form.md)
 * It provides the base classes and types for handling client-side form submission, 
 * including model creation, validation, and server communication.
 * 
 * Generally you will subclass from one of these:
 * - `ClientSubmitsToJivsOnServerBase`: When your server is using Jivs in Node.js
 * - `ClientSubmitsToServerBase`: When your server is using another validation system.
 * 
 * The goal is to create one subclass that knows how your server handles its requests and responses
 * by filling in abstract methods. The overall submission process is handled by the base class
 * when you call the submit() method.
 * 
 * ```ts
 * export class MyClientSubmit extends ClientSubmitsToServerBase<MyModel, MyError> {
 *     protected async saveModel(model: MyModel): Promise<SaveModelResponse<MyModel, MyError>> {
 *         // Implement server communication here
 *     }
 * // and the other abstract methods...
 * }
 * 
 * let submitter = new MyClientSubmit(vhm, () => new MyModel());
 * submitter.submit();
 * ```
 */

/**
 * Creates the Model populated during submission.
 * Passed to your JivsClientSubmitBase subclass constructor to help it create a new Model instance for submission.
 */
export type ModelFactory<TModel extends object> = () => TModel;

/**
 * Defines the response expected by the starter submission classes.
 *
 * Applications can modify this interface to match their server contract.
 */
export interface SaveModelResponse<TModel extends object, TError>
{
    model?: TModel; // expect undefined if the server doesn't return a model, or if the submission failed.
    validationErrors?: TError[];    // targets another validation system
    validationPayload?: string; // targets Jivs on the server
    httpStatus?: number; // optional, but useful for handling HTTP errors
    httpStatusText?: string; // optional, but useful for handling HTTP errors
}

/**
 * Provides the common client-side submission process described in
 * [Submitting the Client Form](./learning/Submitting_the_Client_Form.md#putting-the-submission-process-together).
 *
 * Subclasses supply the application-specific validation, communication, and
 * presentation behavior. The server-specific subclasses below supply the
 * handling for server validation results.
 */
export abstract class JivsClientSubmitBase<TModel extends object, TError>
{
    public constructor(
        protected readonly valueHostsManager: IValueHostsManager,
        private readonly modelFactory: ModelFactory<TModel>
    )
    {
        if (!valueHostsManager) throw new Error('valueHostsManager is required');
        if (!modelFactory) throw new Error('modelFactory is required');
    }

    /**
     * Runs the complete submission process.
     *
     * See [Putting the Submission Process Together](./learning/Submitting_the_Client_Form.md#putting-the-submission-process-together).
     */
    public async submit(): Promise<void>
    {
        const validationState = this.valueHostsManager.validate();

        if (validationState.doNotSave)
        {
            return;
        }

        const model = this.modelFactory();
        const writer = new ModelWriter(this.valueHostsManager, model);
        writer.writeToModel();

        const issuesFound = this.validateModelBeforeSave(model);
        if (issuesFound && issuesFound.length > 0)
        {
            this.valueHostsManager.addExternalIssuesFound(issuesFound, true);
            return;
        }

        let response: SaveModelResponse<TModel, TError>;

        try
        {
            response = await this.saveModel(model);
        }
        catch (error)
        {
            this.handleConnectionFailure(error);
            return;
        }

        if (this.handleHttpFailure(response))
        {
            return;
        }

        if (this.handleServerIssues(response))
        {
            return;
        }

        this.submissionSucceeded(response.model ?? model);
    }

    /**
     * Applies application-specific validation before the Model is sent.
     * when a model needs this service, it should subclass your own implementation
     * to supply it.
     *
     * See [Apply Additional Business Validation](./learning/Submitting_the_Client_Form.md#apply-additional-business-validation).
     */
    protected validateModelBeforeSave(model: TModel): IssueFound[] | null
    {
        return null;
    }

    /**
     * Sends the Model to the server and returns the application's response.
     *
     * See [Send the Model to the Server](./learning/Submitting_the_Client_Form.md#send-the-model-to-the-server).
     */
    protected abstract saveModel(model: TModel): Promise<SaveModelResponse<TModel, TError>>;

    /**
     * Handles a failure that prevented the client from receiving a response.
     *
     * See [Handle Request Failures](./learning/Submitting_the_Client_Form.md#handle-request-failures).
     * @param error The Error object thrown by saveModel.
     */
    protected abstract handleConnectionFailure(error: unknown): void;

    /**
     * Handles an HTTP or server failure that is not a validation result.
     * Returns true when submission processing must stop.
     *
     * See [Handle Request Failures](./learning/Submitting_the_Client_Form.md#handle-request-failures).
     */
    protected abstract handleHttpFailure(response: SaveModelResponse<TModel, TError>): boolean;

    /**
     * Provides server validation issues to Jivs.
     * Returns true when submission processing must stop.
     *
     * See [Handle Server Validation Results](./learning/Submitting_the_Client_Form.md#handle-server-validation-results).
     */
    protected abstract handleServerIssues(response: SaveModelResponse<TModel, TError>): boolean;

    /**
     * Performs the application's success behavior using the returned Model when
     * available, or the submitted Model otherwise.
     *
     * See [Submission Complete](./learning/Submitting_the_Client_Form.md#submission-complete).
     */
    protected abstract submissionSucceeded(model: TModel): void;
}

/**
 * Starter submission base for a client whose server returns a Jivs Validation Payload.
 *
 * See [When the Server Uses Jivs](./learning/Submitting_the_Client_Form.md#when-the-server-uses-jivs).
 */
export abstract class ClientSubmitsToJivsOnServerBase<TModel extends object>
    extends JivsClientSubmitBase<TModel, never>
{
    protected override handleServerIssues(
        response: SaveModelResponse<TModel, never>
    ): boolean
    {
        if (!response.validationPayload)
        {
            return false;
        }

        this.valueHostsManager.fromValidationPayload(response.validationPayload);
        return true;
    }
}

/**
 * Starter submission base for a client whose server uses another validation system.
 *
 * See [When the Server Uses Another Validation System](./learning/Submitting_the_Client_Form.md#when-the-server-uses-another-validation-system).
 */
export abstract class ClientSubmitsToServerBase<TModel extends object, TError>
    extends JivsClientSubmitBase<TModel, TError>
{
    protected override handleServerIssues(
        response: SaveModelResponse<TModel, TError>
    ): boolean
    {
        if (!response.validationErrors || response.validationErrors.length === 0)
        {
            return false;
        }

        const issuesFound = this.convertToIssueFound(response.validationErrors);

        this.valueHostsManager.addExternalIssuesFound(
            issuesFound,
            false // Issues came from another system.
        );
        return true;
    }

    /**
     * Converts the server's validation errors into Jivs IssueFound objects.
     *
     * See [Handle the Server Issues](./learning/Submitting_the_Client_Form.md#handle-the-server-issues).
     */
    protected abstract convertToIssueFound(errors: TError[]): IssueFound[];
}
