/**
 * @module jivs-dom/Types
 */

/**
 * Defines the various roles that elements can have within the DOM structure of a form.
 */
export enum ElementRole
{
    editor = 'editor',          // editor widget
    error = 'error',            // Field Error Display widget
    ariaError = 'aria-error',   // alternative aria specific host for error message reading
    label = 'label',            // the field label widget
    required = 'required',      // required indicator widget
    container = 'container',    // container element for the editor that is specific to its field
    summary = 'summary',        // validation summary widget
    submit = 'submit',          // form submission widget
}
