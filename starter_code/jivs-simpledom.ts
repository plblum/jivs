/**
 * Starter implementation for the Jivs SimpleDom validation UI.
 *
 * This file accompanies:
 * docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md
 *
 * Keep this implementation synchronized with the code examples in that guide.
 * Documentation paths in this file are relative to the repository root.
 *
 * The UI-library popup example is intentionally excluded because its show and
 * hide operations belong to the application.
 */
import { type IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { type IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { FieldValueHost } from '@plblum/jivs-engine/build/ValueHosts/FieldValueHost';
import { type ValidationState, type IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { type TokenLabelAndValue } from '@plblum/jivs-engine/build/Interfaces/MessageTokenSource';
import { type ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { MessageTokenResolverService } from '@plblum/jivs-engine/build/Services/MessageTokenResolverService';

/**
 * Encodes text for safe insertion into generated HTML.
 *
 * @see [Protect Error Messages from XSS](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#protect-error-messages-from-xss)
 */
export function encodeHtml(
    value: string
): string
{
    const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return value.replace(
        /[&<>"']/g,
        character => entities[character]
    );
}

/**
 * Encodes message-token replacements and preserves their token metadata.
 *
 * @see [Protect Error Messages from XSS](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#protect-error-messages-from-xss)
 */
export class HtmlMessageTokenResolverService
    extends MessageTokenResolverService
{

    /**
     * Finalizes one message-token replacement as safe HTML.
     *
     * @see [Protect Error Messages from XSS](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#protect-error-messages-from-xss)
     */
    protected override finalizeReplacement(
        replacement: string,
        tav: TokenLabelAndValue
    ): string
    {
        const encodedValue =
            encodeHtml(replacement);

        const purposeClass =
            tav.purpose
                ? ` ${ tav.purpose }`
                : '';

        return (
            `<span class="token${ purposeClass }">` +
            encodedValue +
            '</span>'
        );
    }
}

/**
 * Maps Jivs severity values to the names exposed through `data-severity`.
 *
 * @see [Generate Error Message HTML](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#generate-error-message-html)
 */
export const severityNames: Array<string | null> = [
    'warning',
    null,
    'severe'
];

/**
 * Generates HTML for one or more validation issues.
 *
 * @see [Generate Error Message HTML](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#generate-error-message-html)
 */
export function buildErrorMessagesHtml(
    issues: IssueFound[],
    useSummaryMessage = false
): string
{
    if (issues.length === 0)
    {
        return '';
    }

    if (issues.length === 1)
    {
        return buildErrorMessageHtml(
            'span',
            issues[0],
            useSummaryMessage
        );
    }

    const items =
        issues
            .map(issue =>
                buildErrorMessageHtml(
                    'li',
                    issue,
                    useSummaryMessage
                )
            )
            .join('');

    return `<ul>${ items }</ul>`;
}

/**
 * Generates the HTML element for one validation issue.
 *
 * @see [Generate Error Message HTML](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#generate-error-message-html)
 */
export function buildErrorMessageHtml(
    tagName: 'span' | 'li',
    issue: IssueFound,
    useSummaryMessage: boolean
): string
{
    const attributes: string[] = [];

    if (issue.errorCode)
    {
        attributes.push(
            `data-error-code="${ encodeHtml(issue.errorCode) }"`
        );
    }

    const severity =
        issue.severity === undefined
            ? null
            : severityNames[issue.severity];

    if (severity)
    {
        attributes.push(
            `data-severity="${ severity }"`
        );
    }

    const attributeText =
        attributes.length
            ? ` ${ attributes.join(' ') }`
            : '';

    const message =
        useSummaryMessage
            ? issue.summaryMessage ?? issue.errorMessage
            : issue.errorMessage;

    return (
        `<${ tagName }${ attributeText }>` +
        message +
        `</${ tagName }>`
    );
}

/**
 * Generates plain text for validation consumers that cannot use HTML.
 *
 * @see [Generate Error Message Text](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#generate-error-message-text)
 */
export function buildErrorMessagesText(
    issues: IssueFound[]
): string
{
    return issues
        .map(issue =>
            errorMessageToText(
                issue.errorMessage
            )
        )
        .join(' • ');
}

/**
 * Converts one prepared HTML Error Message to plain text.
 *
 * @see [Generate Error Message Text](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#generate-error-message-text)
 */
export function errorMessageToText(
    errorMessage: string
): string
{
    const container =
        document.createElement('div');

    container.innerHTML =
        errorMessage;

    return container.textContent ?? '';
}

/**
 * Defines the callback signature for dispatching field validation state.
 *
 * @see [The Field Dispatcher Function](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#the-field-dispatcher-function)
 */
export type FieldDispatcher = (
    valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
) => void;

/**
 * Dispatches a field's validation state to its attached UI consumers.
 *
 * @see [The Field Dispatcher Function](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#the-field-dispatcher-function)
 */
export function fieldValidated(
    valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void
{
    const fieldId =
        valueHost.getElementIdentifier();

    const consumers =
        document.querySelectorAll<IFieldValidationConsumerElement>(
            `[data-field="${ CSS.escape(fieldId) }"]` +
            `[data-jivs-role]`
        );

    for (const consumer of consumers)
    {
        consumer.onFieldValidationStateChanged?.(
            consumer,
            valueHost,
            validationState
        );
    }
}

/**
 * Defines the common signature used by Field Presentation Functions.
 *
 * @see [Initialize Field Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions)
 */
export type FieldPresentationHandler = (
    element: HTMLElement,
    valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
) => void;

/**
 * Extends a field validation consumer with its Presentation Function callback.
 *
 * @see [Initialize Field Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions)
 */
export interface IFieldValidationConsumerElement extends HTMLElement
{
    onFieldValidationStateChanged?: FieldPresentationHandler;
}

// Return the Presentation Function associated with a name.
// Add or replace cases as the application adds Presentation Functions.
/**
 * Resolves a Field Presentation Function from its declared name.
 *
 * @see [Initialize Field Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions)
 */
export function getFieldPresentationFunction(
    presentationName: string
): FieldPresentationHandler | undefined
{
    switch (presentationName)
    {
        case 'invalidEditor':
            return editorValidationChanged;

        case 'invalidLabel':
            return labelValidationChanged;

        case 'inlineError':
            return inlineErrorDisplayChanged;

        case 'errorIcon':
            return errorIconChanged;

        case 'editorTooltip':
            return editorTooltipChanged;
    }
    return undefined;
}

// Attach one Presentation Function when its name is already known.
/**
 * Attaches one named Field Presentation Function to an element.
 *
 * @see [Initialize Field Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions)
 */
export function attachFieldPresentation(
    element: IFieldValidationConsumerElement,
    presentationName: string
): void
{
    // Leave an element alone when it has already been attached.
    if (element.onFieldValidationStateChanged)
    {
        return;
    }

    const presentationFunction =
        getFieldPresentationFunction(
            presentationName
        );

    if (presentationFunction)
    {
        element.onFieldValidationStateChanged =
            presentationFunction;
    }
}

// Read the Presentation name declared on one element and attach it.
/**
 * Reads and attaches the Field Presentation Function declared by an element.
 *
 * @see [Initialize Field Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions)
 */
export function attachFieldPresentationFromAttribute(
    element: IFieldValidationConsumerElement
): void
{
    const presentationName =
        element.dataset.jivsPresentation;

    if (presentationName)
    {
        attachFieldPresentation(
            element,
            presentationName
        );
    }
}

// Find matching elements and attach each declared presentation.
/**
 * Attaches the declared Field Presentation Functions to matching elements.
 *
 * @see [Initialize Field Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions)
 */
export function attachFieldPresentations(
    selector =
        '[data-field][data-jivs-presentation]'
): void
{
    const elements =
        document.querySelectorAll<IFieldValidationConsumerElement>(
            selector
        );

    for (const element of elements)
    {
        attachFieldPresentationFromAttribute(
            element
        );
    }
}

/**
 * Exposes invalid field state through the editor's `invalid` class.
 *
 * @see [Presentation for an Editor](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#presentation-for-an-editor)
 */
export function editorValidationChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void
{
    element.classList.toggle(
        'invalid',
        validationState.isValid === false
    );
}

/**
 * Exposes invalid field state through the label's `invalid` class.
 *
 * @see [Presentation for a Label](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#presentation-for-a-label)
 */
export function labelValidationChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void
{
    element.classList.toggle(
        'invalid',
        validationState.isValid === false
    );
}

/**
 * Presents a field's issues as inline Error Message HTML.
 *
 * @see [Inline Error Display](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#inline-error-display)
 */
export function inlineErrorDisplayChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void
{
    const issues =
        validationState.issuesFound;

    element.classList.toggle(
        'has-issues',
        Boolean(issues?.length)
    );

    element.innerHTML =
        issues?.length
            ? buildErrorMessagesHtml(issues)
            : '';
}

/**
 * Shows an error icon and supplies its native tooltip text while issues exist.
 *
 * @see [Error Icon with a Native Tooltip](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#error-icon-with-a-native-tooltip)
 */
export function errorIconChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void
{
    const issues =
        validationState.issuesFound;

    const hasIssues =
        Boolean(issues?.length);

    element.classList.toggle(
        'has-issues',
        hasIssues
    );

    if (!issues?.length)
    {
        element.removeAttribute('title');
        return;
    }

    element.title =
        buildErrorMessagesText(issues);
}

/**
 * Supplies native tooltip text to the container surrounding an editor.
 *
 * @see [Put the Editor's Errors in a Native Tooltip](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#put-the-editors-errors-in-a-native-tooltip)
 */
export function editorTooltipChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void
{
    const issues =
        validationState.issuesFound;

    if (!issues?.length)
    {
        element.removeAttribute('title');
        return;
    }

    element.title =
        buildErrorMessagesText(issues);
}

/**
 * Initializes Required Indicator visibility from each `FieldValueHost.required` value.
 *
 * @see [Initialize Required Indicators](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-required-indicators)
 */
export function initializeRequiredIndicators(
    valueHostsManager: IValueHostsManager
): void
{
    const valueHosts =
        valueHostsManager.enumerateValueHosts(
            (valueHost) =>
                valueHost instanceof FieldValueHost
        );

    for (const valueHost of valueHosts)
    {
        const fieldValueHost =
            valueHost as IFieldValueHost;

        const fieldId =
            fieldValueHost.getElementIdentifier();

        const indicators =
            document.querySelectorAll<HTMLElement>(
                `[data-field="${ CSS.escape(fieldId) }"]` +
                `[data-jivs-role="required"]`
            );

        for (const indicator of indicators)
        {
            indicator.classList.toggle(
                'active',
                fieldValueHost.required
            );
        }
    }
}

/**
 * Defines the callback signature for dispatching form validation state.
 *
 * @see [The Form Dispatcher Function](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#the-form-dispatcher-function)
 */
export type FormDispatcher = (
    valueHostsManager: IValueHostsManager,
    validationState: ValidationState
) => void;

/**
 * Dispatches form validation state to its attached UI consumers.
 *
 * @see [The Form Dispatcher Function](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#the-form-dispatcher-function)
 */
export function formValidated(
    vhm: IValueHostsManager,
    validationState: ValidationState
): void
{
    const consumers =
        document.querySelectorAll<IFormValidationConsumerElement>(
            '[data-jivs-role="summary"],' +
            '[data-jivs-role="submit"]'
        );

    for (const consumer of consumers)
    {
        consumer.onFormValidationStateChanged?.(
            consumer,
            vhm,
            validationState
        );
    }
}

/**
 * Defines the common signature used by Form Presentation Functions.
 *
 * @see [Initialize Form Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions)
 */
export type FormPresentationHandler = (
    element: HTMLElement,
    valueHostsManager: IValueHostsManager,
    validationState: ValidationState
) => void;

/**
 * Extends a form validation consumer with its Presentation Function callback.
 *
 * @see [Initialize Form Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions)
 */
export interface IFormValidationConsumerElement extends HTMLElement
{
    onFormValidationStateChanged?: FormPresentationHandler;
}

// Return the Presentation Function associated with a name.
// Add or replace cases as the application adds Presentation Functions.
/**
 * Resolves a Form Presentation Function from its declared name.
 *
 * @see [Initialize Form Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions)
 */
export function getFormPresentationFunction(
    presentationName: string
): FormPresentationHandler | undefined
{
    switch (presentationName)
    {
        case 'validationSummary':
            return validationSummaryChanged;

        case 'disableSubmit':
            return submitValidationChanged;
    }
    return undefined;
}

// Attach one Presentation Function when its name is already known.
/**
 * Attaches one named Form Presentation Function to an element.
 *
 * @see [Initialize Form Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions)
 */
export function attachFormPresentation(
    element: IFormValidationConsumerElement,
    presentationName: string
): void
{
    // Leave an element alone when it has already been attached.
    if (element.onFormValidationStateChanged)
    {
        return;
    }

    const presentationFunction =
        getFormPresentationFunction(
            presentationName
        );

    if (presentationFunction)
    {
        element.onFormValidationStateChanged =
            presentationFunction;
    }
}

// Read the Presentation name declared on one element and attach it.
/**
 * Reads and attaches the Form Presentation Function declared by an element.
 *
 * @see [Initialize Form Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions)
 */
export function attachFormPresentationFromAttribute(
    element: IFormValidationConsumerElement
): void
{
    const presentationName =
        element.dataset.jivsPresentation;

    if (presentationName)
    {
        attachFormPresentation(
            element,
            presentationName
        );
    }
}

// Find matching elements and attach each declared presentation.
/**
 * Attaches the declared Form Presentation Functions to matching elements.
 *
 * @see [Initialize Form Presentation Functions](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions)
 */
export function attachFormPresentations(
    selector =
        '[data-jivs-role="summary"][data-jivs-presentation],' +
        '[data-jivs-role="submit"][data-jivs-presentation]'
): void
{
    const elements =
        document.querySelectorAll<IFormValidationConsumerElement>(
            selector
        );

    for (const element of elements)
    {
        attachFormPresentationFromAttribute(
            element
        );
    }
}

/**
 * Presents issues from the complete `ValueHostsManager` in a Validation Summary.
 *
 * @see [Presentation for a Validation Summary](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#presentation-for-a-validation-summary)
 */
export function validationSummaryChanged(
    element: HTMLElement,
    _vhm: IValueHostsManager,
    validationState: ValidationState
): void
{
    const issues =
        validationState.issuesFound;

    element.classList.toggle(
        'has-issues',
        Boolean(issues?.length)
    );

    element.innerHTML =
        issues?.length
            ? buildErrorMessagesHtml(
                issues,
                true
            )
            : '';
}

/**
 * Enables or disables a Submit / Save Control from `ValidationState.doNotSave`.
 *
 * @see [Presentation for a Submit / Save Control](docs/Learning_Jivs/Client_Presentation_of_Jivs_Validation.md#presentation-for-a-submit-save-control)
 */
export function submitValidationChanged(
    element: HTMLElement,
    _vhm: IValueHostsManager,
    validationState: ValidationState
): void
{
    const button =
        element as HTMLButtonElement;

    button.disabled =
        validationState.doNotSave;
}
