import { ElementCollectorBase } from '../FormInstaller/ElementCollectorBase';
import { IElementRegistry } from '../Interfaces/ElementRegistry';
import { ElementRole } from '../Interfaces/Types';
import { revealElementToUser } from '../Utilities/Helpers';

/**
 * Identifies the elements involved in the validation UI through the 
 * Jivs SimpleDom syntax.
 * It uses attributes on elements to include and characterize them for validation purposes.
 * 
 * ## Attributes
 * - data-field: identifies the field name associated with the element for validation purposes.
 *   It belongs on any element that has one of these roles: editor, label, error, aria-error, container, and required.
 *   It is an error if the element has one of the specified roles but does not have the data-field attribute.
 *   This field name should be assigned as the FieldValueHost's Element Identifier unless it is the same as the FieldValueHosts own name.
 *   ```ts
 *   builder.field('fieldName', LookupKey.String, {
 *      elementIdentifier: 'fieldNameInUI'
 *   });
 *   ```
 * 
 * - data-jivs-role: identifies the role of the element in the validation UI.
 *   Values:
 *   'editor' - the element that serves as the input or editor for the field.
 *   'label' - the element that serves as the label for the field.
 *   'error' - the element that displays the error message for the field.
 *   'aria-error' - the element that displays the ARIA error message for the field.
 *      When using ARIAs and the Error Message Display widget uses a popup to show its error messages, 
 *      always add <span data-jivs-role="aria-error" data-field="fieldName"></span>.
 *      the 'aria-error' role should be used to identify the element that displays the ARIA error message.
 *      It allows assistive technologies to support the error message without requiring it to be visually present.
 *   'container' - the element that contains the field and its related elements.
 *   'required' - the element that indicates the field is required.
 *      This can be an explicit field like <span data-jivs-role="required" data-field="fieldName"></span>
 *      or you can use CSS on the editor, container, or label to show that state.
 *   'summary' - the element that displays the Validation Summary widget
 *   'submit' - the element that serves as the submit button for the form.
 *   NOTE: The following are only required if you want the presentation to change based on the validation state:
 *     'label', 'container', 'submit'.
 * 
 * - data-jivs-presentation: identifies the name of the presentation object applied to the element.
 *     This name is used when registering the presentation object in either:
 *     - domServices.fieldPresentationFactory.register('presentationName', fieldPresentationObject);
 *     - domServices.formPresentationFactory.register('presentationName', formPresentationObject);
 *     Most elements have a default, also established in those factories. 
 *     Use this only when you want to override or explicitly show the presentation name.
 *     Not used on role='aria-error'.
 * 
 * - data-jivs-adapterkey: only when data-jivs-role='editor'. Names the EditorAdapterDefinition to be used for the element.
 *     This name is used when registering the editor adapter in the EditorAdapterFactory:
 *     - domServices.editorAdapterFactory.register(new InputAdapterDefinition('text', 'adapterKey'));
 *     - domServices.editorAdapterFactory.register(new SelectAdapterDefinition('adapterKey'));
 *     Any HTML form control editor that is already registered will be recognized automatically
 *     and you can omit the data-jivs-adapterkey attribute for those editors.
 *     If you have your own custom widget, it should have its own EditorAdapterDefinition registered in the EditorAdapterFactory.
 * 
 * - data-jivs-group: only when data-jivs-role='summary' or 'submit', and only 
 *     when you are using the validation groups feature. 
 *     Names of the validation group associated with the element.
 * 
 * ## Examples by role
 * ### Editor
 * ```html
 * <input type="text" data-jivs-role="editor" data-field="fieldName" />
 * <input type="text" data-jivs-role="editor" data-field="fieldName" data-jivs-presentation="presentationName" />
 * <select data-jivs-role="editor" data-field="fieldName">
 *   <option value="option1">Option 1</option>
 *   <option value="option2">Option 2</option>
 * </select>
 * <custom-element data-jivs-role="editor" data-field="fieldName" data-jivs-adapterkey="adapterKey" data-jivs-presentation="presentationName"></custom-element>
 * ```
 * 
 * ### Label
 * ```html
 * <label data-jivs-role="label" data-field="fieldName">Field Label</label>
 * <span data-jivs-role="label" data-field="fieldName" data-jivs-presentation="presentationName">Field Label</span>
 * ```
 * 
 * ### Error Message Display
 * ```html
 * <div data-jivs-role="errormessage" data-field="fieldName">Error Message</div>
 * <span data-jivs-role="errormessage" data-field="fieldName" data-jivs-presentation="presentationName">Error Message</span>
 * ```
 * 
 * ### Aria Error
 * ```html
 * <div data-jivs-role="ariaerror" data-field="fieldName">Error Message</div>
 * ```
 * 
 * ### Required Indicator
 * ```html
 * <span data-jivs-role="required" data-field="fieldName">*</span>
 * ```
 * 
 * ### Container
 * ```html
 * <div data-jivs-role="container" data-field="fieldName">
 *   <label data-jivs-role="label" data-field="fieldName">Field Label</label>
 *   <input type="text" data-jivs-role="editor" data-field="fieldName" />
 * </div>
 * <div data-jivs-role="container" data-field="anotherFieldName" data-jivs-presentation="presentationName">
 * </div>
 * ```
 * 
 * ### Summary
 * ```html
 * <div data-jivs-role="summary" ></div>
 * <div data-jivs-role="summary" data-jivs-presentation="presentationName"></div>
 * ```
 * ### Submit
 * ```html
 * <button data-jivs-role="submit">Submit</button>
 * <button data-jivs-role="submit" data-jivs-presentation="presentationName">Submit</button>
 * ```
 * 
 */
export class SimpleDomElementCollector extends ElementCollectorBase
{
    /**
     * Performs a "page scrape" to collect elements with data-jivs-role attributes and register them
     * within the Element Registry.
     * @param root 
     * @param registry 
     */
    public collect(root: HTMLElement, registry: IElementRegistry): void
    {
        const elements = Array.from(root.querySelectorAll<HTMLElement>(`[${ simpleDomRoleAttribute }]`));
        if (root.hasAttribute(simpleDomRoleAttribute)) elements.unshift(root);
        for (const element of elements)
        {
            let role = element.getAttribute(simpleDomRoleAttribute)!;
            // confirm the role string is a case insensitive match to expectations
            // and replace it with the canonical casing from ElementRole
            const canonicalRole = Object.values(ElementRole).find(r => r.toLowerCase() === role.toLowerCase());
            if (!canonicalRole) {
                throw new Error(`Unknown role '${ role }' on: '${ revealElementToUser(element) }'`);
            }
            role = canonicalRole;
            const presentationName = element.getAttribute(simpleDomPresentationAttribute) ?? undefined;
            if (role === ElementRole.summary || role === ElementRole.submit)
            {
                const group = element.getAttribute(simpleDomGroupAttribute) ?? undefined;
                registry.addForm(element, role, {
                    ...(presentationName !== undefined ? { presentationName } : {}),
                    ...(group !== undefined ? { group } : {})
                });
                continue;
            }
            const fieldName = element.getAttribute(simpleDomFieldAttribute);
            if (!fieldName) throw new Error(`Missing data-field attribute on: '${ revealElementToUser(element) }'`);
            if (role === ElementRole.editor)
            {
                const adapterKey = element.getAttribute(simpleDomAdapterKeyAttribute) ?? undefined;
                // null makes EditorInstaller use the adapter definition's recommended presentation.
                registry.addEditor(element, fieldName, {
                    ...(adapterKey !== undefined ? { adapterKey } : {}),
                    presentationName: presentationName ?? null
                });
            } else
            {
                registry.addField(element, fieldName, role,
                    presentationName === undefined ? {} : { presentationName });
            }
        }
    }
}

export const simpleDomRoleAttribute = 'data-jivs-role';
export const simpleDomPresentationAttribute = 'data-jivs-presentation';
export const simpleDomGroupAttribute = 'data-jivs-group';
export const simpleDomAdapterKeyAttribute = 'data-jivs-adapterkey';
export const simpleDomFieldAttribute = 'data-field';