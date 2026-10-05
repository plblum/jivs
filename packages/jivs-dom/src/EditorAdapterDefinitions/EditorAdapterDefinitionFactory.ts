/**
 * Provides a factory for registering and selecting editor adapter definitions 
 * within the Jivs DOM framework.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/EditorAdapterDefinitionFactory
 */

import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IEditorAdapterDefinition, IEditorAdapterDefinitionFactory } from '../Interfaces/EditorAdapterDefinitions';
import { DomServiceBase } from '../Services/DomServiceBase';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { CheckboxAdapterDefinition, defaultCheckboxAdapterKey } from './CheckboxAdapterDefinition';
import { TextAreaAdapterDefinition, defaultTextAreaAdapterKey } from './TextAreaAdapterDefinition';
import { SelectAdapterDefinition, defaultSelectAdapterKey } from './SelectAdapterDefinition';
import { RadioButtonsAdapterDefinition, defaultRadioButtonsAdapterKey } from './RadioButtonsAdapterDefinition';
import { defaultFileInputAdapterKey, FileInputAdapterDefinition } from './FileInputAdapterDefinition';
import { getInputAdapterKey, InputAdapterDefinition } from './InputAdapterDefinition';
import { ContainerCheckboxAdapterDefinition } from './ContainerCheckboxAdapterDefinition';
import { ContainerFileInputAdapterDefinition } from './ContainerFileInputAdapterDefinition';
import { ContainerInputAdapterDefinition, getContainerInputAdapterKey } from './ContainerInputAdapterDefinition';
import { ContainerRadioButtonsAdapterDefinition } from './ContainerRadioButtonsAdapterDefinition';
import { ContainerSelectAdapterDefinition, defaultContainerSelectAdapterKey } from './ContainerSelectAdapterDefinition';
import { ContainerTextAreaAdapterDefinition, defaultContainerTextAreaAdapterKey } from './ContainerTextAreaAdapterDefinition';

/**
 * Registers and selects editor adapter definitions as part of running 
 * the IEditorInstaller.
 * IJivsDomService.editorAdapterFactory retains the sole instance.
 * 
 * Registered instances of IEditorAdapterDefinition must be treated as immutable.
 */
export class EditorAdapterDefinitionFactory extends DomServiceBase
    implements IEditorAdapterDefinitionFactory
{
    constructor(domServices: IJivsDomServices) {
        super(domServices);
        this.lazyRegistration(factory => this.defaultFactoryRegistrations(factory));
    }
    // The collection of registered objects is ordered by priority, with higher priority definitions appearing first.
    // Priority values are 0 to 100 where 0 is the highest.
    // We need support two types of searches:
    // 1. Search by adapter key.
    // 2. Search by value host and element characteristics.
    // The number of registrations is expected to be < 50, so a linear search is acceptable.

    /**
     * Definitions registered with the factory in the order they arrived.
     */
    protected get registeredDefinitions(): IEditorAdapterDefinition[] {
        return this._registeredDefinitions;
    }
    private _registeredDefinitions: IEditorAdapterDefinition[] = [];


    /**
     * Sorted definitions by priority, with higher priority definitions appearing first.
     * Populated from _registeredDefinitions upon the first call to findDefinition().
     */
    protected get sortedDefinitions(): IEditorAdapterDefinition[] | undefined {
        return this._sortedDefinitions;
    }
    private _sortedDefinitions: IEditorAdapterDefinition[] | undefined = undefined;
    /**
     * Registers the given editor adapter definition with the factory.
     * The definition must be treated as immutable once registered.
     * Each instance has a unique Adapter Key. Typically implementations allow
     * passing the adapter key and priority into their constructors.
     * If a definition with the same adapter key already exists, it will be replaced.
     * ```ts
     * factory.register(new TextAreaAdapterDefinition('textarea', 10));
     * ```
     * @param definition The editor adapter definition to register with the factory.
     */
    public register(definition: IEditorAdapterDefinition): void
    {
        this.ensureLazyRegistration();
        // this should discard an existing definition with the same adapter key
        this._registeredDefinitions = this._registeredDefinitions.filter(d => d.adapterKey !== definition.adapterKey);
        this._registeredDefinitions.push(definition);
        this._sortedDefinitions = undefined; // Invalidate the sorted cache
    }

    /**
     * A way to lazily register editor adapter definitions with the factory.
     * It is called automatically if nothing has been registered with the factory yet,
     * but only when the factory is first accessed.
     * ```ts
     * factory.lazyRegistration((factory) => {
     *     factory.register(new TextAreaAdapterDefinition('textarea', 10));
     * });
     * ```
     * @param registrationFunction The function that will be called to lazily register editor adapter definitions with the factory.
     */
    public lazyRegistration(registrationFunction: (factory: IEditorAdapterDefinitionFactory) => void): void
    {
        this._lazyRegistrationFunction = registrationFunction;
    }
    private _lazyRegistrationFunction: ((factory: IEditorAdapterDefinitionFactory) => void) | undefined = undefined;

    protected ensureLazyRegistration(): void
    {
        if (this._lazyRegistrationFunction) {
            this._lazyRegistrationFunction(this);
            this._lazyRegistrationFunction = undefined;
        }
    }

    /**
     * The default factory registrations for editor adapter definitions.
     * To expand or replace, use lazyRegistration().
     * 
     * If you want these to be installed and offer replacements by name, do this:
     * ```ts
     * factory.lazyRegistration(factory => {
     * // order is important: default registrations first, then custom ones
     *     factory.defaultFactoryRegistrations(factory);
     *     factory.register(new AdapterDefinitionType(element));
     * });
     * ```
     * @param factory 
     */
    public defaultFactoryRegistrations(factory: IEditorAdapterDefinitionFactory): void
    {
        // Register default field presentations here
        // Default adapter keys look like this: 'input:type'
        factory.register(new InputAdapterDefinition('text', getInputAdapterKey('text'), 80));
        factory.register(new InputAdapterDefinition('password', getInputAdapterKey('password'), 80));
        factory.register(new InputAdapterDefinition('email', getInputAdapterKey('email'), 80));
        factory.register(new InputAdapterDefinition('number', getInputAdapterKey('number'), 80));
        factory.register(new InputAdapterDefinition('url', getInputAdapterKey('url'), 80));
        factory.register(new InputAdapterDefinition('tel', getInputAdapterKey('tel'), 80));
        factory.register(new InputAdapterDefinition('date', getInputAdapterKey('date'), 80));
        factory.register(new InputAdapterDefinition('datetime-local', getInputAdapterKey('datetime-local'), 80));
        factory.register(new InputAdapterDefinition('month', getInputAdapterKey('month'), 80));
        factory.register(new InputAdapterDefinition('week', getInputAdapterKey('week'), 80));
        factory.register(new InputAdapterDefinition('time', getInputAdapterKey('time'), 80));
        factory.register(new CheckboxAdapterDefinition(defaultCheckboxAdapterKey, 80));
        factory.register(new RadioButtonsAdapterDefinition(defaultRadioButtonsAdapterKey, 80));
        factory.register(new FileInputAdapterDefinition(defaultFileInputAdapterKey, 80));

        factory.register(new TextAreaAdapterDefinition(defaultTextAreaAdapterKey, 80)); // adapterkey = 'textarea'
        factory.register(new SelectAdapterDefinition(defaultSelectAdapterKey, 80));     // adapterkey = 'select'

        // container around the native HTML form controls
        // Default container adapter keys look like this: 'container:input:type'
        factory.register(new ContainerInputAdapterDefinition('text', getContainerInputAdapterKey('text'), 80));
        factory.register(new ContainerInputAdapterDefinition('password', getContainerInputAdapterKey('password'), 80));
        factory.register(new ContainerInputAdapterDefinition('email', getContainerInputAdapterKey('email'), 80));
        factory.register(new ContainerInputAdapterDefinition('number', getContainerInputAdapterKey('number'), 80));
        factory.register(new ContainerInputAdapterDefinition('url', getContainerInputAdapterKey('url'), 80));
        factory.register(new ContainerInputAdapterDefinition('tel', getContainerInputAdapterKey('tel'), 80));
        factory.register(new ContainerInputAdapterDefinition('date', getContainerInputAdapterKey('date'), 80));
        factory.register(new ContainerInputAdapterDefinition('datetime-local', getContainerInputAdapterKey('datetime-local'), 80));
        factory.register(new ContainerInputAdapterDefinition('month', getContainerInputAdapterKey('month'), 80));
        factory.register(new ContainerInputAdapterDefinition('week', getContainerInputAdapterKey('week'), 80));
        factory.register(new ContainerInputAdapterDefinition('time', getContainerInputAdapterKey('time'), 80));
        factory.register(new ContainerCheckboxAdapterDefinition(getContainerInputAdapterKey('checkbox'), 80));
        factory.register(new ContainerRadioButtonsAdapterDefinition(getContainerInputAdapterKey('radio'), 80));
        factory.register(new ContainerFileInputAdapterDefinition(getContainerInputAdapterKey('file'), 80));
        factory.register(new ContainerTextAreaAdapterDefinition(defaultContainerTextAreaAdapterKey, 80)); // adapterkey = 'container:textarea'
        factory.register(new ContainerSelectAdapterDefinition(defaultContainerSelectAdapterKey, 80)); // adapterkey = 'container:select'
    }    
    /**
     * Retrieves the editor adapter definition associated with the given adapter key, if any.
     * @param adapterKey The unique adapter key of the editor adapter definition to retrieve.
     * Uses an exact match on the adapter key to find the corresponding definition.
     * @returns The editor adapter definition associated with the given adapter key, or null if none is found.
     */
    public getDefinition(adapterKey: string): IEditorAdapterDefinition | null
    {
        this.ensureLazyRegistration();
        for (const definition of this.registeredDefinitions) {
            if (definition.adapterKey === adapterKey) {
                return definition;
            }
        }
        return null;
    }

    /**
     * Finds an editor adapter definition that matches the given value host and element characteristics.
     * Effectively each IEditorAdapterDefinition.matches() function is called in priority order until a match is found.
     * 
     * @param valueHost The field value host to match against.
     * @param element The DOM element to match against.
     * @returns The matching editor adapter definition, or null if none is found.
     */
    public findDefinition(valueHost: IFieldValueHost, element: HTMLElement): IEditorAdapterDefinition | null
    {
        this.ensureLazyRegistration();
        if (!this.sortedDefinitions) {
            this._sortedDefinitions = [...this.registeredDefinitions].sort((a, b) => b.priority - a.priority);
        }
        for (const definition of this.sortedDefinitions!) {
            if (definition.matches(valueHost, element)) {
                return definition;
            }
        }
        return null;
    }
}