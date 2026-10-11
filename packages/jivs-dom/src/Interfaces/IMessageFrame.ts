import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IJivsDomServices } from './JivsDomServices';

/**
 * Both FieldPresentation and FormPresentation classes need a common approach to 
 * formatting the issues found in the field or form.
 * - The Message Content, which contains the actual error message HTML.
 * - The Message Frame, which wraps around the Message Content and may include
 *   more HTML like headers, footers, and icons.
 *   It also gets the Message Content content and injects it into the appropriate location 
 *   within the Message Frame.
 * 
 * This interface defines the contract for the Message Frame.
 * 
 * Implementations may provide ways to include headers, footers, tokens in text,
 * and text localization (through jivs-engine's ErrorMessageService)
 */
export interface IMessageFrame
{
    /**
     * Sets the DOM services instance to be used for rendering and formatting issues.
     * Expected to be established before using apply().
     */
    setDomServices(domServices: IJivsDomServices): void;

    /**
     * When true, the Field Presentation needs to update its container element to
     * include class 'jivs-messagecontent'.
     */
    needsContainerUpdate(): boolean;

    /**
     * Applies the display of issues found to the specified container element.
     * 
     * @param containerElement The HTML element that will contain the displayed issues. Expect to update its content with HTML.
     * @param issuesFound The list of issues found that need to be displayed. Each has details about the validation issue beyond 
     * just a simple message. Typically use domService.issuesFoundFormatterService to generate the HTML as text to insert into the container element.
     * @param valueHostsManager The manager associated with this form.
     * @param fieldValueHost The specific field value host associated with the issues, if any. When assigned, this is a field-specific list of issues.
     */
    apply(containerElement: HTMLElement, issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null): void;
}