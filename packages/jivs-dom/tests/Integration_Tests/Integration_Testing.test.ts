/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IElementRegistry, ElementRegistryRecord } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { ElementRole } from '../../src/Interfaces/Types';
import
    {
        IntegrationTestContext, IntegrationTestRunner, TestHtmlBuilder,
        LabelTestDescriptor, SummaryTestDescriptor, EditorTestDescriptor, RoleTestDescriptorBase,
        RequiredTestDescriptor, ErrorTestDescriptor, AriaErrorTestDescriptor, FieldContainerTestDescriptor, SubmitTestDescriptor
    } from './Integration_Testing';

/** Minimal service stub: these tests exercise the testing helpers, not Jivs-DOM itself. */
export function setupForTestingTheTestingTools()
{
    const records = new Map<IJivsElement, ElementRegistryRecord>();
    const registry = { getRecordForElement: (e: IJivsElement) => records.get(e) ?? null } as IElementRegistry;
    const service = {
        getElementRegistry: () => registry,
        fieldPresentationFactory: { create: () => null },
        formPresentationFactory: { create: () => null },
        editorAdapterDefinitionFactory: { getDefinition: () => null, findDefinition: () => null },
        ariaService: null
    } as unknown as IJivsDomServices;
    const manager = { services: { domServices: service }, getContainerIdentifier: () => null, getFieldByElementIdentifier: () => ({}) } as unknown as IValueHostsManager;
    const context = new IntegrationTestContext(service);
    const runner = new IntegrationTestRunner(context);
    const builder = new TestHtmlBuilder(context);
    return { records, registry, service, manager, context, runner, builder };
}

describe('TestHtmlBuilder', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });
    test('composes child builders and builds lazily without changing the result', () =>
    {
        const { builder } = setupForTestingTheTestingTools();
        const child = builder.form();
        child.label('firstName', 'First');
        expect(builder.build()).toContain("<form id='test-form' novalidate>");
        expect(builder.build()).toContain("data-jivs-role='label'");
        const original = builder.build();
        expect(builder.build()).toBe(original);
    });
    // assign() writes build() output into document.body by default, a Document's body, or a given element.
    test('assign writes the built HTML to document.body, a Document, or an element and returns it', () =>
    {
        const { builder } = setupForTestingTheTestingTools();
        builder.form().label('firstName', 'First');
        const expected = builder.build();
        expect(builder.assign()).toBe(expected);
        expect(document.body.innerHTML).toBe(new DOMParser().parseFromString(expected, 'text/html').body.innerHTML);
        document.body.innerHTML = '';
        builder.assign(document);
        expect(document.body.querySelector('form')).not.toBeNull();
        const holder = document.createElement('div');
        builder.assign(holder);
        expect(holder.querySelector('label')).not.toBeNull();
        expect(document.body.contains(holder)).toBe(false);
    });
    test('uses one counter across builders and captures changing container identifiers', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.setContainerIdentifier('#one').label('name', 'Name');
        builder.setContainerIdentifier('#two').requiredIndicator('name');
        expect(runner.descriptors.map(d => d.id)).toEqual(['label-name-1', 'required-name-2']);
        expect(runner.descriptors.map(d => d.containerIdentifier)).toEqual(['#one', '#two']);
    });
    test('renders select options, input types, and radio group attributes', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.inputEditor('age', 'number').selectEditor('fruit', [{ value: 'a', text: 'Apple' }]);
        builder.radioEditor('choice', 'choices', ['x', 'y']);
        expect(builder.build()).toContain("type='number'");
        expect(builder.build()).toContain("<option value='a'>Apple</option>");
        expect(builder.build().match(/type='radio'/g)).toHaveLength(2);
        expect(runner.descriptors).toHaveLength(3);
    });
    test('renders ARIA error class and alternative submit tags', () =>
    {
        const { builder } = setupForTestingTheTestingTools();
        builder.ariaError('email').submit().submit(null, 'main', 'Send', '', true);
        expect(builder.build()).toContain("class='jivs-visually-hidden'");
        expect(builder.build()).toContain("type='submit' value='Submit'");
        expect(builder.build()).toContain('>Send</button>');
        expect(builder.build()).toContain("data-jivs-group='main'");
    });
    test('fieldContainer returns a nested builder', () =>
    {
        const { builder } = setupForTestingTheTestingTools();
        builder.fieldContainer('email').inputEditor('email');
        expect(builder.build()).toMatch(/data-jivs-role='container'[\s\S]*data-jivs-role='editor'[\s\S]*<\/div>/);
    });
});

/** Verifies that expectations for replaced DOM nodes can be removed without losing the rest of the form. */
describe('IntegrationTestRunner subtree replacement support', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });

    test('removes expectations for a replaced subtree and retains expectations outside it', () =>
    {
        const { builder, context, runner } = setupForTestingTheTestingTools();
        const replaced = builder.fieldContainer('oldField');
        replaced.label('nestedField', 'Nested field');
        builder.label('stableField', 'Stable field');
        document.body.innerHTML = builder.build();

        const subtree = document.getElementById(runner.descriptors[0].id)!;
        runner.removeDescriptorsIn(subtree);
        const replacement = new TestHtmlBuilder(context);
        replacement.label('newField', 'New field');
        subtree.replaceWith(document.createRange().createContextualFragment(replacement.build()));

        expect(runner.descriptors.map(descriptor => descriptor.fieldName)).toEqual(['stableField', 'newField']);
        expect(document.querySelector("[data-field='oldField']")).toBeNull();
        expect(document.querySelector("[data-field='nestedField']")).toBeNull();
        expect(document.querySelector("[data-field='newField']")).not.toBeNull();
    });
});

describe('IntegrationTestRunner', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });
    test('accepts a matching form role and clears accumulated failures', () =>
    {
        const { records, builder, runner, context, manager } = setupForTestingTheTestingTools();
        builder.validationSummary();
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.summary;
        el.jivsFormPresentation = null;
        records.set(el, {
            kind: 'form', role: ElementRole.summary, element: el,
            elementIdentifier: null, fieldValueHost: null, presentationOptions: null
        });
        context.failures.push({ id: 'old', role: '', fieldName: null, propertyName: '', message: '' });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
        expect(context.failures).toEqual([]);
    });
    test('reports a missing HTML element through Jest', () =>
    {
        const { builder, runner, context, manager } = setupForTestingTheTestingTools();
        builder.label('name', 'Name');
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures[0].message).toBe('Element not found');
    });
    test('reports a missing registry entry and stops that descriptor', () =>
    {
        const { builder, runner, context, manager } = setupForTestingTheTestingTools();
        builder.label('name', 'Name');
        document.body.innerHTML = builder.build();
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures).toHaveLength(1);
        expect(context.failures[0].message).toBe('Registry record not found');
    });
    test('reports when no descriptors match the current container', () =>
    {
        const { builder, runner, context, manager } = setupForTestingTheTestingTools();
        builder.setContainerIdentifier('#other').label('name', 'Name');
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures[0].message).toBe('No descriptors matched this manager');
    });
    test('compares installed role and registry fields and retains failure details', () =>
    {
        const { records, builder, runner, context, manager } = setupForTestingTheTestingTools();
        builder.label('name', 'Name');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.required;
        el.jivsFieldPresentation = null;
        records.set(el, {
            kind: 'field', role: ElementRole.label, element: el,
            elementIdentifier: 'name', fieldValueHost: {} as any, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsElementRole')).toBe(true);
    });
});

describe('Descriptor construction', () =>
{
    test('creates role-specific classes with mandatory values and writable expectations', () =>
    {
        const { context } = setupForTestingTheTestingTools();
        const editor = new EditorTestDescriptor('editor-1', 'name', context);
        const label = new LabelTestDescriptor('label-2', 'name', context);
        const summary = new SummaryTestDescriptor('summary-3', null, context);
        editor.adapterKey = 'input:text';
        expect(editor.role).toBe(ElementRole.editor);
        expect(editor.adapterKey).toBe('input:text');
        expect(label.role).toBe(ElementRole.label);
        expect(summary.fieldName).toBeNull();
    });
});

describe('Installed role assertions', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });
    test('checks form presentation and validation group rather than treating form as unmatched', () =>
    {
        const { records, builder, runner, context, manager, service } = setupForTestingTheTestingTools();
        class SummaryPresentation {}
        (service as any).formPresentationFactory.create = () => new SummaryPresentation();
        builder.validationSummary(null, 'main');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.summary;
        el.jivsFormPresentation = new SummaryPresentation() as any;
        el.jivsFormPresentationGroup = 'main';
        records.set(el, {
            kind: 'form', role: ElementRole.summary, element: el,
            elementIdentifier: null, fieldValueHost: null, presentationOptions: { group: 'main' }
        });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
        el.jivsFormPresentationGroup = 'wrong';
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsFormPresentationGroup')).toBe(true);
    });
    test('checks installed field presentation constructor and detects a wrong type', () =>
    {
        const { records, builder, runner, context, manager, service } = setupForTestingTheTestingTools();
        class LabelPresentation {}
        class WrongPresentation {}
        (service as any).fieldPresentationFactory.create = () => new LabelPresentation();
        builder.label('name', 'Name');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.label;
        el.jivsFieldPresentation = new LabelPresentation() as any;
        records.set(el, {
            kind: 'field', role: ElementRole.label, element: el,
            elementIdentifier: 'name', fieldValueHost: {} as any, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
        el.jivsFieldPresentation = new WrongPresentation() as any;
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsFieldPresentation')).toBe(true);
    });
    test('checks editor adapter through automatic matching and recommendation', () =>
    {
        const { records, builder, runner, context, manager, service } = setupForTestingTheTestingTools();
        class EditorPresentation {}
        const definition = { recommendedFieldPresentationName: 'editor-recommended' };
        (service as any).editorAdapterDefinitionFactory.findDefinition = () => definition;
        (service as any).fieldPresentationFactory.create = (_el: any, _role: any, name: any) =>
        {
            expect(name).toBe('editor-recommended');
            return new EditorPresentation();
        };
        builder.inputEditor('name');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.editor;
        el.jivsEditorAdapterDefinition = definition as any;
        el.jivsFieldPresentation = new EditorPresentation() as any;
        records.set(el, {
            kind: 'field', role: ElementRole.editor, element: el,
            elementIdentifier: 'name', fieldValueHost: {} as any, jivsElement: el, editorOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
        el.jivsEditorAdapterDefinition = {} as any;
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsEditorAdapterDefinition')).toBe(true);
    });
    test('asserts unmatched fields have no installed editor or presentation', () =>
    {
        const { records, builder, runner, manager } = setupForTestingTheTestingTools();
        (manager as any).getFieldByElementIdentifier = () => null;
        builder.label('unknown', 'Unknown');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.label;
        records.set(el, {
            kind: 'field', role: ElementRole.label, element: el,
            elementIdentifier: 'unknown', fieldValueHost: null, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
    });
    test('checks ARIA absence when service is disabled', () =>
    {
        const { records, builder, runner, context, manager } = setupForTestingTheTestingTools();
        builder.label('name', 'Name');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.label;
        el.jivsFieldPresentation = null;
        el.jivsAriaValidationStateUpdater = {} as any;
        records.set(el, {
            kind: 'field', role: ElementRole.label, element: el,
            elementIdentifier: 'name', fieldValueHost: {} as any, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsAriaValidationStateUpdater')).toBe(true);
    });
});

describe('Additional option and ARIA coverage', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });
    test('explicit adapter key is forwarded and resolved by getDefinition', () =>
    {
        const { records, builder, runner, manager, service } = setupForTestingTheTestingTools();
        const definition = { recommendedFieldPresentationName: null };
        (service as any).editorAdapterDefinitionFactory.getDefinition = (key: string) => key === 'custom' ? definition : null;
        builder.inputEditor('name', 'text', null, 'custom');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.editor;
        el.jivsEditorAdapterDefinition = definition as any;
        el.jivsFieldPresentation = null;
        records.set(el, {
            kind: 'field', role: ElementRole.editor, element: el,
            elementIdentifier: 'name', fieldValueHost: {} as any, jivsElement: el,
            editorOptions: { adapterKey: 'custom' }
        });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
    });
    test('compares installed updater instance for eligible ARIA field anchors', () =>
    {
        const { records, registry, builder, runner, manager, service, context } = setupForTestingTheTestingTools();
        class UpdaterA {}
        class UpdaterB {}
        const updater = new UpdaterA();
        (service as any).ariaService = { resolveValidationStateUpdater: () => new UpdaterA() };
        builder.ariaError('name');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.ariaError;
        el.jivsFieldPresentation = null;
        el.jivsAriaValidationStateUpdater = updater as any;
        (registry as any).getFieldAriaElementAnchors = () => ({
            editorJivsElement: null, errorMessageElement: el, errorMessageRole: ElementRole.ariaError,
            elementIdentifier: 'name'
        });
        records.set(el, {
            kind: 'field', role: ElementRole.ariaError, element: el,
            elementIdentifier: 'name', fieldValueHost: {} as any, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
        el.jivsAriaValidationStateUpdater = new UpdaterB() as any;
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsAriaValidationStateUpdater')).toBe(true);
    });
});


/** Extended coverage: builders are tested independently of Jivs installers. */
describe('TestHtmlBuilder expanded coverage', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });

    test('append composes existing builders without changing their IDs or descriptors', () =>
    {
        const { context, runner, builder } = setupForTestingTheTestingTools();
        const other = new TestHtmlBuilder(context);
        other.label('name', 'Name');
        builder.raw('<main>').append(other).raw('</main>');
        expect(builder.build()).toBe("<main><label id='label-name-1' data-jivs-role='label' data-field='name'>Name</label></main>");
        expect(runner.descriptors.map(d => d.id)).toEqual(['label-name-1']);
        expect(builder.build()).toBe(builder.build());
    });

    test('raw markup creates no descriptors', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.raw('<section id="ordinary"><strong>Hello</strong></section>');
        expect(builder.build()).toContain('<strong>Hello</strong>');
        expect(runner.descriptors).toHaveLength(0);
    });

    test('generic editor supports implicit and explicit adapter keys', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.editor('custom-widget', 'first', 'widget')
            .editor('custom-widget', 'second', 'special', null, '', true);
        const html = builder.build();
        expect(html).toContain('</custom-widget>');
        expect(html.match(/data-jivs-adapterkey=/g)).toHaveLength(1);
        expect(html).toContain("data-jivs-adapterkey='special'");
        expect((runner.descriptors[0] as EditorTestDescriptor).explicitAdapterKey).toBe(false);
        expect((runner.descriptors[1] as EditorTestDescriptor).explicitAdapterKey).toBe(true);
    });

    test('checkbox, file input and textarea generate their own editor descriptors', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.checkboxEditor('agree').fileInputEditor('attachment').textAreaEditor('comments');
        expect(builder.build()).toContain("type='checkbox'");
        expect(builder.build()).toContain("type='file'");
        expect(builder.build()).toContain('<textarea');
        expect(runner.descriptors.map(d => d.adapterKey)).toEqual(['input:checkbox', 'input:file', 'textarea']);
        expect(runner.descriptors.every(d => d instanceof EditorTestDescriptor)).toBe(true);
    });

    test('radio buttons create one descriptor with Jivs attributes only on first input', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.radioEditor('choice', 'choiceGroup', ['one', 'two', 'three']);
        const html = builder.build();
        expect(html.match(/type='radio'/g)).toHaveLength(3);
        expect(html.match(/data-jivs-role='editor'/g)).toHaveLength(1);
        expect(html.match(/name='choiceGroup'/g)).toHaveLength(3);
        expect(runner.descriptors).toHaveLength(1);
        expect(runner.descriptors[0].adapterKey).toBe('input:radio');
    });

    test('all field and form roles create the intended descriptor classes', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.label('name', 'Name').requiredIndicator('name').errorDisplay('name').ariaError('name');
        builder.fieldContainer('name', null, '', 'section').raw('inside');
        builder.validationSummary('my-summary', 'main').submit('my-submit', '*');
        expect(runner.descriptors.map(d => d.constructor)).toEqual([
            LabelTestDescriptor, RequiredTestDescriptor, ErrorTestDescriptor,
            AriaErrorTestDescriptor, FieldContainerTestDescriptor, SummaryTestDescriptor, SubmitTestDescriptor
        ]);
        expect(builder.build()).toContain("<section id='fieldcontainer-name-");
        expect(builder.build()).toContain('inside</section>');
        expect(runner.descriptors[5].validationGroup).toBe('main');
        expect(runner.descriptors[6].validationGroup).toBe('*');
    });

    test('IDs are unique even for repeated roles, names, and nested builders', () =>
    {
        const { builder, runner } = setupForTestingTheTestingTools();
        builder.errorDisplay('name').errorDisplay('name');
        builder.form().label('name', 'Name');
        const ids = runner.descriptors.map(d => d.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toEqual(['error-name-1', 'error-name-2', 'label-name-3']);
    });

    test('form uses default id and novalidate and allows caller-specified id', () =>
    {
        const { builder } = setupForTestingTheTestingTools();
        builder.form().raw('<p>Default</p>');
        builder.form('alternate', "class='special'").raw('<p>Alternate</p>');
        expect(builder.build()).toContain("<form id='test-form' novalidate>");
        expect(builder.build()).toContain("<form id='alternate' novalidate class='special'>");
    });
});

describe('IntegrationTestRunner expanded coverage', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });

    test('scopes descriptors to one manager without reporting missing elements in another form', () =>
    {
        const { builder, runner, records, manager } = setupForTestingTheTestingTools();
        builder.setContainerIdentifier('#one').validationSummary();
        builder.setContainerIdentifier('#two').validationSummary();
        document.body.innerHTML = builder.build();
        for (const d of runner.descriptors)
        {
            const el = document.getElementById(d.id) as IJivsElement;
            el.jivsElementRole = ElementRole.summary;
            el.jivsFormPresentation = null;
            records.set(el, {
                kind: 'form', role: ElementRole.summary, element: el,
                elementIdentifier: null, fieldValueHost: null, presentationOptions: null
            });
        }
        (manager as any).getContainerIdentifier = () => '#one';
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
        (manager as any).getContainerIdentifier = () => '#two';
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
    });

    test('aggregates failures from different descriptors and clears them on the next run', () =>
    {
        const { builder, runner, records, context, manager } = setupForTestingTheTestingTools();
        builder.validationSummary().submit();
        document.body.innerHTML = builder.build();
        for (const d of runner.descriptors)
        {
            const el = document.getElementById(d.id) as IJivsElement;
            el.jivsElementRole = ElementRole.label;
            el.jivsFormPresentation = null;
            records.set(el, {
                kind: 'form', role: d.role, element: el,
                elementIdentifier: null, fieldValueHost: null, presentationOptions: null
            });
        }
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        const failures = context.failures.filter(f => f.propertyName === 'JivsElement.jivsElementRole');
        expect(failures.map(f => f.id)).toEqual(runner.descriptors.map(d => d.id));
        for (const d of runner.descriptors) (document.getElementById(d.id) as IJivsElement).jivsElementRole = d.role;
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
        expect(context.failures).toEqual([]);
    });

    test('editor assertions use registry.jivsElement instead of the collected element', () =>
    {
        const { builder, runner, records, manager, service } = setupForTestingTheTestingTools();
        const definition = { recommendedFieldPresentationName: null };
        (service as any).editorAdapterDefinitionFactory.findDefinition = () => definition;
        builder.inputEditor('name');
        document.body.innerHTML = builder.build();
        const original = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        const target = document.createElement('span') as IJivsElement;
        target.jivsElementRole = ElementRole.editor;
        target.jivsEditorAdapterDefinition = definition as any;
        target.jivsFieldPresentation = null;
        records.set(original, {
            kind: 'field', role: ElementRole.editor, element: original,
            elementIdentifier: 'name', fieldValueHost: {} as any, jivsElement: target, editorOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
    });

    test('missing editor installation target yields one targeted error', () =>
    {
        const { builder, runner, records, context, manager } = setupForTestingTheTestingTools();
        builder.inputEditor('name');
        document.body.innerHTML = builder.build();
        const original = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        records.set(original, {
            kind: 'field', role: ElementRole.editor, element: original,
            elementIdentifier: 'name', fieldValueHost: {} as any, jivsElement: null, editorOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures).toHaveLength(1);
        expect(context.failures[0].propertyName).toBe('RegRecord.jivsElement');
    });

    test('detects missing FieldValueHost for an existing field', () =>
    {
        const { builder, runner, records, context, manager } = setupForTestingTheTestingTools();
        builder.label('name', 'Name');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.label;
        records.set(el, {
            kind: 'field', role: ElementRole.label, element: el,
            elementIdentifier: 'name', fieldValueHost: null, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'RegRecord.fieldValueHost')).toBe(true);
    });

    test('detects unexpected FieldValueHost for an unknown field', () =>
    {
        const { builder, runner, records, context, manager } = setupForTestingTheTestingTools();
        (manager as any).getFieldByElementIdentifier = () => null;
        builder.label('unknown', 'Unknown');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.label;
        records.set(el, {
            kind: 'field', role: ElementRole.label, element: el,
            elementIdentifier: 'unknown', fieldValueHost: {} as any, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'RegRecord.fieldValueHost')).toBe(true);
    });

    test('detects incorrect editor and field presentation names in registry options', () =>
    {
        const { builder, runner, records, context, manager, service } = setupForTestingTheTestingTools();
        (service as any).editorAdapterDefinitionFactory.findDefinition = () => ({ recommendedFieldPresentationName: null });
        builder.inputEditor('name', 'text', 'correct').label('name', 'Name', 'correct');
        document.body.innerHTML = builder.build();
        for (const d of runner.descriptors)
        {
            const el = document.getElementById(d.id) as IJivsElement;
            el.jivsElementRole = d.role;
            if (d.role === ElementRole.editor) records.set(el, {
                kind: 'field', role: ElementRole.editor,
                element: el, elementIdentifier: 'name', fieldValueHost: {} as any, jivsElement: el,
                editorOptions: { presentationName: 'wrong' }
            });
            else records.set(el, {
                kind: 'field', role: ElementRole.label, element: el,
                elementIdentifier: 'name', fieldValueHost: {} as any, presentationOptions: { presentationName: 'wrong' }
            });
        }
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.filter(f => f.propertyName?.endsWith('.presentationName'))).toHaveLength(2);
    });

    test('disabled ARIA leaves editor error message ID undefined even with error element', () =>
    {
        const { builder, runner, records, manager, context, service } = setupForTestingTheTestingTools();
        const definition = { recommendedFieldPresentationName: null };
        (service as any).editorAdapterDefinitionFactory.findDefinition = () => definition;
        builder.inputEditor('name').errorDisplay('name');
        document.body.innerHTML = builder.build();
        const editor = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        const error = document.getElementById(runner.descriptors[1].id) as IJivsElement;
        editor.jivsElementRole = ElementRole.editor;
        editor.jivsEditorAdapterDefinition = definition as any;
        editor.jivsFieldPresentation = null;
        editor.jivsErrorMessageId = 'unexpected';
        error.jivsElementRole = ElementRole.error;
        error.jivsFieldPresentation = null;
        records.set(editor, {
            kind: 'field', role: ElementRole.editor, element: editor,
            elementIdentifier: 'name', fieldValueHost: {} as any, jivsElement: editor, editorOptions: null
        });
        records.set(error, {
            kind: 'field', role: ElementRole.error, element: error,
            elementIdentifier: 'name', fieldValueHost: {} as any, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsErrorMessageId')).toBe(true);
    });

    test('active ARIA expects an error message ID for an eligible editor', () =>
    {
        const { builder, runner, records, registry, context, manager, service } = setupForTestingTheTestingTools();
        const definition = { recommendedFieldPresentationName: null };
        (service as any).editorAdapterDefinitionFactory.findDefinition = () => definition;
        (service as any).ariaService = { resolveValidationStateUpdater: () => null };
        builder.inputEditor('name').ariaError('name');
        document.body.innerHTML = builder.build();
        const editor = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        const error = document.getElementById(runner.descriptors[1].id) as IJivsElement;
        editor.jivsElementRole = ElementRole.editor;
        editor.jivsEditorAdapterDefinition = definition as any;
        editor.jivsFieldPresentation = null;
        editor.jivsAriaValidationStateUpdater = null;
        error.jivsElementRole = ElementRole.ariaError;
        error.jivsFieldPresentation = null;
        error.jivsAriaValidationStateUpdater = null;
        (registry as any).getFieldAriaElementAnchors = () => ({
            editorJivsElement: editor,
            errorMessageElement: error, errorMessageRole: ElementRole.ariaError, elementIdentifier: 'name'
        });
        records.set(editor, {
            kind: 'field', role: ElementRole.editor, element: editor,
            elementIdentifier: 'name', fieldValueHost: {} as any, jivsElement: editor, editorOptions: null
        });
        records.set(error, {
            kind: 'field', role: ElementRole.ariaError, element: error,
            elementIdentifier: 'name', fieldValueHost: {} as any, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsErrorMessageId')).toBe(true);
        editor.jivsErrorMessageId = error.id;
        expect(() => runner.assertFormInstallation(document, manager)).not.toThrow();
    });
});

/** Exercises protected assertion methods without changing production visibility. */
class UtilityTestDescriptor extends RoleTestDescriptorBase
{
    public readonly role = 'utility-test';
    public equality(property: string, expected: unknown, actual: unknown): void { this.checkEqual(property, expected, actual); }
    public defined(property: string, actual: unknown): void { this.checkDefined(property, actual); }
    public presentation(property: string, expected: any, actual: any): void { this.checkPresentation(property, expected, actual); }
    public undefinedProperties(element: IJivsElement, names: (keyof IJivsElement)[]): void
    {
        this.checkUndefinedProperties(element, names);
    }
    public failure(property: string, message: string, expected: unknown, actual: unknown): void
    {
        this.addFailure(property, message, expected, actual);
    }
}

describe('RoleTestDescriptorBase shared assertion utilities', () =>
{
    test('checkEqual differentiates null and undefined and preserves descriptive data', () =>
    {
        const { context } = setupForTestingTheTestingTools();
        const descriptor = new UtilityTestDescriptor('test-1', 'name', context);
        descriptor.equality('Some.null', null, undefined);
        descriptor.equality('Some.same', 2, 2);
        expect(context.failures).toHaveLength(1);
        expect(context.failures[0]).toMatchObject({
            id: 'test-1', role: 'utility-test', fieldName: 'name',
            propertyName: 'Some.null', expected: null, actual: '<undefined>'
        });
    });

    test('checkDefined accepts null but rejects undefined', () =>
    {
        const { context } = setupForTestingTheTestingTools();
        const descriptor = new UtilityTestDescriptor('test-1', null, context);
        descriptor.defined('Some.null', null);
        descriptor.defined('Some.undefined', undefined);
        expect(context.failures).toHaveLength(1);
        expect(context.failures[0].propertyName).toBe('Some.undefined');
    });

    test('checkPresentation compares constructors and distinguishes null and undefined', () =>
    {
        const { context } = setupForTestingTheTestingTools();
        class ExpectedPresentation {}
        class OtherPresentation {}
        const descriptor = new UtilityTestDescriptor('test-1', null, context);
        descriptor.presentation('same', new ExpectedPresentation(), new ExpectedPresentation());
        descriptor.presentation('both-null', null, null);
        expect(context.failures).toEqual([]);
        descriptor.presentation('wrong', new ExpectedPresentation(), new OtherPresentation());
        descriptor.presentation('missing', null, undefined);
        expect(context.failures).toHaveLength(2);
        expect(context.failures[0]).toMatchObject({
            propertyName: 'wrong',
            expected: 'ExpectedPresentation', actual: 'OtherPresentation'
        });
        expect(context.failures[1].actual).toBe('<undefined>');
    });

    test('checkUndefinedProperties reports each unexpected assignment', () =>
    {
        const { context } = setupForTestingTheTestingTools();
        const descriptor = new UtilityTestDescriptor('test-1', null, context);
        const el = document.createElement('div') as IJivsElement;
        el.jivsFormPresentationGroup = 'main';
        el.jivsErrorMessageId = 'error-1';
        descriptor.undefinedProperties(el, ['jivsFormPresentationGroup', 'jivsErrorMessageId', 'jivsValueAdapter']);
        expect(context.failures.map(f => f.propertyName)).toEqual([
            'JivsElement.jivsFormPresentationGroup', 'JivsElement.jivsErrorMessageId'
        ]);
    });

    test('failure formatting recursively prints array values and object constructors', () =>
    {
        const { context } = setupForTestingTheTestingTools();
        class ExampleObject {}
        const descriptor = new UtilityTestDescriptor('test-1', null, context);
        descriptor.failure('values', 'Different', [undefined, null, new ExampleObject(), 3], []);
        expect(context.failures[0].expected).toEqual(['<undefined>', null, 'ExampleObject', 3]);
    });

    test('presentation-less summary with a group exposes current group matching gap', () =>
    {
        const { builder, runner, records, context, manager } = setupForTestingTheTestingTools();
        builder.validationSummary(null, 'group-a');
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.summary;
        el.jivsFormPresentation = null;
        el.jivsFormPresentationGroup = 'group-a';
        records.set(el, {
            kind: 'form', role: ElementRole.summary, element: el,
            elementIdentifier: null, fieldValueHost: null, presentationOptions: { group: 'group-a' }
        });
        // Known implementation defect: checkFormProperties currently expects undefined
        // whenever expectedPresentation is null, even with a configured group.
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsFormPresentationGroup')).toBe(true);
    });

    test('form-role negative properties are enforced', () =>
    {
        const { builder, runner, records, context, manager } = setupForTestingTheTestingTools();
        builder.validationSummary();
        document.body.innerHTML = builder.build();
        const el = document.getElementById(runner.descriptors[0].id) as IJivsElement;
        el.jivsElementRole = ElementRole.summary;
        el.jivsFormPresentation = null;
        el.jivsFieldPresentation = {} as any;
        records.set(el, {
            kind: 'form', role: ElementRole.summary, element: el,
            elementIdentifier: null, fieldValueHost: null, presentationOptions: null
        });
        expect(() => runner.assertFormInstallation(document, manager)).toThrow();
        expect(context.failures.some(f => f.propertyName === 'JivsElement.jivsFieldPresentation')).toBe(true);
    });
});
