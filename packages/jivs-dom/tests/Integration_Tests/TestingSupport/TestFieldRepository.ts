/**
 * A repository of Field Identities and templates for integration tests.
 *
 * A Field Identity is one property of a test-only model, named for its purpose, such as 'Date_Required_LessThan'.
 * It packages two things:
 * - addConfig(): adds its FieldValueHostConfig and validators to a Builder.
 * - addEditor(): adds the editor element to a TestHtmlBuilder.
 *
 * Field templates are shared recipes that surround the editor with the other roles
 * (label, required indicator, error display...). Any Field Identity can use any field template.
 * Form templates are recipes for a whole form that call TestHtmlBuilder.field() for each identity.
 *
 * Templates are recipes (functions) instead of HTML strings so that TestHtmlBuilder
 * remains the only code that creates elements, ids, and test descriptors.
 */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { IValueHostsManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';
import type { FieldEditorOptions, IFieldTemplateSource, TestHtmlBuilder } from '../Integration_Testing';

export interface ITestFieldIdentity
{
    /** Unique name. It is the ValueHost name and the data-field value. */
    readonly name: string;
    /** Describes the purpose for people reading the tests. */
    readonly description: string;
    addConfig(builder: IValueHostsManagerConfigBuilder, name: string): void;
    addEditor(page: TestHtmlBuilder, name: string, options: FieldEditorOptions): void;
}

/** What a field template receives. addEditor writes the identity's editor into any builder. */
export interface IFieldTemplateTarget
{
    readonly name: string;
    addEditor(target: TestHtmlBuilder): void;
}

export type FieldTemplateRecipe = (page: TestHtmlBuilder, field: IFieldTemplateTarget) => void;
export type FormTemplateRecipe = (page: TestHtmlBuilder) => void;

export const defaultFieldTemplateName = 'default';

export class TestFieldRepository implements IFieldTemplateSource
{
    private readonly identities = new Map<string, ITestFieldIdentity>();
    private readonly fieldTemplates = new Map<string, FieldTemplateRecipe>();
    private readonly formTemplates = new Map<string, FormTemplateRecipe>();

    public registerIdentity(identity: ITestFieldIdentity): this
    {
        if (this.identities.has(identity.name))
            throw new Error(`Field Identity '${ identity.name }' is already registered.`);
        this.identities.set(identity.name, identity);
        return this;
    }

    public registerFieldTemplate(name: string, recipe: FieldTemplateRecipe): this
    {
        if (this.fieldTemplates.has(name))
            throw new Error(`Field template '${ name }' is already registered.`);
        this.fieldTemplates.set(name, recipe);
        return this;
    }

    public registerFormTemplate(name: string, recipe: FormTemplateRecipe): this
    {
        if (this.formTemplates.has(name))
            throw new Error(`Form template '${ name }' is already registered.`);
        this.formTemplates.set(name, recipe);
        return this;
    }

    public getIdentity(name: string): ITestFieldIdentity
    {
        return TestFieldRepository.lookup(this.identities, name, 'Field Identity');
    }

    public identityNames(): string[]
    {
        return Array.from(this.identities.keys());
    }

    public fieldTemplateNames(): string[]
    {
        return Array.from(this.fieldTemplates.keys());
    }

    public formTemplateNames(): string[]
    {
        return Array.from(this.formTemplates.keys());
    }

    public buildField(page: TestHtmlBuilder, name: string, templateName?: string | null,
        editorOptions?: FieldEditorOptions): void
    {
        const identity = this.getIdentity(name);
        const recipe = TestFieldRepository.lookup(this.fieldTemplates, templateName ?? defaultFieldTemplateName, 'Field template');
        recipe(page, {
            name,
            addEditor: (target) => identity.addEditor(target, name, editorOptions ?? {})
        });
    }

    public buildForm(page: TestHtmlBuilder, templateName: string): void
    {
        TestFieldRepository.lookup(this.formTemplates, templateName, 'Form template')(page);
    }

    private static lookup<T>(map: Map<string, T>, name: string, kind: string): T
    {
        const item = map.get(name);
        if (!item)
            throw new Error(`${ kind } '${ name }' is not registered. Registered: ${ Array.from(map.keys()).join(', ') }`);
        return item;
    }
}

function valueAttribute(options: FieldEditorOptions): string
{
    if (options.initialValue === undefined)
        return options.additionalAttributes ?? '';
    const value = String(options.initialValue).replace(/&/g, '&amp;').replace(/'/g, '&#39;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `${ options.additionalAttributes ?? ''} value='${ value }'`.trim();
}

function selectedValue(options: FieldEditorOptions): string | undefined
{
    return options.initialValue === undefined ? undefined : String(options.initialValue);
}

/** Starter Field Identities and field templates. Extend with the register methods for specific tests. */
export function createDefaultTestFieldRepository(): TestFieldRepository
{
    const repository = new TestFieldRepository();

    repository.registerIdentity({
        name: 'Text_Required',
        description: 'Text input with a required validator',
        addConfig: (builder, name) => { builder.field(name, LookupKey.String).requireText(); },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, valueAttribute(o));
        }
    });

    repository.registerIdentity({
        name: 'Number_Range',
        description: 'Number input that must be 1 to 100',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Number, { parserLookupKey: LookupKey.Number })
                .dataTypeCheck().range(1, 100);
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'number', o.presentationName, o.adapterKey, valueAttribute(o));
        }
    });

    repository.registerIdentity({
        name: 'Date_Required_LessThan',
        description: 'Required date input that must be before 2030-01-01',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Date, { parserLookupKey: LookupKey.Date })
                .requireText().dataTypeCheck().lessThan(new Date(2030, 0, 1));
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'date', o.presentationName, o.adapterKey, valueAttribute(o));
        }
    });

    repository.registerIdentity({
        name: 'Checkbox',
        description: 'Checkbox bound to a boolean',
        addConfig: (builder, name) => { builder.field(name, LookupKey.Boolean); },
        addEditor: (page, name, o) =>
        {
            const checked = o.initialValue === true ? ' checked' : '';
            page.checkboxEditor(name, o.presentationName, o.adapterKey, `${ o.additionalAttributes ?? ''}${ checked }`);
        }
    });

    repository.registerIdentity({
        name: 'Select_Required',
        description: 'Select with a required validator',
        addConfig: (builder, name) => { builder.field(name, LookupKey.String).requireText(); },
        addEditor: (page, name, o) =>
        {
            page.selectEditor(name, [
                { value: '', text: '' },
                { value: 'a', text: 'Apple' },
                { value: 'b', text: 'Banana' }
            ], o.presentationName, o.adapterKey, o.additionalAttributes, selectedValue(o));
        }
    });

    repository.registerIdentity({
        name: 'Radio_Required',
        description: 'Radio buttons with a required validator',
        addConfig: (builder, name) => { builder.field(name, LookupKey.String).requireText(); },
        addEditor: (page, name, o) =>
        {
            page.radioEditor(name, name, ['x', 'y', 'z'], o.presentationName, o.adapterKey,
                o.additionalAttributes, selectedValue(o));
        }
    });

    // The label text is always the Field Identity name.
    repository.registerFieldTemplate(defaultFieldTemplateName, (page, field) =>
    {
        page.label(field.name, field.name);
        field.addEditor(page);
        page.errorDisplay(field.name);
    });
    repository.registerFieldTemplate('withRequired', (page, field) =>
    {
        page.label(field.name, field.name);
        field.addEditor(page);
        page.requiredIndicator(field.name, '*');
        page.errorDisplay(field.name);
    });
    repository.registerFieldTemplate('labelAfter', (page, field) =>
    {
        field.addEditor(page);
        page.label(field.name, field.name);
        page.errorDisplay(field.name);
    });
    repository.registerFieldTemplate('withAriaError', (page, field) =>
    {
        page.label(field.name, field.name);
        field.addEditor(page);
        page.errorDisplay(field.name);
        page.ariaError(field.name);
    });
    repository.registerFieldTemplate('inContainer', (page, field) =>
    {
        const container = page.fieldContainer(field.name);
        container.label(field.name, field.name);
        field.addEditor(container);
        container.requiredIndicator(field.name, '*');
        container.errorDisplay(field.name);
    });
    repository.registerFieldTemplate('editorOnly', (page, field) => { field.addEditor(page); });

    return repository;
}
