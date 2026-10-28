/** @jest-environment jsdom */
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { SimpleDomElementCollector } from '../../src/SimpleDom/SimpleDomElementCollector';
import type { IEditorElementRegistryRecord } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createTestForm, createTestPage, type TestForm, type TestFormOptions } from './TestingSupport/CreateTestForm';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { testEachFieldTemplate, testEachIdentity, useCleanDocument } from './TestingSupport/TestFileSupport';

// When true, emits HTML and element registry information to the console.
let verbose = false;
useCleanDocument();

/**
 * Builds the form without installing it, writes the page to the document, and runs FormInstaller.
 * Warnings and errors are captured by the services' TestingLoggingService.
 */
function installForm(options: TestFormOptions): TestForm
{
    let t = createTestForm({ verbose: verbose, ...options, install: false });
    t.page.assign();
    t.install();
    return t;
}

/**
 * Each Field Identity covers a different editor type (text, number, date, checkbox, select, radio group).
 * FormInstaller must wire up each with its own adapter definition, presentation and ARIA support,
 * using only what the generated markup says. The runner checks every installed property.
 */
describe('FormInstaller.install with each Field Identity', () =>
{
    testEachIdentity('%s installs without warnings', (identityName) =>
    {
        let t = installForm({ fields: [identityName] });
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('The text input editor gets an adapter definition, a text value adapter and a field presentation', () =>
    {
        let t = installForm({ fields: ['Text_Required'] });
        let editor = t.editorOf('Text_Required');
        expect(editor.jivsElementRole).toBe('editor');
        expect(editor.jivsEditorAdapterDefinition).toBeDefined();
        expect(editor.jivsTextValueAdapter).toBeTruthy();
        expect(editor.jivsFieldPresentation).toBeTruthy();
    });
});

/**
 * Every field template arranges the roles differently (label before or after, required indicator,
 * aria-error, field container). FormInstaller must handle each arrangement.
 */
describe('FormInstaller.install with each field template', () =>
{
    testEachFieldTemplate('The %s template installs without warnings', (templateName) =>
    {
        let t = installForm({ fields: ['Number_Range'], fieldTemplate: templateName });
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Several fields on one form, each with a different template and editor, install together', () =>
    {
        let t = installForm({
            fields: ['Text_Required', 'Number_Range', 'Date_Required_LessThan', 'Checkbox', 'Select_Required', 'Radio_Required'],
            fieldTemplates: {
                Text_Required: 'withRequired',
                Number_Range: 'labelAfter',
                Date_Required_LessThan: 'withAriaError',
                Checkbox: 'inContainer',
                Select_Required: 'withoutRequired',
                Radio_Required: 'editorOnly'
            }
        });
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Every element with a data-jivs-role gets jivsElementRole equal to that role', () =>
    {
        let t = installForm({ fields: ['Text_Required', 'Checkbox'], fieldTemplate: 'inContainer' });
        let roleElements = document.querySelectorAll<IJivsElement>('[data-jivs-role]');
        expect(roleElements.length).toBeGreaterThan(0);
        roleElements.forEach(element =>
            expect(element.jivsElementRole).toBe(element.getAttribute('data-jivs-role')));
        t.runner.assertFormInstallation(document, t.vhm);
    });
});

/**
 * Summary and submit are form roles. They install through the FormPresentationInstaller
 * without needing a FieldValueHost, and a data-jivs-group becomes the presentation's group.
 */
describe('FormInstaller.install with form roles', () =>
{
    test('A validation summary and submit button install, with and without a group', () =>
    {
        let repo = createDefaultTestFieldRepository();
        repo.registerFormTemplate('grouped', page =>
        {
            let form = page.form('grouped-form');
            form.field('Text_Required');
            form.validationSummary(null, 'g1');
            form.submit(null, 'g1');
        });
        repo.registerFormTemplate('ungrouped', page =>
        {
            let form = page.form('ungrouped-form');
            form.field('Text_Required');
            form.validationSummary();
            form.submit();
        });
        for (let name of ['grouped', 'ungrouped'])
        {
            document.body.innerHTML = '';
            let t = installForm({ repository: repo, formTemplate: name });
            t.runner.assertFormInstallation(document, t.vhm);
            let summary = t.element('summary');
            expect(summary.jivsFormPresentation).toBeTruthy();
            expect(summary.jivsFormPresentationGroup).toBe(name === 'grouped' ? 'g1' : undefined);
            expect(t.services.loggingService.entryCount).toBe(0);
        }
    });
});

/**
 * Attributes in the markup choose the presentation and adapter. FormInstaller passes them
 * from the registry record to the installers.
 */
describe('FormInstaller.install with explicit editor options', () =>
{
    test('A registered presentation name and an explicit adapter key are used by the editor', () =>
    {
        let t = installForm({
            build: page => page.field('Text_Required', 'withoutRequired',
                { presentationName: 'inputEditor', adapterKey: 'input:text' })
        });
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * ARIA is optional. With it, the installers add static ARIA attributes and updaters;
 * without it, none of that exists.
 */
describe('FormInstaller.install and the AriaService', () =>
{
    test('With the AriaService, an editor linked to an aria-error element has an error message id', () =>
    {
        let t = installForm({ fields: ['Text_Required'], fieldTemplate: 'withAriaError' });
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.editorOf('Text_Required').jivsErrorMessageId).toBeDefined();
    });

    test('Without the AriaService, the editor has no error message id and no ARIA updater', () =>
    {
        let t = installForm({
            fields: ['Text_Required'], fieldTemplate: 'withAriaError',
            servicesConfigOptions: { ariaService: false }
        });
        t.runner.assertFormInstallation(document, t.vhm);
        let editor = t.editorOf('Text_Required');
        expect(editor.jivsErrorMessageId).toBeUndefined();
        expect(editor.jivsAriaValidationStateUpdater).toBeFalsy();
    });
});

/**
 * Markup can name a field the manager doesn't know. FormInstaller must log a warning for each
 * such editor or field element and leave it uninstalled, without disturbing the other fields.
 */
describe('FormInstaller.install with elements that have no FieldValueHost', () =>
{
    test('An unknown editor and an unknown label each log a warning, and the known field still installs', () =>
    {
        let t = installForm({
            build: page =>
            {
                page.field('Text_Required');
                // Built by hand, so context.fieldNames omits it and the manager has no FieldValueHost for it.
                page.label('NotInManager', 'Orphan');
                page.inputEditor('NotInManager');
            }
        });
        t.runner.assertFormInstallation(document, t.vhm);
        let logger = t.services.loggingService;
        expect(logger.entryCount).toBe(2);
        let editorLog = logger.findMessage(/Editor element for 'NotInManager' is missing a fieldValueHost/,
            LoggingLevel.Warn, null, { type: 'FormInstaller', feature: 'Dom' });
        expect(editorLog).not.toBeNull();
        expect(editorLog!.data).toEqual(expect.objectContaining({ idAttribute: expect.stringContaining('editor') }));
        let labelLog = logger.findMessage(/Element with identifier 'NotInManager' and role 'label' is missing a fieldValueHost/,
            LoggingLevel.Warn, null, { type: 'FormInstaller', feature: 'Dom' });
        expect(labelLog).not.toBeNull();
        expect(labelLog!.data).toEqual(expect.objectContaining({ idAttribute: expect.stringContaining('label') }));
    });

    test('The unknown editor gets no IJivsElement but its jivsElementRole is still assigned', () =>
    {
        let t = installForm({
            build: page => { page.inputEditor('NotInManager'); }
        });
        let orphan = t.element('editor');
        expect(orphan.jivsElementRole).toBe('editor');
        expect(orphan.jivsEditorAdapterDefinition).toBeUndefined();
        let record = t.recordFor(orphan) as IEditorElementRegistryRecord;
        expect(record.jivsElement).toBeFalsy();
    });
});

/**
 * install() clears the registry before collecting, so it can run again after the page changes.
 */
describe('FormInstaller.install repeated', () =>
{
    test('Installing twice on the same markup leaves the same registry and a valid installation', () =>
    {
        let t = installForm({ fields: ['Text_Required', 'Checkbox'] });
        let before = t.runner.describeRegistry(t.vhm);
        t.install();
        expect(t.runner.describeRegistry(t.vhm)).toBe(before);
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('After an AJAX-style replacement of one field, installing again matches the new markup', () =>
    {
        let t = installForm({ fields: ['Text_Required', 'Checkbox'] });
        let oldBox = t.element('editor', 'Checkbox').parentElement!;
        t.replace(oldBox, page => page.field('Checkbox', 'labelAfter'));
        t.install();
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Elements removed from the page are no longer in the registry after installing again', () =>
    {
        let t = installForm({ fields: ['Text_Required'] });
        let registry = t.registry;
        let label = t.element('label');
        expect(registry.getRecordForElement(label)).not.toBeNull();
        label.remove();
        t.install();
        expect(registry.getRecordForElement(label)).toBeNull();
    });
});

/**
 * The manager's containerIdentifier limits where the collector looks. Several managers can share a page.
 */
describe('FormInstaller.install with containerIdentifier', () =>
{
    test('Two forms on one page install independently, each from its own container', () =>
    {
        let a = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        let b = createTestForm({ fields: ['Number_Range', 'Checkbox'], containerIdentifier: '#two', install: false, verbose: verbose });
        createTestPage(a, b).install();
        a.runner.assertFormInstallation(document, a.vhm);
        b.runner.assertFormInstallation(document, b.vhm);
        expect(a.runner.describeRegistry(a.vhm).split('\n').length).toBe(3);
        expect(b.runner.describeRegistry(b.vhm).split('\n').length).toBe(6);
        expect(a.services.loggingService.entryCount).toBe(0);
        expect(b.services.loggingService.entryCount).toBe(0);
    });

    test('A role element outside the container is not registered or installed', () =>
    {
        let t = installForm({
            fields: ['Text_Required'], containerIdentifier: '#one'
        });
        let outside = document.createElement('span');
        outside.setAttribute('data-jivs-role', 'label');
        outside.setAttribute('data-field', 'Text_Required');
        document.body.appendChild(outside);
        t.install();
        expect(t.recordFor(outside)).toBeNull();
        expect((outside as IJivsElement).jivsElementRole).toBeUndefined();
        t.runner.assertFormInstallation(document, t.vhm);
    });
});

/**
 * Editor changes reach the manager after any install, because the editor adapters listen themselves.
 * FormInstaller.install(valueHostsManager, collector) additionally attaches the dispatchers that carry
 * manager changes back to the editor. The instance install() does not.
 */
describe('FormInstaller static install', () =>
{
    function getInput(): HTMLInputElement
    {
        return document.querySelector<HTMLInputElement>("input[data-jivs-role='editor']")!;
    }

    test('A user change event updates the FieldValueHost text value after the instance install', () =>
    {
        let t = installForm({ fields: ['Text_Required'] });
        getInput().value = 'abc';
        // bubbles:true because listeners may sit above the editor
        getInput().dispatchEvent(new Event('change', { bubbles: true }));
        expect(t.vhm.getFieldByElementIdentifier('Text_Required')!.getTextValue()).toBe('abc');
    });

    test('After the static install, setting the text value in the manager updates the editor', () =>
    {
        let t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        t.page.assign();
        FormInstaller.install(t.vhm, t.collector);
        t.runner.assertFormInstallation(document, t.vhm);
        t.vhm.getFieldByElementIdentifier('Text_Required')!.setTextValue('xyz');
        expect(getInput().value).toBe('xyz');
    });

    test('After only the instance install, setting the text value in the manager leaves the editor alone', () =>
    {
        let t = installForm({ fields: ['Text_Required'] });
        t.vhm.getFieldByElementIdentifier('Text_Required')!.setTextValue('xyz');
        expect(getInput().value).toBe('');
    });
});

/**
 * FormInstaller requires both of its constructor parameters.
 */
describe('FormInstaller constructor', () =>
{
    test('A null valueHostsManager or collector throws', () =>
    {
        let t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        expect(() => new FormInstaller(null!, new SimpleDomElementCollector())).toThrow(/valueHostsManager/);
        expect(() => new FormInstaller(t.vhm, null!)).toThrow(/collector/);
    });
});
