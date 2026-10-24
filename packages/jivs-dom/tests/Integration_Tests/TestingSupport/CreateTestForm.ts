/**
 * Assembles everything an integration test needs: services, context, runner, the page,
 * rules derived from the Field Identities the page uses, ValueHostsManager, and an installed form.
 */
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { SimpleDomElementCollector } from '../../../src/SimpleDom/SimpleDomElementCollector';
import type { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { BuildersFactoryInstaller } from '@plblum/jivs-builder/build/Services/BuildersFactoryInstaller';
import { FormInstaller } from '../../../src/FormInstaller/FormInstaller';
import { createJivsServicesForTesting, type configureOptions } from '../../TestSupport/CreateJivsServicesForTesting';
import { IntegrationTestContext, IntegrationTestRunner, TestHtmlBuilder } from '../Integration_Testing';
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
    /** Passed to createJivsServicesForTesting. Defaults enable all conditions, parsers and formatters. */
    services?: configureOptions;
    /** With fields: id of the generated form element. Defaults to 'test-form'. */
    formId?: string;
    /** When true, writes the HTML to document.body and runs FormInstaller. Default true. */
    install?: boolean;
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
    /** Rebuilds the registry from the current document. */
    install(): void;
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
        ...options.services
    });

    const context = new IntegrationTestContext(services.domServices);
    context.fieldTemplateSource = repository;
    const runner = new IntegrationTestRunner(context);
    const page = new TestHtmlBuilder(context);
    if (options.build)
        options.build(page);
    else if (options.formTemplate)
        page.formTemplate(options.formTemplate);
    else
    {
        const form = page.form(options.formId ?? 'test-form');
        for (const name of options.fields!)
            form.field(name, options.fieldTemplates?.[name] ?? options.fieldTemplate ?? null);
    }

    const rules = new TestPropertiesRules(services, context.fieldNames, repository);
    const config = rules.configure();
    const vhm = new ValueHostsManager(config);

    const collector = new SimpleDomElementCollector();
    const install = () => { new FormInstaller(vhm, collector).install(); };
    if (options.install ?? true)
    {
        page.assign();
        install();
    }
    return { services, config, vhm, context, runner, page, collector, install };
}
