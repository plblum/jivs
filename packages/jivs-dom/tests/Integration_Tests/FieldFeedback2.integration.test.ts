/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { NumberParser, ShortDatePatternParser } from '@plblum/jivs-engine/build/DataTypes/DataTypeParsers';
import { ValidationSeverity, ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { createTestForm, TestForm } from './TestingSupport/CreateTestForm';
import { createDefaultTestFieldRepository, defaultFieldTemplateName, ITestFieldIdentity } from './TestingSupport/TestFieldRepository';
import { expectElementsMatchValidationState, expectIssueCodes, fieldElementsByRole, installForm, installPopupForm } from './TestingSupport/FieldFeedbackExpectations';
import { useCleanDocument } from './TestingSupport/TestFileSupport';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { FieldContainerPresentation } from '../../src/FieldPresentations/FieldContainerPresentation';
import { LabelPresentation } from '../../src/FieldPresentations/LabelPresentation';
import { RequiredIndicatorPresentation } from '../../src/FieldPresentations/RequiredIndicatorPresentation';
import { TextInputPresentation } from '../../src/FieldPresentations/TextInputPresentation';

// When true, emits HTML and element registry information to the console.
let verbose = false;
useCleanDocument();

const upperMax5: ITestFieldIdentity['addConfig'] = (builder, name) =>
{
    builder.field(name, LookupKey.String)
        .requireText('REQ-MSG')
        // RegExp acts as a DataTypeCheck, which defaults to Severe and would stop the validators after it
        .regExp(/^[A-Z]*$/, { errorMessage: 'UPPER-MSG', severity: ValidationSeverity.Error })
        .stringLength(5, 'LEN-MSG');
};
// Matches the first three values only. The select and radio buttons also offer values that don't match.
const choiceValues = ['red', 'green', 'blue', 'cyan', 'pink'];
const choice: ITestFieldIdentity['addConfig'] = (builder, name) =>
{
    builder.field(name, LookupKey.String)
        .requireText('REQ-MSG')
        .regExp(/^(red|green|blue)$/, { errorMessage: 'CHOICE-MSG', severity: ValidationSeverity.Error });
};

/** The Field Identities for this file only. They add to the default repository. */
function createRepository()
{
    const repository = createDefaultTestFieldRepository();
    repository.registerIdentity({
        name: 'Text_Upper_Max5',
        description: 'Text input that is required, all uppercase letters, and at most 5 characters',
        addConfig: upperMax5,
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Text_Upper_Max5_Optional',
        description: 'Text_Upper_Max5 without requireText, so an empty value is allowed',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .regExp(/^[A-Z]*$/, { errorMessage: 'UPPER-MSG', severity: ValidationSeverity.Error })
                .stringLength(5, 'LEN-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Number_Text_Range',
        description: 'Text input for a number that must be 1 to 100. Text input lets the user type non-numeric text, which a number input would not allow',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Number, { parserLookupKey: LookupKey.Number })
                .dataTypeCheck('TYPE-MSG').range(1, 100, 'RANGE-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Number_Parse_Format',
        description: 'Text input that parses numbers and reformats them with grouping separators',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Number, {
                parserLookupKey: LookupKey.Number,
                formatterLookupKey: LookupKey.Number,
                reformatTextValue: true
            }).dataTypeCheck();
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Date_Text_LessThan',
        description: 'Text input for a date that must be before 2030-01-01. Needs the date parser from dateParsers',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Date, { parserLookupKey: LookupKey.Date })
                .dataTypeCheck('TYPE-MSG').lessThan(new Date(2030, 0, 1), 'LESS-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Text_Required_Only',
        description: 'String input whose only validator is requireText',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String).requireText('REQ-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'String_Range_Required_Length',
        description: 'String input with validators that support duringEdit and a range validator that does not',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .range('A', 'C', 'RANGE-MSG')
                .stringLength(1, { minimum: 1, errorMessage: 'LEN-MSG' })
                .requireText('REQ-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'TextArea_Upper_Max5',
        description: 'Textarea with the same validators as Text_Upper_Max5',
        addConfig: upperMax5,
        addEditor: (page, name, o) =>
        {
            page.textAreaEditor(name, o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Number_Range_Fixed',
        description: 'Number input that must be 1 to 100',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Number, { parserLookupKey: LookupKey.Number })
                .dataTypeCheck().range(1, 100, 'RANGE-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'number', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Select_Choice',
        description: 'Select that is required and must be red, green or blue',
        addConfig: choice,
        addEditor: (page, name, o) =>
        {
            page.selectEditor(name, [{ value: '', text: '' }, ...choiceValues.map(v => ({ value: v, text: v }))],
                o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Radio_Choice',
        description: 'Radio buttons that are required and must be red, green or blue',
        addConfig: choice,
        addEditor: (page, name, o) =>
        {
            page.radioEditor(name, name, choiceValues, o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Checkbox_Required',
        description: 'Checkbox that must be checked',
        addConfig: (builder, name) => { builder.field(name, LookupKey.String).requireText('REQ-MSG'); },
        addEditor: (page, name, o) =>
        {
            page.checkboxEditor(name, o.presentationName, o.adapterKey,
                `${ o.additionalAttributes ?? '' }${ o.initialValue === true ? ' checked' : '' }`);
        }
    });
    return repository;
}

function fireChange(element: HTMLElement): void
{
    // bubbles:true because listeners may sit above the editor
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

function fireInput(element: HTMLElement): void
{
    // The editor listens for input when duringEdit validation is enabled.
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

/** The user types or selects a value in the editor and leaves it. */
function userEdits(t: TestForm, value: string): void
{
    let editor = t.element('editor') as unknown as HTMLInputElement;
    editor.value = value;
    fireChange(editor);
}

/**
 * One editor type under test. The form is identical for the invalid and valid values.
 * Only the user's action differs.
 */
interface EditorCase
{
    identity: string;
    /** Placed into the editor before installation. Used for a checkbox that starts checked. */
    initialValue?: boolean;
    /** The user's action. The value is the invalidInput or validInput. */
    edit: (t: TestForm, value: string) => void;
    invalidInput: string;
    validInput: string;
}

const editorCases: EditorCase[] = [
    { identity: 'Text_Upper_Max5', edit: userEdits, invalidInput: 'abcdefg', validInput: 'ABCDE' },
    { identity: 'TextArea_Upper_Max5', edit: userEdits, invalidInput: 'abcdefg', validInput: 'ABCDE' },
    { identity: 'Number_Range_Fixed', edit: userEdits, invalidInput: '150', validInput: '50' },
    { identity: 'Select_Choice', edit: userEdits, invalidInput: 'cyan', validInput: 'green' },
    {
        identity: 'Radio_Choice', invalidInput: 'cyan', validInput: 'green',
        edit: (t, value) =>
        {
            // A user picks any radio in the group, and the picked one fires change.
            let radio = document.querySelector<HTMLInputElement>(`input[type=radio][value='${ value }']`)!;
            radio.checked = true;
            fireChange(radio);
        }
    },
    {
        // Invalid: starts checked and the user unchecks it. Valid: starts unchecked and the user checks it.
        identity: 'Checkbox_Required', initialValue: true, invalidInput: 'uncheck', validInput: 'check',
        edit: (t, value) =>
        {
            let box = t.element('editor') as unknown as HTMLInputElement;
            box.checked = value === 'check';
            fireChange(box);
        }
    }
];

function installField(identity: string, initialValue?: boolean): TestForm
{
    return installForm({
        repository: createRepository(), fields: [identity], verbose: verbose,
        initialValues: initialValue === undefined ? undefined : { [identity]: initialValue }
    });
}

function installDuringEditField(identity: string): TestForm
{
    let t = createTestForm({
        repository: createRepository(), fields: [identity], install: false,
        configAnalysisCheck: true, verbose: verbose
    });
    t.services.domServices.options.validationBehaviors.duringEdit = true;
    t.page.assign();
    FormInstaller.install(t.vhm, t.collector);
    return t;
}

// The template emits all four roles. The tools find them through the ElementRegistry.
describe('fieldElementsByRole', () =>
{
    test('Finds each role the template emitted for the field', () =>
    {
        let t = installField('Text_Upper_Max5');
        expect(Array.from(fieldElementsByRole(t, 'Text_Upper_Max5').keys()).sort())
            .toEqual(['editor', 'error', 'label', 'required']);
    });
});

/**
 * Input validates only validators that support duringEdit; change validates all three against the completed value.
 * A too-long value fails StringLength, and an empty value fails RequiredText; Range is deferred until change.
 */
describe('Validators that support duringEdit run on input; all validators run on change', () =>
{
    test('Input skips Range; change evaluates all configured validators', () =>
    {
        let identity = 'String_Range_Required_Length';
        let t = installDuringEditField(identity);
        let editor = t.element('editor') as HTMLInputElement;
        editor.value = 'DE';
        fireInput(editor);

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.StringLength]);

        fireChange(editor);

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.Range, ConditionType.StringLength]);
        expect(t.services.loggingService.entryCount).toBe(0);

        editor.value = '';
        fireInput(editor);

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.RequireText]);

        fireChange(editor);

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.RequireText]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * One change event updates every element from the field's ValueHostValidationState.
 * The same form is used for the invalid and valid values.
 */
describe('One change event updates the elements to match the validation state', () =>
{
    test.each(editorCases)('Baseline before any edit is NotAttempted with no feedback: $identity', (c) =>
    {
        let t = installField(c.identity, c.initialValue);
        expectElementsMatchValidationState(t, c.identity, ValidationStatus.NotAttempted);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test.each(editorCases)('Invalid value: $identity', (c) =>
    {
        let t = installField(c.identity, c.initialValue);
        c.edit(t, c.invalidInput);
        expectElementsMatchValidationState(t, c.identity, ValidationStatus.Invalid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test.each(editorCases)('Valid value: $identity', (c) =>
    {
        // The checkbox's valid case starts unchecked, so initialValue is not passed.
        let t = installField(c.identity);
        c.edit(t, c.validInput);
        expectElementsMatchValidationState(t, c.identity, ValidationStatus.Valid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * Group C: validate() called by the website, rather than by user events.
 * C-1: after install, before any event or validate(), the field has not been validated, so no feedback shows,
 * even though it has validators that would fail on an empty value.
 */
describe('validate() baseline', () =>
{
    test('Field with several validators is NotAttempted with no feedback after install', () =>
    {
        let identity = 'String_Range_Required_Length';
        let t = installDuringEditField(identity);

        expectElementsMatchValidationState(t, identity, ValidationStatus.NotAttempted);
        expect(t.vhm.getFieldValueHost(identity)!.currentValidationState.issuesFound).toBeNull();
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // Preliminary skips Category=Require, so existing text is checked but missing text is not reported.
    test('validate({preliminary:true}) reports a failing value but not a missing one', () =>
    {
        let identity = 'String_Range_Required_Length';
        let t = installField(identity);
        // The site loads its model into the ValueHostsManager; reset keeps the field NotAttempted.
        t.vhm.getFieldValueHost(identity)!.setValue('XYZ', { reset: true });
        t.vhm.validate({ preliminary: true });

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.Range, ConditionType.StringLength]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // An empty field: preliminary skips RequireText so nothing is reported; a normal validate() then reports it.
    test('validate({preliminary:true}) skips RequireText on an empty field; validate() reports it', () =>
    {
        let identity = 'Text_Required_Only';
        let t = installField(identity);
        // An empty editor is text '' (not an unset field), which is what RequireText inspects.
        t.vhm.getFieldValueHost(identity)!.setTextValue('', { reset: true });

        t.vhm.validate({ preliminary: true });

        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid);
        expectIssueCodes(t, identity, []);

        t.vhm.validate();

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.RequireText]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // Group validation by the website. Each field's text is empty, so RequireText fails once its group is validated.
    function installTwoGroups(): { t: TestForm, a: string, b: string }
    {
        let a = 'Text_Required_Only';
        let b = 'String_Range_Required_Length';
        let t = installForm({
            repository: createRepository(), fields: [a, b], verbose: verbose,
            configure: (config) =>
            {
                for (let vhc of config.valueHostConfigs)
                    (vhc as any).group = vhc.name === a ? 'GroupA' : 'GroupB';
            }
        });
        // Load the model's empty text into both fields without validating, as a site does before validating by group.
        for (let name of [a, b])
            t.vhm.getFieldValueHost(name)!.setTextValue('', { reset: true });
        expectElementsMatchValidationState(t, a, ValidationStatus.NotAttempted);
        expectElementsMatchValidationState(t, b, ValidationStatus.NotAttempted);
        return { t, a, b };
    }

    test('validate({group}) updates only the fields in that group', () =>
    {
        let { t, a, b } = installTwoGroups();

        t.vhm.validate({ group: 'GroupA' });

        expectElementsMatchValidationState(t, a, ValidationStatus.Invalid);
        expectIssueCodes(t, a, [ConditionType.RequireText]);
        expectElementsMatchValidationState(t, b, ValidationStatus.NotAttempted);

        t.vhm.validate({ group: 'GroupB' });

        expectElementsMatchValidationState(t, a, ValidationStatus.Invalid);
        expectElementsMatchValidationState(t, b, ValidationStatus.Invalid);
        expectIssueCodes(t, b, [ConditionType.RequireText]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // No group, or '*', means every group.
    test.each([
        { name: 'no options', options: undefined },
        { name: 'empty options', options: {} },
        { name: "group '*'", options: { group: '*' } }
    ])('validate() with $name updates the fields of all groups', (c) =>
    {
        let { t, a, b } = installTwoGroups();

        t.vhm.validate(c.options);

        expectElementsMatchValidationState(t, a, ValidationStatus.Invalid);
        expectIssueCodes(t, a, [ConditionType.RequireText]);
        expectElementsMatchValidationState(t, b, ValidationStatus.Invalid);
        expectIssueCodes(t, b, [ConditionType.RequireText]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // The user edits the editor (the change event validates), then the website calls validate().
    // The elements follow the latest state each time.
    test('validate() after each user edit keeps the elements matching the state', () =>
    {
        let identity = 'String_Range_Required_Length';
        let t = installField(identity);

        userEdits(t, 'XYZ');
        t.vhm.validate();
        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.Range, ConditionType.StringLength]);

        userEdits(t, 'B');
        t.vhm.validate();
        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid);
        expectIssueCodes(t, identity, []);

        userEdits(t, '');
        t.vhm.validate();
        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        expectIssueCodes(t, identity, [ConditionType.RequireText]);

        userEdits(t, 'C');
        t.vhm.validate();
        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid);
        expectIssueCodes(t, identity, []);

        // repeat without changes as if the user clicked submit again
        t.vhm.validate();
        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid);
        expectIssueCodes(t, identity, []);

        // repeat with the user entering the same value
        userEdits(t, 'C');
        t.vhm.validate();
        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid);
        expectIssueCodes(t, identity, []);

        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * The data type check and the validators after it have different severities.
 * DataTypeCheck is Severe: the text could not be parsed, so the later validators have nothing to evaluate
 * and don't run. A failing range or lessThan is an Error. Text inputs are used so the user can type
 * text a number or date input would refuse. The issuesFound array shows which validator spoke.
 */
describe('DataTypeCheck versus a value validator', () =>
{
    interface TypeCase { identity: string; unparseable: string; outOfRange: string; valid: string; valueCode: ConditionType; }
    const typeCases: TypeCase[] = [
        { identity: 'Number_Text_Range', unparseable: 'abc', outOfRange: '150', valid: '50', valueCode: ConditionType.Range },
        { identity: 'Date_Text_LessThan', unparseable: 'abc', outOfRange: '12/31/2031', valid: '1/1/2020', valueCode: ConditionType.LessThan }
    ];

    // The engine's default parsers handle String and Number. The date parser is supplied here,
    // for the same cultureIds that the services register ('en' is the default culture).
    function installTypeForm(identity: string): TestForm
    {
        return installForm({
            repository: createRepository(), fields: [identity], verbose: verbose,
            servicesConfigOptions: {
                defaultCultureId: 'en',
                cultures: [{ cultureId: 'en' }, { cultureId: 'en-US', fallbackCultureId: 'en' }],
                dataTypeParsers: [new ShortDatePatternParser(LookupKey.Date, ['en', 'en-US'],
                    { order: 'mdy', shortDateSeparator: '/' })]
            }
        });
    }

    function issues(t: TestForm, identity: string)
    {
        return t.vhm.getFieldValueHost(identity)!.currentValidationState.issuesFound ?? [];
    }

    test.each(typeCases)('Unparseable text reports only a Severe DataTypeCheck: $identity', (c) =>
    {
        let t = installTypeForm(c.identity);
        userEdits(t, c.unparseable);
        expectElementsMatchValidationState(t, c.identity, ValidationStatus.Invalid);
        expect(issues(t, c.identity).map(i => [i.errorCode, i.severity]))
            .toEqual([[ConditionType.DataTypeCheck, ValidationSeverity.Severe]]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test.each(typeCases)('A parsed value that fails reports only an Error: $identity', (c) =>
    {
        let t = installTypeForm(c.identity);
        userEdits(t, c.outOfRange);
        expectElementsMatchValidationState(t, c.identity, ValidationStatus.Invalid);
        expect(issues(t, c.identity).map(i => [i.errorCode, i.severity]))
            .toEqual([[c.valueCode, ValidationSeverity.Error]]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test.each(typeCases)('A valid value reports no issues: $identity', (c) =>
    {
        let t = installTypeForm(c.identity);
        userEdits(t, c.valid);
        expectElementsMatchValidationState(t, c.identity, ValidationStatus.Valid);
        expect(issues(t, c.identity)).toEqual([]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * A changed text value is parsed into its native number, then reformatted and dispatched back to the editor.
 * The grouping separator makes both conversion directions visible.
 */
describe('Number parser and formatter value flow', () =>
{
    test('Parses 1000 and updates the editor with the formatted text 1,000 when reformatTextValue=true', () =>
    {
        let identity = 'Number_Parse_Format';
        let t = installForm({
            repository: createRepository(), fields: [identity], configAnalysisCheck: true, verbose: verbose,
            servicesConfigOptions: {
                defaultCultureId: 'en',
                cultures: [{ cultureId: 'en' }, { cultureId: 'en-US', fallbackCultureId: 'en' }]
            }
        });
        let editor = t.element('editor') as HTMLInputElement;
        editor.value = '1000';
        fireChange(editor);

        let valueHost = t.vhm.getFieldValueHost(identity)!;
        expect(valueHost.getValue()).toBe(1000);
        expect(valueHost.getTextValue()).toBe('1,000');
        expect(editor.value).toBe('1,000');
        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Directly setting native value 1000 formats and dispatches text 1,000 to the editor', () =>
    {
        let identity = 'Number_Parse_Format';
        let t = installForm({
            repository: createRepository(), fields: [identity], configAnalysisCheck: true, verbose: verbose,
            servicesConfigOptions: {
                defaultCultureId: 'en',
                cultures: [{ cultureId: 'en' }, { cultureId: 'en-US', fallbackCultureId: 'en' }]
            }
        });

        t.vhm.getFieldValueHost(identity)!.setValue(1000);

        let valueHost = t.vhm.getFieldValueHost(identity)!;
        let editor = t.element('editor') as HTMLInputElement;
        expect(valueHost.getValue()).toBe(1000);
        expect(valueHost.getTextValue()).toBe('1,000');
        expect(editor.value).toBe('1,000');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // Debug logging exposes the engine's reformat decision. The editor is only rewritten when the text changed.
    test('Already formatted text 1,000 parses to 1000 and is not reformatted when reformatTextValue is true', () =>
    {
        let identity = 'Number_Parse_Format';
        let t = installForm({
            repository: createRepository(), fields: [identity], configAnalysisCheck: true, verbose: verbose,
            servicesConfigOptions: {
                defaultCultureId: 'en',
                cultures: [{ cultureId: 'en' }, { cultureId: 'en-US', fallbackCultureId: 'en' }],
                loggerLevel: LoggingLevel.Debug,
                // Replace the default parsers: the engine's NumberParser has no thousandsSeparator, and register() never replaces.
                registerDataTypeParsers: false,
                dataTypeParsers: [new NumberParser(['en', 'en-US'],
                    { decimalSeparator: '.', thousandsSeparator: ',', negativeSymbol: '-' })]
            }
        });
        let editor = t.element('editor') as HTMLInputElement;
        editor.value = '1,000';
        fireChange(editor);

        let valueHost = t.vhm.getFieldValueHost(identity)!;
        let logger = t.services.loggingService;
        expect(valueHost.getValue()).toBe(1000);
        expect(valueHost.getTextValue()).toBe('1,000');
        expect(editor.value).toBe('1,000');
        expect(logger.findMessage('Reformatted text value is the same as original. No change.', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Reformatting updated text value', LoggingLevel.Debug)).toBeNull();
        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid);
    });
});

/**
 * jivs-validated and jivs-corrected are optional state classes on every role,
 * but both are off by default. Registering replacements per test turns them on for every role.
 * jivs-corrected lasts for one validation cycle: only the first valid edit after an invalid one gets it.
 */
describe('jivs-validated and jivs-corrected classes across a sequence of edits', () =>
{
    function installWithStateClasses(identity: string): TestForm
    {
        let options = { validatedClassEnabled: true, correctedClassEnabled: true };
        return installForm({
            repository: createRepository(), fields: [identity], fieldTemplate: 'inContainer', verbose: verbose,
            configureServices: (services) =>
            {
                let factory = services.domServices.fieldPresentationFactory;
                factory.register('TextInput', (el) => new TextInputPresentation(el, options));
                factory.register('inputEditor', (el) => new TextInputPresentation(el, options));
                factory.register('Label', (el) => new LabelPresentation(el, options));
                factory.register('RequiredIndicator', (el) => new RequiredIndicatorPresentation(el, options));
                factory.register('FieldContainer', (el) => new FieldContainerPresentation(el, options));
            }
        });
    }

    test('Valid, invalid, corrected, validated, validated, invalid', () =>
    {
        const identity = 'Text_Upper_Max5';
        let t = installWithStateClasses(identity);
        let elements = fieldElementsByRole(t, identity);
        expect(Array.from(elements.keys()).sort()).toEqual(['container', 'editor', 'error', 'label', 'required']);

        const steps: Array<{ value: string, status: ValidationStatus, stateClass: string | null }> = [
            { value: 'ABCDE', status: ValidationStatus.Valid, stateClass: 'jivs-validated' },
            { value: 'abcdefg', status: ValidationStatus.Invalid, stateClass: 'jivs-invalid' },
            { value: 'ABCDE', status: ValidationStatus.Valid, stateClass: 'jivs-corrected' },
            { value: 'ABCD', status: ValidationStatus.Valid, stateClass: 'jivs-validated' },
            { value: 'ABC', status: ValidationStatus.Valid, stateClass: 'jivs-validated' },
            { value: 'abcdefg', status: ValidationStatus.Invalid, stateClass: 'jivs-invalid' }
        ];
        for (let step of steps)
        {
            userEdits(t, step.value);
            expectElementsMatchValidationState(t, identity, step.status);
            for (let role of ['editor', 'label', 'container', 'required'])
            {
                let element = elements.get(role)!;
                for (let cssClass of ['jivs-invalid', 'jivs-corrected', 'jivs-validated'])
                    expect([role, step.value, cssClass, element.classList.contains(cssClass)])
                        .toEqual([role, step.value, cssClass, cssClass === step.stateClass]);
            }
        }
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * The popup error display shows an indicator when the field is invalid. Clicking it asks the popup mechanism
 * to open a popup holding the messages, and Jivs sets jivs-popup-open on the indicator, the editor and the popup content.
 * The EmulatedPopupMechanism stands in for a popup library and puts the popup in the document where the test can see it.
 * A click is dispatched as an Event('click', { bubbles: true }), which reaches the listener the trigger put on the indicator.
 */
describe('Popup error display', () =>
{
    const identity = 'Text_Upper_Max5';
    function fireClick(element: HTMLElement): void
    {
        element.dispatchEvent(new Event('click', { bubbles: true }));
    }
    function expectPopupOpenClass(t: TestForm, expected: boolean): void
    {
        expect(t.element('error', identity).classList.contains('jivs-popup-open')).toBe(expected);
        expect(t.element('editor', identity).classList.contains('jivs-popup-open')).toBe(expected);
    }

    test('Clicking the indicator opens a popup with the messages, and clicking again closes it', () =>
    {
        let { t, popup } = installPopupForm({ repository: createRepository(), fields: [identity], verbose: verbose });
        popup.logToConsole = true;
        userEdits(t, 'abcdefg');
        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid, false);
        let indicator = t.element('error', identity);
        expect(popup.openPopups).toEqual([]);
        expectPopupOpenClass(t, false);

        fireClick(indicator);

        expect(popup.openPopups.length).toBe(1);
        let context = popup.openPopups[0];
        expect(popup.popupTextFor(context)).toContain('UPPER-MSG');
        expect(popup.popupTextFor(context)).toContain('LEN-MSG');
        expect(context.anchorElement).toBe(indicator);
        expectPopupOpenClass(t, true);
        expect(context.messageFrameContent!.classList.contains('jivs-popup-open')).toBe(true);

        fireClick(indicator);

        expect(popup.openPopups).toEqual([]);
        expect(context.disposeCalls).toBe(1);
        expectPopupOpenClass(t, false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('When the mechanism closes the popup itself, Jivs clears its state and a later click opens a new popup', () =>
    {
        let { t, popup } = installPopupForm({ repository: createRepository(), fields: [identity], verbose: verbose });
        userEdits(t, 'abcdefg');
        let indicator = t.element('error', identity);
        fireClick(indicator);
        let first = popup.openPopups[0];
        expectPopupOpenClass(t, true);

        // Like Escape or an outside click: the mechanism closes it and reports through controller.closed().
        popup.closeFromMechanism();

        expect(popup.openPopups).toEqual([]);
        expect(first.disposeCalls).toBe(1);
        expectPopupOpenClass(t, false);
        expect(popup.closeCount).toBe(0);

        fireClick(indicator);

        expect(popup.openPopups.length).toBe(1);
        let second = popup.openPopups[0];
        expect(second).not.toBe(first);
        expect(popup.createdContexts.length).toBe(2);
        expect(popup.popupTextFor(second)).toContain('LEN-MSG');
        expectPopupOpenClass(t, true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A mechanism that reports closed() from inside close() still gives one clean close', () =>
    {
        let { t, popup } = installPopupForm({ repository: createRepository(), fields: [identity], verbose: verbose });
        popup.notifyClosedDuringClose = true;
        userEdits(t, 'abcdefg');
        let indicator = t.element('error', identity);
        fireClick(indicator);
        let context = popup.openPopups[0];
        expect(popup.closeCount).toBe(0);

        fireClick(indicator);

        expect(popup.closeCount).toBe(1);
        expect(popup.openPopups).toEqual([]);
        expect(context.disposeCalls).toBe(1);
        expectPopupOpenClass(t, false);

        fireClick(indicator);

        expect(popup.openPopups.length).toBe(1);
        expect(popup.createdContexts.length).toBe(2);
        expectPopupOpenClass(t, true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A new invalid result while the popup is open leaves it showing only the latest messages', () =>
    {
        let { t, popup } = installPopupForm({ repository: createRepository(), fields: [identity], verbose: verbose });
        userEdits(t, 'abcdefg');
        fireClick(t.element('error', identity));
        expect(popup.openPopups.length).toBe(1);
        expect(popup.popupTextFor(popup.openPopups[0])).toContain('UPPER-MSG');

        // Uppercase now, so only the length message remains.
        userEdits(t, 'ABCDEFG');

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid, false);
        expect(popup.openPopups.length).toBe(1);
        let text = popup.popupTextFor(popup.openPopups[0]);
        expect(text).toContain('LEN-MSG');
        expect(text).not.toContain('UPPER-MSG');
        expectPopupOpenClass(t, true);
        expect(popup.createdContexts.filter(c => c.disposeCalls === 0).length).toBe(1);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('When the field becomes valid while the popup is open, the popup closes and no open class remains', () =>
    {
        let { t, popup } = installPopupForm({ repository: createRepository(), fields: [identity], verbose: verbose });
        userEdits(t, 'abcdefg');
        fireClick(t.element('error', identity));
        let context = popup.openPopups[0];
        expectPopupOpenClass(t, true);

        userEdits(t, 'ABC');

        expectElementsMatchValidationState(t, identity, ValidationStatus.Valid, false);
        expect(popup.openPopups).toEqual([]);
        expect(context.disposeCalls).toBe(1);
        expectPopupOpenClass(t, false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Opening the popup of a second field closes the popup of the first', () =>
    {
        let first = 'Text_Upper_Max5';
        let second = 'Text_Upper_Max5_Optional';
        let { t, popup } = installPopupForm({ repository: createRepository(), fields: [first, second], verbose: verbose });
        for (let name of [first, second])
        {
            let editor = t.element('editor', name) as unknown as HTMLInputElement;
            editor.value = 'abcdefg';
            fireChange(editor);
        }

        fireClick(t.element('error', first));
        let firstContext = popup.openPopups[0];
        expect(popup.openPopups.length).toBe(1);

        fireClick(t.element('error', second));

        expect(popup.openPopups.length).toBe(1);
        let secondContext = popup.openPopups[0];
        expect(secondContext).not.toBe(firstContext);
        expect(secondContext.anchorElement).toBe(t.element('error', second));
        expect(firstContext.disposeCalls).toBe(1);
        expect(t.element('error', first).classList.contains('jivs-popup-open')).toBe(false);
        expect(t.element('editor', first).classList.contains('jivs-popup-open')).toBe(false);
        expect(t.element('error', second).classList.contains('jivs-popup-open')).toBe(true);
        expect(t.element('editor', second).classList.contains('jivs-popup-open')).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('ValueHostsManager.clearValidation() while the popup is open closes it and clears the indicator', () =>
    {
        let { t, popup } = installPopupForm({ repository: createRepository(), fields: [identity], verbose: verbose });
        userEdits(t, 'abcdefg');
        fireClick(t.element('error', identity));
        let context = popup.openPopups[0];
        expectPopupOpenClass(t, true);

        t.vhm.clearValidation();

        expectElementsMatchValidationState(t, identity, ValidationStatus.NotAttempted, false);
        expect(popup.openPopups).toEqual([]);
        expect(context.disposeCalls).toBe(1);
        expectPopupOpenClass(t, false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * Variation classes are the website's own permanent classes (for example a layout variant) passed in a presentation's
 * options. They are added to the element along with the presentation's own permanent classes, and they survive
 * validation changes. The tests use the outer field container and do not care what the names are.
 */
describe('Variation classes on the field container', () =>
{
    const identity = 'Text_Upper_Max5';
    function installWithVariations(variationClasses: string[]): TestForm
    {
        return installForm({
            repository: createRepository(), fields: [identity], fieldTemplate: 'inContainer', verbose: verbose,
            configureServices: (services) =>
            {
                services.domServices.fieldPresentationFactory.register('FieldContainer',
                    (el) => new FieldContainerPresentation(el, { variationClasses: variationClasses }));
            }
        });
    }

    test.each([
        { label: 'one variation class', classes: ['var-one'] },
        { label: 'three variation classes', classes: ['var-one', 'var-two', 'var-three'] }
    ])('$label are on the container alongside the persistent classes and stay through validation changes', ({ classes }) =>
    {
        let baseline = installForm({
            repository: createRepository(), fields: [identity], fieldTemplate: 'inContainer', verbose: verbose
        });
        let persistentClasses = Array.from(baseline.element('container', identity).classList);
        expect(persistentClasses.length).toBeGreaterThan(0);

        let t = installWithVariations(classes);
        let container = t.element('container', identity);
        for (let cssClass of [...persistentClasses, ...classes])
            expect(container.classList.contains(cssClass)).toBe(true);

        userEdits(t, 'abcdefg');

        expectElementsMatchValidationState(t, identity, ValidationStatus.Invalid);
        for (let cssClass of [...persistentClasses, ...classes])
            expect(container.classList.contains(cssClass)).toBe(true);
        expect(container.classList.contains('jivs-invalid')).toBe(true);

        userEdits(t, 'ABC');

        for (let cssClass of [...persistentClasses, ...classes])
            expect(container.classList.contains(cssClass)).toBe(true);
        expect(container.classList.contains('jivs-invalid')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * Two ways a field can lack required behavior. Input is the text editor, cleared by the user.
 * - No RequiredText validator: the indicator is in the HTML but never gets jivs-required, and empty is valid.
 * - No indicator in the HTML: the field is required, so an empty value is invalid, and the remaining roles still update.
 */
describe('Required behavior with and without the indicator', () =>
{
    test('No RequiredText validator: clearing the editor is valid and the indicator lacks jivs-required', () =>
    {
        let t = installForm({ repository: createRepository(), fields: ['Text_Upper_Max5_Optional'], verbose: verbose });
        expect(t.vhm.getFieldValueHost('Text_Upper_Max5_Optional')!.required).toBe(false);
        expect(fieldElementsByRole(t, 'Text_Upper_Max5_Optional').has('required')).toBe(true);

        userEdits(t, '');

        expectElementsMatchValidationState(t, 'Text_Upper_Max5_Optional', ValidationStatus.Valid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('No indicator in the HTML: the other roles still reflect the invalid empty value', () =>
    {
        // The 'withoutRequired' field template has no required indicator.
        let t = installForm({
            repository: createRepository(), fields: ['Text_Upper_Max5'], fieldTemplate: 'withoutRequired', verbose: verbose
        });
        expect(fieldElementsByRole(t, 'Text_Upper_Max5').has('required')).toBe(false);

        userEdits(t, '');

        expectElementsMatchValidationState(t, 'Text_Upper_Max5', ValidationStatus.Invalid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});
