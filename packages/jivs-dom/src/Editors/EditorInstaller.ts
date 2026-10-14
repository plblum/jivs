import { EditorInstallOptions, IEditorInstaller } from '../Interfaces/EditorInstaller';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { DomServiceBase } from '../Services/DomServiceBase';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ElementRole } from '../Interfaces/Types';


/**
 * The EditorInstaller coordinates the following operations for one supplied element and IFieldValueHost:
 * - one adapter definition must be selected;
 * - one JivsElement must be resolved;
 * - one editor must be resolved
 * - the definition’s Text Value and Native Value capabilities must be examined;
 * - its DOM-to-Jivs event handlers must be attached;
 * - its field presentation and ARIA behavior must be installed independently;
 *      - Calls FieldPresentationInstaller.install() from within.
 *      - Requires another task to invoke AriaService.install().
 * - the completed installation must be recorded on the JivsElement.
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
     * @param element The DOM element identified as the location to install.
     * However, it may be changed by identifyJivsElement. The result becomes
     * the JivsElement.
     * @param options The options for installing the editor.
     */
    public install(valueHost: IFieldValueHost, element: IJivsElement, options?: EditorInstallOptions): IJivsElement
    {
        if (!options) {
            options = {};
        }
        let definition = this.resolveDefinition(valueHost, element, options);   // may throw
        const jivsElement = definition.identifyJivsElement(valueHost, element);   // may throw
        const editor = definition.identifyEditor(valueHost, jivsElement);   // may throw

        // already installed? Done!
        if (jivsElement.jivsEditorAdapterDefinition !== undefined)
        {
            return jivsElement;
        }
        jivsElement.jivsElementRole = ElementRole.editor;
        jivsElement.jivsTextValueAdapter = definition.createTextValueAdapter(valueHost, editor, jivsElement);
        jivsElement.jivsValueAdapter = definition.createValueAdapter(valueHost, editor, jivsElement);

        definition.attachToSendValues(valueHost, editor, jivsElement, options);

        // Presentations offloaded. 
        // They will use a role-specific default if no presentation name is provided
        // through our options or the definition's default.
        const presentationName = options.presentationName !== null // null means the role default should be used
                ? options.presentationName  // can be null
                : definition.recommendedFieldPresentationName;

        this.domServices.fieldPresentationInstaller.install(valueHost, jivsElement, ElementRole.editor,
            {
                presentationName   // if null, the role specific default will be used
            }
        );  // may throw

        // declare it as installed to prevent multiple installations
        jivsElement.jivsEditorAdapterDefinition = definition;
        return jivsElement;
    }

    /**
     * Resolves the appropriate editor adapter definition for the given value host and element.
     * Throws an error if no suitable definition is found.
     * @param valueHost - The value host associated with the editor.
     * @param element - The DOM element for which the editor definition is being resolved.
     * @param options - Additional options for editor installation.
     * @returns The resolved editor adapter definition.
     */
    protected resolveDefinition(valueHost: IFieldValueHost, element: HTMLElement, options: EditorInstallOptions): IEditorAdapterDefinition
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
