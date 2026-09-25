import { EditorInstallOptions, IEditorInstaller } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { DomServiceBase } from '../Services/DomServiceBase';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ElementRole } from '../Interfaces/Types';


/**
 * The EditorInstaller coordinates the following operations for one supplied element and IFieldValueHost:
 * - one adapter definition must be selected;
 * - one installation anchor must be resolved;
 * - the definition’s Text Value and Native Value capabilities must be examined;
 * - its DOM-to-Jivs event handlers must be attached;
 * - its field presentation and ARIA behavior must be installed independently;
 * - the completed installation must be recorded on the anchor element.
 * 
 * It should be used both initially and after the form's elements have been replaced.
 * The FormInstaller is a solution that knows how to find the editor elements and call this installer for each of them.
 */
export class EditorInstaller extends DomServiceBase
    implements IEditorInstaller
{
    /**
     * Installs the editor for the specified element and field value host.
     * Must ensure calling it multiple times does not result in multiple installations of the same editor.
     * Only the first call will take any actions.
     * 
     * Will throw exceptions if the editor adapter definition cannot be found.
     * 
     * @param valueHost The field value host associated with the installation.
     * @param element The DOM element serving as the installation anchor.
     * @param options The options for installing the editor.
     */
    public install(valueHost: IFieldValueHost, element: IJivsDomElement, options?: EditorInstallOptions): void
    {
        if (!options) {
            options = {};
        }
        let definition = this.resolveDefinition(valueHost, element, options);   // may throw
        const anchor = definition.resolveInstallationAnchor(valueHost, element);

        // already installed? Done!
        if (anchor.jivsEditorAdapterDefinition !== undefined)
        {
            return;
        }

        anchor.jivsTextValueAdapter = definition.createTextValueAdapter(valueHost, anchor);
        anchor.jivsValueAdapter = definition.createValueAdapter(valueHost, anchor);

        definition.attachToSendValues(valueHost, anchor, options);

        // Presentations offloaded. 
        // They will use a role-specific default if no presentation name is provided
        // through our options or the definition's default.
        const presentationName = options.presentationName != null // null/undefined
                ? options.presentationName
                : definition.defaultFieldPresentationName;

        this.domServices.fieldPresentationInstaller.install(valueHost, anchor, ElementRole.editor,
            {
                presentationName,   // if null, the role specific default will be used
                staticAriaUpdater: definition.getStaticAriaElementUpdater(),
                validationStateAriaUpdater: definition.getValidationStateAriaElementUpdater()
            }
        );  // may throw

        // declare it as installed to prevent multiple installations
        anchor.jivsEditorAdapterDefinition = definition;
    }

    /**
     * Resolves the appropriate editor adapter definition for the given value host and element.
     * Throws an error if no suitable definition is found.
     * @param valueHost - The value host associated with the editor.
     * @param element - The DOM element for which the editor definition is being resolved.
     * @param options - Additional options for editor installation.
     * @returns The resolved editor adapter definition.
     */
    protected resolveDefinition(valueHost: IFieldValueHost, element: IJivsDomElement, options: EditorInstallOptions): IEditorAdapterDefinition
    {
        let definition: IEditorAdapterDefinition | null = null;
        if (options.adapterKey) {
            definition = this.domServices.editorAdapterDefinitionFactory.getDefinition(options.adapterKey);
            if (!definition)
            {
                let message = `Editor adapter definition not found for key: ${ options.adapterKey }`;
                this.domServices.loggingFacade.log(LoggingLevel.Error,
                    (facade) => facade.prepareLogDetails(message, element, valueHost, this, options.adapterKey)
                );
                throw new Error(message);
            }
        }
        else
        {
            definition = this.domServices.editorAdapterDefinitionFactory.findDefinition(valueHost, element);
            if (!definition) {
                let message = `Editor adapter definition not found for the given element and value host.`;
                this.domServices.loggingFacade.log(LoggingLevel.Error,
                    (facade) => facade.prepareLogDetails(message, element, valueHost, this)
                );
                throw new Error(message);
            }
        }

        return definition;
    }
}
