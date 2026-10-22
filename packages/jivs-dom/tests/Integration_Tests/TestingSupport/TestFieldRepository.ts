/**
 * A repository of named test fields for integration tests.
 *
 * Each entry describes ONE property of a test-only model. Its name states its purpose,
 * such as 'Date_Required_LessThan'. An entry does two things:
 * - addToConfig(): add its FieldValueHostConfig (and validators) to a Builder.
 * - addToHtml(): add the editor and its companion elements to a TestHtmlBuilder.
 *
 * A test chooses entry names and the helpers assemble the matching manager configuration and form.
 */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { IValueHostsManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';
import type { TestHtmlBuilder } from '../Integration_Testing';

/** Chooses which companion elements accompany the editor. */
export interface FieldBlockOptions
{
    /** Default true. A label whose text is the field name. */
    label?: boolean;
    /** Default true only for entries with a required validator. */
    requiredIndicator?: boolean;
    /** Default true. Displays error messages. */
    errorDisplay?: boolean;
    /** Default false. Visually hidden element used by ARIA. */
    ariaError?: boolean;
    /** Default false. Wraps all elements for the field in a field container. */
    container?: boolean;
    /** Presentation name given to the editor. */
    editorPresentationName?: string | null;
}

export interface ITestFieldEntry
{
    /** Unique name. It is the ValueHost name and the data-field value. */
    readonly name: string;
    readonly description: string;
    /** True when the field has a required validator. */
    readonly isRequired: boolean;
    addToConfig(builder: IValueHostsManagerConfigBuilder): void;
    addToHtml(page: TestHtmlBuilder, options?: FieldBlockOptions): void;
}

export type EditorHtmlWriter = (page: TestHtmlBuilder, name: string, presentationName: string | null) => void;
export type FieldConfigWriter = (builder: IValueHostsManagerConfigBuilder, name: string) => void;

export class TestFieldEntry implements ITestFieldEntry
{
    constructor(
        public readonly name: string,
        public readonly description: string,
        public readonly isRequired: boolean,
        private readonly configWriter: FieldConfigWriter,
        private readonly editorWriter: EditorHtmlWriter)
    {
    }

    public addToConfig(builder: IValueHostsManagerConfigBuilder): void
    {
        this.configWriter(builder, this.name);
    }

    public addToHtml(page: TestHtmlBuilder, options: FieldBlockOptions = {}): void
    {
        const target = options.container ? page.fieldContainer(this.name) : page;
        if (options.label ?? true)
            target.label(this.name, this.name);
        this.editorWriter(target, this.name, options.editorPresentationName ?? null);
        if (options.requiredIndicator ?? this.isRequired)
            target.requiredIndicator(this.name, '*');
        if (options.errorDisplay ?? true)
            target.errorDisplay(this.name);
        if (options.ariaError)
            target.ariaError(this.name);
    }
}

export class TestFieldRepository
{
    private readonly entries = new Map<string, ITestFieldEntry>();

    public register(entry: ITestFieldEntry): this
    {
        if (this.entries.has(entry.name))
            throw new Error(`Test field '${ entry.name }' is already registered.`);
        this.entries.set(entry.name, entry);
        return this;
    }

    public get(name: string): ITestFieldEntry
    {
        const entry = this.entries.get(name);
        if (!entry)
            throw new Error(`Test field '${ name }' is not registered. Registered: ${ this.names().join(', ') }`);
        return entry;
    }

    public names(): string[]
    {
        return Array.from(this.entries.keys());
    }
}

/** Common editor and validation combinations. Extend with register() for specific tests. */
export function createDefaultTestFieldRepository(): TestFieldRepository
{
    const repository = new TestFieldRepository();
    repository.register(new TestFieldEntry('Text_Required',
        'Text input with a required validator', true,
        (builder, name) => { builder.field(name, LookupKey.String).requireText(); },
        (page, name, presentation) => { page.inputEditor(name, 'text', presentation); }));

    repository.register(new TestFieldEntry('Number_Range',
        'Number input that must be 1 to 100', false,
        (builder, name) =>
        {
            builder.field(name, LookupKey.Number, { parserLookupKey: LookupKey.Number })
                .dataTypeCheck().range(1, 100);
        },
        (page, name, presentation) => { page.inputEditor(name, 'number', presentation); }));

    repository.register(new TestFieldEntry('Date_Required_LessThan',
        'Required date input that must be before 2030-01-01', true,
        (builder, name) =>
        {
            builder.field(name, LookupKey.Date, { parserLookupKey: LookupKey.Date })
                .requireText().dataTypeCheck().lessThan(new Date(2030, 0, 1));
        },
        (page, name, presentation) => { page.inputEditor(name, 'date', presentation); }));

    repository.register(new TestFieldEntry('Checkbox',
        'Checkbox bound to a boolean', false,
        (builder, name) => { builder.field(name, LookupKey.Boolean); },
        (page, name, presentation) => { page.checkboxEditor(name, presentation); }));

    repository.register(new TestFieldEntry('Select_Required',
        'Select with a required validator', true,
        (builder, name) => { builder.field(name, LookupKey.String).requireText(); },
        (page, name, presentation) =>
        {
            page.selectEditor(name, [
                { value: '', text: '' },
                { value: 'a', text: 'Apple' },
                { value: 'b', text: 'Banana' }
            ], presentation);
        }));

    repository.register(new TestFieldEntry('Radio_Required',
        'Radio buttons with a required validator', true,
        (builder, name) => { builder.field(name, LookupKey.String).requireText(); },
        (page, name, presentation) => { page.radioEditor(name, name, ['x', 'y', 'z'], presentation); }));

    return repository;
}
