/**
 * Assembles everything an integration test needs: services, context, runner, the page,
 * rules derived from the Field Identities the page uses, ValueHostsManager, and an installed form.
 */
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { SimpleDomElementCollector } from '../../../src/SimpleDom/SimpleDomElementCollector';
import type { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { BuildersFactoryInstaller } from '@plblum/jivs-builder/build/Services/BuildersFactoryInstaller';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { FormInstaller } from '../../../src/FormInstaller/FormInstaller';
import type { ElementRegistryRecord, IEditorElementRegistryRecord, IElementRegistry } from '../../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../../src/Interfaces/IJivsElement';
import { createJivsServicesForTesting, type configureOptions } from '../../TestSupport/CreateJivsServicesForTesting';
import { IntegrationTestContext, IntegrationTestRunner, TestHtmlBuilder } from './Integration_Testing';
import { createDefaultTestFieldRepository, type TestFieldRepository } from './TestFieldRepository';
import { TestPropertiesRules } from './TestPropertiesRules';

// Installs the builders factory on JivsServices.prototype.
new BuildersFactoryInstaller();

export interface TestFormOptions
{
    /** Defaults to the repository from createDefaultTestFieldRepository(). */
    repository?: TestFieldRepository;
    /**
     * Supply exactly one of fields, build, or formTemplate.
     * The Field Identities that configure the ValueHostsManager are those used through TestHtmlBuilder.field().
     *
     * fields: names of Field Identities. Generates one form holding each in order.
     */
    fields?: string[];
    /** Your own recipe that builds the page. */
    build?: (page: TestHtmlBuilder) => void;
    /** The name of a registered form template. */
    formTemplate?: string;
    /** With fields: the field template used for names not in fieldTemplates. Defaults to 'default'. */
    fieldTemplate?: string;
    /** With fields: field template per Field Identity name. */
    fieldTemplates?: Record<string, string>;
    /** With fields: values placed into the generated editors before installation. */
    initialValues?: Record<string, string | number | boolean>;
    /**
     * Passed to createJivsServicesForTesting. Defaults enable all conditions, parsers and formatters,
     * and log Warn and above into services.loggingService (a TestingLoggingService) so tests can assert on them.
     */
    services?: configureOptions;
    /** With fields: id of the generated form element. Defaults to 'test-form'. */
    formId?: string;
    /** With fields: additional attributes on the generated form element, such as a class a non-#id containerIdentifier selects. */
    formAttributes?: string;
    /** When true, writes the HTML to document.body and runs FormInstaller. Default true. */
    install?: boolean;
    /**
     * Selector of this form's container, such as '#one'. Sets the manager's containerIdentifier,
     * and the descriptors capture it so the runner checks only this form. Also prefixes generated element ids
     * so several forms can share a page. With the fields source, '#one' makes the form's id 'one';
     * for any other selector, or with build/formTemplate, the page you build must contain the matching element.
     */
    containerIdentifier?: string;
    /**
     * Runs on a shallow copy of the ValueHostsManagerConfig just before the manager is created,
     * after containerIdentifier has been assigned. Replace nested objects such as behaviors rather than editing them,
     * because the rules cache shares them.
     */
    configure?: (config: ValueHostsManagerConfig) => void;
    /** Sets context.verbose so the HTML and ElementRegistry are printed. Add it to one createTestForm call while investigating. */
    verbose?: boolean;
}

export interface TestForm
{
    services: ReturnType<typeof createJivsServicesForTesting>;
    config: ValueHostsManagerConfig;
    vhm: ValueHostsManager;
    context: IntegrationTestContext;
    runner: IntegrationTestRunner;
    page: TestHtmlBuilder;
    collector: SimpleDomElementCollector;
    /** The manager's ElementRegistry, created on first use. */
    readonly registry: IElementRegistry;
    /** Runs FormInstaller against the current document. It clears and rebuilds the registry. */
    install(): void;
    /** Runs only the collector against the manager's container. It clears and rebuilds the registry. */
    collect(): void;
    /**
     * The first element with data-jivs-role equal to role, and data-field equal to fieldName when supplied.
     * Searches only the manager's container when it has one. Throws when none exists.
     */
    element(role: string, fieldName?: string): IJivsElement;
    /** The registry record for an element, or null if it is not registered. */
    recordFor(element: HTMLElement): ElementRegistryRecord | null;
    /**
     * The IJivsElement that EditorInstaller created for the field's editor.
     * Throws when the page has no such editor or it has not been installed.
     */
    editorOf(fieldName: string): IJivsElement;
    /**
     * Simulates an AJAX-style replacement. Removes the descriptors for oldElement's subtree,
     * builds new markup with the same context, and replaces oldElement's children with it.
     * Run collect() or install() afterward to refresh the registry.
     */
    replace(oldElement: HTMLElement, build: (page: TestHtmlBuilder) => void): void;
}

export interface TestPage
{
    forms: TestForm[];
    /** Runs install() on every form, each from its own container. */
    install(): void;
    /** Runs collect() on every form, each from its own container. */
    collect(): void;
}

/**
 * Several forms on one page, each with its own ValueHostsManager.
 * Create each form with createTestForm({ containerIdentifier, install: false }). This joins their HTML
 * and writes it to document.body. Nothing is collected or installed until you call install() or collect().
 */
export function createTestPage(...forms: TestForm[]): TestPage
{
    if (!forms.length)
        throw new Error('createTestPage requires at least one form.');
    for (const form of forms.slice(1))
        forms[0].page.append(form.page);
    forms[0].page.assign();
    return {
        forms,
        install: () => forms.forEach(f => f.install()),
        collect: () => forms.forEach(f => f.collect())
    };
}

/**
 * The page is built first, because the Field Identities it uses (context.fieldNames)
 * determine the rules that create the ValueHostsManager.
 */
export function createTestForm(options: TestFormOptions): TestForm
{
    const sources = [options.fields, options.build, options.formTemplate].filter(s => s !== undefined).length;
    if (sources !== 1)
        throw new Error('createTestForm requires exactly one of: fields, build, formTemplate.');
    const repository = options.repository ?? createDefaultTestFieldRepository();
    const services = createJivsServicesForTesting({
        registerConditions: 'all',
        registerDataTypeParsers: true,
        registerFormatters: true,
        ariaService: true,
        loggerLevel: LoggingLevel.Warn,
        ...options.services
    });

    const context = new IntegrationTestContext(services.domServices);
    context.fieldTemplateSource = repository;
    context.verbose = options.verbose ?? false;
    const container = options.containerIdentifier;
    if (container)
    {
        context.containerIdentifier = container;
        context.idPrefix = `${ container.replace(/[^A-Za-z0-9_-]/g, '') }-`.toLowerCase();
    }
    let formId = options.formId;
    if (!formId && container)
    {
        if (!container.startsWith('#'))
            throw new Error(`containerIdentifier '${ container }' is not an '#id' selector, so formId is required with the fields source.`);
        formId = container.slice(1);
    }
    const runner = new IntegrationTestRunner(context);
    const page = new TestHtmlBuilder(context);
    if (options.build)
        options.build(page);
    else if (options.formTemplate)
        page.formTemplate(options.formTemplate);
    else
    {
        const form = page.form(formId ?? 'test-form', options.formAttributes);
        for (const name of options.fields!)
        {
            const initialValue = options.initialValues?.[name];
            form.field(name, options.fieldTemplates?.[name] ?? options.fieldTemplate ?? null,
                initialValue === undefined ? undefined : { initialValue });
        }
    }

    const rules = new TestPropertiesRules(services, context.fieldNames, repository);
    const config = { ...rules.configure() };
    if (container) config.containerIdentifier = container;
    options.configure?.(config);
    const vhm = new ValueHostsManager(config);

    const collector = new SimpleDomElementCollector();
    const install = () => { new FormInstaller(vhm, collector).install(); };
    const registry = () => services.domServices.getElementRegistry(vhm);
    const scope = (): ParentNode =>
        (container ? document.querySelector(container) : null) ?? document;
    const testForm: TestForm = {
        services, config, vhm, context, runner, page, collector, install,
        get registry() { return registry(); },
        collect()
        {
            const reg = registry();
            reg.clear();
            collector.collect(services.domServices.resolveContainerElement(vhm), reg);
        },
        element(role, fieldName)
        {
            const selector = `[data-jivs-role='${ role }']` + (fieldName ? `[data-field='${ fieldName }']` : '');
            const found = scope().querySelector<IJivsElement>(selector);
            if (!found)
                throw new Error(`No element matches ${ selector }.`);
            return found;
        },
        recordFor: (element) => registry().getRecordForElement(element),
        editorOf(fieldName)
        {
            const record = registry().getRecordForElement(testForm.element('editor', fieldName)) as IEditorElementRegistryRecord | null;
            if (!record?.jivsElement)
                throw new Error(`The editor for '${ fieldName }' is not installed.`);
            return record.jivsElement;
        },
        replace(oldElement, build)
        {
            runner.removeDescriptorsIn(oldElement);
            const replacement = new TestHtmlBuilder(context);
            build(replacement);
            const holder = document.createElement('div');
            replacement.assign(holder);
            oldElement.replaceChildren(...Array.from(holder.childNodes));
        }
    };
    if (options.install ?? true)
    {
        page.assign();
        install();
    }
    return testForm;
}
