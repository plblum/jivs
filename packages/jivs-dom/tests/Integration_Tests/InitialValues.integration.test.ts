/** @jest-environment jsdom */
import { DictionaryReader, FormReader, ModelReader } from '@plblum/jivs-engine/build/ReaderWriter/Reader_classes';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { BooleanParser, CleanUpStringParser } from '@plblum/jivs-engine/build/DataTypes/DataTypeParsers';
import { StringFormatter } from '@plblum/jivs-engine/build/DataTypes/DataTypeFormatters';
import { LoggingCategory, LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { EditorReader } from '../../src/Editors/EditorReader';
import { createTestForm, type TestForm } from './TestingSupport/CreateTestForm';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { useCleanDocument } from './TestingSupport/TestFileSupport';

// When true, emits HTML and element registry information to the console.
let verbose = false;
useCleanDocument();

/**
 * Installs a generated page and attaches the same dispatchers as the static FormInstaller API.
 */
function installWithDispatchers(testForm: TestForm, useNativeValue: boolean = false): void
{
    testForm.page.assign();
    FormInstaller.install(testForm.vhm, testForm.collector, true, useNativeValue);
}

/**
 * Finds EditorReader warnings without counting unrelated service diagnostics.
 */
function editorReaderWarnings(testForm: TestForm)
{
    return testForm.services.loggingService.captured
        .filter(entry => entry.message.startsWith('No editor elements found')
            || entry.message.startsWith('No editor adapter definition found'))
        .map(entry => ({
            level: entry.level,
            category: entry.category,
            feature: entry.feature,
            type: entry.typeAsString,
            message: entry.message,
            data: entry.data
        }));
}

/**
 * Adds a number field rendered as text so malformed initial text can reach the real number parser.
 */
function createNumberTextRepository()
{
    let repository = createDefaultTestFieldRepository();
    repository.registerIdentity({
        name: 'Number_Text_Range',
        description: 'Number range field rendered as text to exercise parser failures',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Number, { parserLookupKey: LookupKey.Number })
                .dataTypeCheck().range(1, 100);
        },
        addEditor: (page, name, options) =>
        {
            let value = options.initialValue === undefined ? '' : `value='${ String(options.initialValue) }'`;
            page.inputEditor(name, 'text', options.presentationName, options.adapterKey,
                `${ value } ${ options.additionalAttributes ?? '' }`.trim());
        }
    });
    return repository;
}

// Values in HTML start in the editor controls, and the test helper must express each control type.
describe('Initial values in generated editors', () =>
{
    test('The initialValues map sets input, checkbox, select, radio, and date controls before installation', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required', 'Number_Range', 'Date_Required_LessThan', 'Checkbox', 'Select_Required', 'Radio_Required'],
            initialValues: {
                Text_Required: 'Ann',
                Number_Range: 42,
                Date_Required_LessThan: '2029-12-31',
                Checkbox: true,
                Select_Required: 'b',
                Radio_Required: 'y'
            },
            verbose: verbose
        });

        expect((t.element('editor', 'Text_Required') as HTMLInputElement).value).toBe('Ann');
        expect((t.element('editor', 'Number_Range') as HTMLInputElement).value).toBe('42');
        expect((t.element('editor', 'Date_Required_LessThan') as HTMLInputElement).value).toBe('2029-12-31');
        expect((t.element('editor', 'Checkbox') as HTMLInputElement).checked).toBe(true);
        expect((t.element('editor', 'Select_Required') as HTMLSelectElement).value).toBe('b');
        expect(document.querySelector<HTMLInputElement>("input[name='Radio_Required'][value='y']")!.checked).toBe(true);
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// Engine readers populate ValueHosts and the attached text-value dispatcher carries formatted values into editors.
describe('ModelReader, DictionaryReader, and FormReader initial values', () =>
{
    test('ModelReader copies a model value to its ValueHost and installed editor', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required'],
            initialValues: { Text_Required: 'HTML' },
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);

        new ModelReader(t.vhm, { Text_Required: 'Model' }).read();

        expect(t.vhm.getFieldValueHost('Text_Required')!.getValue()).toBe('Model');
        expect((t.element('editor', 'Text_Required') as HTMLInputElement).value).toBe('Model');
        expect(editorReaderWarnings(t)).toEqual([]);
    });

    test('DictionaryReader copies a dictionary value to its ValueHost and installed editor', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required'],
            initialValues: { Text_Required: 'HTML' },
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);

        new DictionaryReader(t.vhm, { Text_Required: 'Dictionary' }).read();

        expect(t.vhm.getFieldValueHost('Text_Required')!.getValue()).toBe('Dictionary');
        expect((t.element('editor', 'Text_Required') as HTMLInputElement).value).toBe('Dictionary');
        expect(editorReaderWarnings(t)).toEqual([]);
    });

    test('FormReader parses text into a native number and writes the formatted text to its editor', () =>
    {
        let t = createTestForm({
            fields: ['Number_Range'],
            initialValues: { Number_Range: '5' },
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);

        new FormReader(t.vhm, { Number_Range: '42' }).read();

        expect(t.vhm.getFieldValueHost('Number_Range')!.getValue()).toBe(42);
        expect(t.vhm.getFieldValueHost('Number_Range')!.getTextValue()).toBe('42');
        expect((t.element('editor', 'Number_Range') as HTMLInputElement).value).toBe('42');
        expect(editorReaderWarnings(t)).toEqual([]);
    });
});

// EditorReader transfers HTML editor values to FieldValueHosts and performs one preliminary validation pass.
describe('EditorReader initial values and preliminary validation', () =>
{
    test('EditorReader transfers editor values without dispatchers attached', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required', 'Number_Range'],
            initialValues: { Text_Required: 'HTML', Number_Range: 42 },
            install: false,
            verbose: verbose
        });
        t.page.assign();
        t.install();

        new EditorReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost('Text_Required')!.getTextValue()).toBe('HTML');
        expect(t.vhm.getFieldValueHost('Number_Range')!.getValue()).toBe(42);
        expect((t.element('editor', 'Text_Required') as HTMLInputElement).value).toBe('HTML');
        expect((t.element('editor', 'Number_Range') as HTMLInputElement).value).toBe('42');
        expect(editorReaderWarnings(t)).toEqual([]);
    });

    test('An attached text-value dispatcher does not write an EditorReader value back to its editor', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required'],
            initialValues: { Text_Required: 'HTML' },
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);
        let input = t.element('editor', 'Text_Required') as HTMLInputElement;
        let currentValue = input.value;
        let writeCount = 0;
        // The text looks unchanged either way, so count assignments to prove nothing was written.
        Object.defineProperty(input, 'value', {
            configurable: true,
            get: () => currentValue,
            set: (value: string) =>
            {
                writeCount++;
                currentValue = value;
            }
        });

        new EditorReader(t.vhm).read();

        expect(writeCount).toBe(0);
        expect(currentValue).toBe('HTML');
        expect(t.vhm.getFieldValueHost('Text_Required')!.getTextValue()).toBe('HTML');
        expect(editorReaderWarnings(t)).toEqual([]);
    });

    test('EditorReader reads a malformed number string, retains its InjectedError, and works with attached dispatchers', () =>
    {
        let t = createTestForm({
            repository: createNumberTextRepository(),
            fields: ['Number_Text_Range'],
            initialValues: { Number_Text_Range: 'not-a-number' },
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);
        let input = t.element('editor', 'Number_Text_Range') as HTMLInputElement;
        let field = t.vhm.getFieldValueHost('Number_Text_Range')!;

        new EditorReader(t.vhm).read();

        expect(field.getTextValue()).toBe('not-a-number');
        expect(field.getValue()).toBeUndefined();
        expect(field.getInjectedError()).toEqual(expect.objectContaining({ errorMessage: expect.any(String) }));
        expect(field.validationStatus).toBe(ValidationStatus.Invalid);
        expect(input.value).toBe('not-a-number');
        expect(t.element('error', 'Number_Text_Range').textContent).not.toBe('');
        expect(editorReaderWarnings(t)).toEqual([]);
    });

    test('Preliminary validation skips an empty required field and marks a bad range value', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required', 'Number_Range'],
            initialValues: { Text_Required: '', Number_Range: 150 },
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);

        new EditorReader(t.vhm).read();

        let requiredField = t.vhm.getFieldValueHost('Text_Required')!;
        let rangeField = t.vhm.getFieldValueHost('Number_Range')!;
        expect(requiredField.required).toBe(true);
        expect(requiredField.validationStatus).toBe(ValidationStatus.Valid);
        expect(requiredField.currentValidationState.issuesFound).toBeNull();
        expect(t.element('error', 'Text_Required').textContent).toBe('');
        expect(rangeField.validationStatus).toBe(ValidationStatus.Invalid);
        expect(rangeField.currentValidationState.issuesFound).not.toBeNull();
        expect(rangeField.currentValidationState.issuesFound).toHaveLength(1);
        expect(t.element('error', 'Number_Range').classList.contains('jivs-has-issues')).toBe(true);
        expect(editorReaderWarnings(t)).toEqual([]);
    });

    test('Running before editor installation logs one warning for each field and later installation allows reading', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required', 'Number_Range'],
            initialValues: { Text_Required: 'Ready', Number_Range: 20 },
            install: false,
            verbose: verbose
        });

        new EditorReader(t.vhm).read();

        expect(editorReaderWarnings(t)).toEqual([
            {
                level: LoggingLevel.Warn,
                category: undefined,
                feature: 'EditorReader',
                type: 'EditorReader',
                message: "No editor elements found for element identifier: 'Text_Required'",
                data: undefined
            },
            {
                level: LoggingLevel.Warn,
                category: undefined,
                feature: 'EditorReader',
                type: 'EditorReader',
                message: "No editor elements found for element identifier: 'Number_Range'",
                data: undefined
            }
        ]);

        t.page.assign();
        t.install();
        new EditorReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost('Text_Required')!.getTextValue()).toBe('Ready');
        expect(t.vhm.getFieldValueHost('Number_Range')!.getValue()).toBe(20);
        expect(editorReaderWarnings(t)).toHaveLength(2);
    });
});

// A reader replacement must not reset validation state for fields whose editors remain unchanged.
describe('EditorReader after partial form replacement', () =>
{
    test('Replacing one field and rebuilding the registry preserves another field validation state', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required', 'Number_Range'],
            fieldTemplates: { Text_Required: 'inContainer' },
            initialValues: { Text_Required: 'Before', Number_Range: 150 },
            install: false,
            verbose: verbose
        });
        t.page.assign();
        t.install();
        new EditorReader(t.vhm).read();
        let unchangedField = t.vhm.getFieldValueHost('Number_Range')!;
        let statusBefore = unchangedField.validationStatus;
        let issuesBefore = unchangedField.currentValidationState.issuesFound;

        let oldContainer = t.element('container', 'Text_Required');
        t.replace(oldContainer, page =>
        {
            page.label('Text_Required', 'Text_Required');
            page.inputEditor('Text_Required', 'text', null, null, "value='After'");
            page.errorDisplay('Text_Required');
        });
        t.registry.clear();
        t.install();
        new EditorReader(t.vhm).read();

        expect((t.element('editor', 'Text_Required') as HTMLInputElement).value).toBe('After');
        expect(t.vhm.getFieldValueHost('Text_Required')!.getTextValue()).toBe('After');
        expect(unchangedField.validationStatus).toBe(statusBefore);
        expect(unchangedField.currentValidationState.issuesFound).toEqual(issuesBefore);
        expect(unchangedField.validationStatus).toBe(ValidationStatus.Invalid);
        expect(editorReaderWarnings(t)).toEqual([]);
    });
});

// Missing data services are configuration errors and must be visible in captured logs.
describe('Initial value reader configuration errors', () =>
{
    test('ModelReader logs a missing DataTypeFormatter', () =>
    {
        let t = createTestForm({
            fields: ['Number_Range'],
            install: false,
            services: { registerFormatters: false },
            verbose: verbose
        });
        installWithDispatchers(t);
        t.services.dataTypeFormatterService.register(new StringFormatter());

        expect(() => new ModelReader(t.vhm, { Number_Range: 42 }).read())
            .toThrow(/No DataTypeFormatter for LookupKey "Number"/);

        let formatterError = t.services.loggingService.captured.find(entry =>
            entry.level === LoggingLevel.Error
            && entry.message.includes('No DataTypeFormatter for LookupKey "Number"'));
        expect(formatterError).toEqual(expect.objectContaining({
            category: LoggingCategory.Exception,
            feature: 'service',
            typeAsString: 'DataTypeFormatterService'
        }));
    });

    test('FormReader logs a missing DataTypeParser', () =>
    {
        let t = createTestForm({
            fields: ['Number_Range'],
            install: false,
            services: { registerDataTypeParsers: false },
            verbose: verbose
        });
        t.services.dataTypeParserService.register(new CleanUpStringParser(LookupKey.String, { trim: true }));
        t.page.assign();
        t.install();

        expect(() => new FormReader(t.vhm, { Number_Range: '42' }).read())
            .toThrow(/No DataTypeParser for LookupKey "Number"/);

        let parserError = t.services.loggingService.captured.find(entry =>
            entry.level === LoggingLevel.Error
            && entry.message.includes('No DataTypeParser for LookupKey "Number"'));
        expect(parserError).toEqual(expect.objectContaining({
            category: LoggingCategory.Exception,
            feature: 'service',
            typeAsString: 'DataTypeParserService'
        }));
    });
});

// Checkbox, select and radio controls report their state through EditorReader.
describe('EditorReader with checkbox, select, and radio editors', () =>
{
    test('Checked, selected, and chosen values reach their ValueHosts', () =>
    {
        let t = createTestForm({
            fields: ['Checkbox', 'Select_Required', 'Radio_Required'],
            initialValues: { Checkbox: true, Select_Required: 'b', Radio_Required: 'y' },
            install: false,
            verbose: verbose
        });
        // The checkbox adapter sends its text through the parser, so a Boolean parser must be registered.
        t.services.dataTypeParserService.register(new BooleanParser(['en'], { trueValues: ['true', 'on'], falseValues: ['false', ''] }));
        t.page.assign();
        t.install();

        new EditorReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost('Checkbox')!.getValue()).toBe(true);
        expect(t.vhm.getFieldValueHost('Select_Required')!.getValue()).toBe('b');
        expect(t.vhm.getFieldValueHost('Radio_Required')!.getValue()).toBe('y');
        expect(editorReaderWarnings(t)).toEqual([]);
    });
});

// Readers other than EditorReader push values into non-text editors through the attached dispatchers.
describe('FormReader and ModelReader with checkbox, select, and radio editors', () =>
{
    test('FormReader sets the select and radio editors', () =>
    {
        let t = createTestForm({
            fields: ['Select_Required', 'Radio_Required'],
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);

        new FormReader(t.vhm, { Select_Required: 'c', Radio_Required: 'z' }).read();

        expect(t.vhm.getFieldValueHost('Select_Required')!.getValue()).toBe('c');
        expect(t.vhm.getFieldValueHost('Radio_Required')!.getValue()).toBe('z');
        // Without a jivsValueAdapter on the element, the dispatchers do not write to select or radio controls.
        expect((t.element('editor', 'Select_Required') as HTMLSelectElement).value).toBe('');
    });

    test('ModelReader sets the checkbox ValueHost', () =>
    {
        let t = createTestForm({
            fields: ['Checkbox'],
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t, true);

        new ModelReader(t.vhm, { Checkbox: true }).read();

        expect(t.vhm.getFieldValueHost('Checkbox')!.getValue()).toBe(true);
        // Without a jivsValueAdapter on the element, the native value dispatcher does not check the box.
        expect((t.element('editor', 'Checkbox') as HTMLInputElement).checked).toBe(false);
    });
});

// Number and date native values appear as formatted text in their editors.
describe('ModelReader and DictionaryReader with number and date editors', () =>
{
    test('ModelReader formats a number and DictionaryReader formats a date into the editors', () =>
    {
        let t = createTestForm({
            fields: ['Number_Range', 'Date_Required_LessThan'],
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);

        new ModelReader(t.vhm, { Number_Range: 42 }).read();
        new DictionaryReader(t.vhm, { Date_Required_LessThan: new Date(2029, 11, 31) }).read();

        expect((t.element('editor', 'Number_Range') as HTMLInputElement).value).toBe('42');
        expect(t.vhm.getFieldValueHost('Date_Required_LessThan')!.getValue()).toEqual(new Date(2029, 11, 31));
        expect(t.vhm.getFieldValueHost('Date_Required_LessThan')!.getTextValue()).toBe('12/31/2029');
    });
});

// Every reader finishes with preliminary validation, and the option can turn it off.
describe('Preliminary validation after each reader', () =>
{
    test.each([
        ['ModelReader', (t: TestForm) => new ModelReader(t.vhm, { Number_Range: 150 })],
        ['DictionaryReader', (t: TestForm) => new DictionaryReader(t.vhm, { Number_Range: 150 })],
        ['FormReader', (t: TestForm) => new FormReader(t.vhm, { Number_Range: '150' })]
    ])('%s flags an out of range value', (_name, makeReader) =>
    {
        let t = createTestForm({ fields: ['Number_Range'], install: false, verbose: verbose });
        installWithDispatchers(t);

        makeReader(t).read();

        expect(t.vhm.getFieldValueHost('Number_Range')!.validationStatus).toBe(ValidationStatus.Invalid);
    });

    test('preliminaryValidation false leaves the field unvalidated', () =>
    {
        let t = createTestForm({ fields: ['Number_Range'], install: false, verbose: verbose });
        installWithDispatchers(t);

        new ModelReader(t.vhm, { Number_Range: 150 }, { preliminaryValidation: false }).read();

        expect(t.vhm.getFieldValueHost('Number_Range')!.validationStatus).toBe(ValidationStatus.NotAttempted);
    });
});

// A field missing from the source data keeps what the editor and ValueHost already hold.
describe('Readers with fields missing from the source', () =>
{
    test('ModelReader leaves the other field editor value alone', () =>
    {
        let t = createTestForm({
            fields: ['Text_Required', 'Number_Range'],
            initialValues: { Text_Required: 'Keep', Number_Range: 7 },
            install: false,
            verbose: verbose
        });
        installWithDispatchers(t);

        new ModelReader(t.vhm, { Number_Range: 9 }).read();

        expect((t.element('editor', 'Text_Required') as HTMLInputElement).value).toBe('Keep');
        expect(t.vhm.getFieldValueHost('Text_Required')!.getValue()).toBeUndefined();
        expect((t.element('editor', 'Number_Range') as HTMLInputElement).value).toBe('9');
    });
});
