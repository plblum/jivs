/** @jest-environment jsdom */
import { createTestForm } from './CreateTestForm';
import { createDefaultTestFieldRepository, TestFieldRepository } from './TestFieldRepository';
import { TestPropertiesRules } from './TestPropertiesRules';
import { createJivsServicesForTesting } from '../../TestSupport/CreateJivsServicesForTesting';
import { IntegrationTestContext, TestHtmlBuilder } from './Integration_Testing';

afterEach(() => { document.body.innerHTML = ''; });

const emptyIdentity = { description: '', addConfig: () => {}, addEditor: () => {} };

// Verifies registration, lookup, and duplicate protection for identities and templates.
describe('TestFieldRepository', () =>
{
    test('default repository has the starter identities and field templates', () =>
    {
        const repo = createDefaultTestFieldRepository();
        expect(repo.identityNames()).toEqual([
            'Text_Required', 'Number_Range', 'Date_Required_LessThan',
            'Checkbox', 'Select_Required', 'Radio_Required']);
        expect(repo.fieldTemplateNames()).toEqual([
            'default', 'withRequired', 'labelAfter', 'withAriaError', 'inContainer', 'editorOnly']);
        expect(repo.formTemplateNames()).toEqual([]);
    });
    test('lookups throw naming the kind and the registered names', () =>
    {
        const repo = createDefaultTestFieldRepository();
        expect(() => repo.getIdentity('Nope')).toThrow(/Field Identity 'Nope' is not registered.*Text_Required/);
        const page = new TestHtmlBuilder(new IntegrationTestContext({} as any));
        expect(() => repo.buildField(page, 'Text_Required', 'Nope')).toThrow(/Field template 'Nope'/);
        expect(() => repo.buildForm(page, 'Nope')).toThrow(/Form template 'Nope'/);
    });
    test('duplicate registrations throw', () =>
    {
        const repo = createDefaultTestFieldRepository();
        expect(() => repo.registerIdentity({ name: 'Checkbox', ...emptyIdentity })).toThrow(/already registered/);
        expect(() => repo.registerFieldTemplate('default', () => {})).toThrow(/already registered/);
        repo.registerFormTemplate('f', () => {});
        expect(() => repo.registerFormTemplate('f', () => {})).toThrow(/already registered/);
    });
});

// TestPropertiesRules builds a config from the requested identities, and caches per property set.
describe('TestPropertiesRules', () =>
{
    test('configures only the requested identities and does not share cache between sets', () =>
    {
        const services = createJivsServicesForTesting({ registerConditions: 'all' });
        const repo = createDefaultTestFieldRepository();
        const a = new TestPropertiesRules(services, ['Text_Required'], repo).configure();
        const b = new TestPropertiesRules(services, ['Text_Required', 'Checkbox'], repo).configure();
        expect(a.valueHostConfigs.map(c => c.name)).toEqual(['Text_Required']);
        expect(b.valueHostConfigs.map(c => c.name)).toEqual(['Text_Required', 'Checkbox']);
    });
});

// TestHtmlBuilder.field() and formTemplate() need a repository assigned to the context.
describe('TestHtmlBuilder with a repository', () =>
{
    test('field() and formTemplate() throw when the context has no source', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false });
        const page = new TestHtmlBuilder(new IntegrationTestContext(t.services.domServices));
        expect(() => page.field('Text_Required')).toThrow(/fieldTemplateSource is not assigned/);
        expect(() => page.formTemplate('x')).toThrow(/fieldTemplateSource is not assigned/);
    });
    test('editor options pass through to the editor', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false });
        const page = new TestHtmlBuilder(t.context);
        page.field('Text_Required', 'editorOnly', { presentationName: 'Custom', additionalAttributes: "class='wide'" });
        const html = page.build();
        expect(html).toContain("data-jivs-presentation='Custom'");
        expect(html).toContain("class='wide'");
    });
});

// The context records each Field Identity used (for the rules) and tracks the one currently being built.
describe('IntegrationTestContext field tracking', () =>
{
    test('fieldNames lists names once in first-use order', () =>
    {
        const t = createTestForm({
            install: false,
            build: page => { page.field('Checkbox'); page.field('Text_Required'); page.field('Checkbox'); }
        });
        expect(t.context.fieldNames).toEqual(['Checkbox', 'Text_Required']);
        expect(t.config.valueHostConfigs.map(c => c.name)).toEqual(['Checkbox', 'Text_Required']);
    });
    test('currentFieldName is the innermost running field and is restored when a nested one ends', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false });
        const seen: Array<string | null> = [];
        seen.push(t.context.currentFieldName);
        t.context.withField('Outer', () =>
        {
            seen.push(t.context.currentFieldName);
            t.context.withField('Inner', () => seen.push(t.context.currentFieldName));
            seen.push(t.context.currentFieldName);
        });
        seen.push(t.context.currentFieldName);
        expect(seen).toEqual([null, 'Outer', 'Inner', 'Outer', null]);
        expect(t.context.fieldNames).toEqual(['Text_Required', 'Outer', 'Inner']);
    });
    test('currentFieldName is restored when the recipe throws', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false });
        expect(() => t.context.withField('Bad', () => { throw new Error('boom'); })).toThrow('boom');
        expect(t.context.currentFieldName).toBeNull();
    });
    test('role methods accept null and use the current field, and an explicit name still wins', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false });
        const page = new TestHtmlBuilder(t.context);
        t.context.withField('Text_Required', () =>
        {
            page.label(null, 'Name');
            page.inputEditor(null);
            page.errorDisplay('Other');
        });
        const html = page.build();
        expect(html).toContain("data-field='Text_Required'");
        expect(html).toContain("data-field='Other'");
    });
    test('role methods with null outside a field throw', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false });
        const page = new TestHtmlBuilder(t.context);
        expect(() => page.label(null, 'x')).toThrow(/needs a current field/);
        expect(() => page.inputEditor(null)).toThrow(/needs a current field/);
        expect(() => page.fieldContainer(null)).toThrow(/needs a current field/);
    });
});

// createTestForm assembles manager and form HTML, installs it, and the runner validates every element.
describe('createTestForm', () =>
{
    test('requires exactly one of fields, build, formTemplate', () =>
    {
        expect(() => createTestForm({})).toThrow(/exactly one/);
        expect(() => createTestForm({ fields: [], build: () => {} })).toThrow(/exactly one/);
    });
    test('installs all starter identities with the default template and passes the assertions', () =>
    {
        const t = createTestForm({ fields: createDefaultTestFieldRepository().identityNames() });
        expect(document.querySelectorAll("[data-jivs-role='required']").length).toBe(0);
        expect(document.querySelectorAll("[data-jivs-role='label']").length).toBe(6);
        t.runner.assertFormInstallation(document, t.vhm);
    });
    test('fieldTemplate and fieldTemplates choose the templates', () =>
    {
        const t = createTestForm({
            fields: ['Text_Required', 'Checkbox'],
            fieldTemplate: 'withRequired',
            fieldTemplates: { Checkbox: 'inContainer' }
        });
        expect(document.querySelectorAll("[data-jivs-role='container']").length).toBe(1);
        expect(document.querySelectorAll("[data-jivs-role='required']").length).toBe(2);
        t.runner.assertFormInstallation(document, t.vhm);
    });
    test('withAriaError adds the aria-error element', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], fieldTemplate: 'withAriaError' });
        expect(document.querySelectorAll("[data-jivs-role='aria-error']").length).toBe(1);
        t.runner.assertFormInstallation(document, t.vhm);
    });
    test('build recipe creates the page and the manager rules come from its field() calls', () =>
    {
        const t = createTestForm({
            build: page =>
            {
                const form = page.form('customer-form');
                form.field('Text_Required', 'withRequired');
                form.field('Date_Required_LessThan');
            }
        });
        expect(t.config.valueHostConfigs.map(c => c.name)).toEqual(['Text_Required', 'Date_Required_LessThan']);
        t.runner.assertFormInstallation(document, t.vhm);
    });
    test('formTemplate runs a recipe, with and without a group on summary and submit', () =>
    {
        const repo = createDefaultTestFieldRepository();
        repo.registerFormTemplate('grouped', page =>
        {
            const form = page.form('grouped-form');
            form.field('Text_Required', 'withRequired');
            form.validationSummary(null, 'g1');
            form.submit(null, 'g1');
        });
        repo.registerFormTemplate('ungrouped', page =>
        {
            const form = page.form('ungrouped-form');
            form.field('Text_Required');
            form.validationSummary();
            form.submit();
        });
        const grouped = createTestForm({ repository: repo, formTemplate: 'grouped' });
        expect(document.querySelectorAll("[data-jivs-group='g1']").length).toBe(2);
        grouped.runner.assertFormInstallation(document, grouped.vhm);

        document.body.innerHTML = '';
        const ungrouped = createTestForm({ repository: repo, formTemplate: 'ungrouped' });
        expect(document.querySelectorAll('[data-jivs-group]').length).toBe(0);
        ungrouped.runner.assertFormInstallation(document, ungrouped.vhm);
    });
    test('install:false leaves the document untouched', () =>
    {
        createTestForm({ fields: ['Text_Required'], install: false });
        expect(document.body.innerHTML).toBe('');
    });
    test('AJAX-style replacement: build with the same context, drop old descriptors, reinstall', () =>
    {
        const t = createTestForm({ fields: ['Text_Required', 'Checkbox'] });
        const oldBox = document.querySelector("[data-field='Checkbox']")!.parentElement!;
        t.runner.removeDescriptorsIn(oldBox);
        const replacement = new TestHtmlBuilder(t.context);
        replacement.field('Checkbox', 'labelAfter');
        const holder = document.createElement('div');
        replacement.assign(holder);
        oldBox.replaceChildren(...Array.from(holder.childNodes));
        t.install();
        t.runner.assertFormInstallation(document, t.vhm);
    });
});
