/**
 * Assembles everything an integration test needs from a list of TestFieldRepository entry names:
 * services, rules, ValueHostsManager, context, runner, and a populated, installed form.
 */
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { SimpleDomElementCollector } from '../../../src/SimpleDom/SimpleDomElementCollector';
import type { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { BuildersFactoryInstaller } from '@plblum/jivs-builder/build/Services/BuildersFactoryInstaller';
import { FormInstaller } from '../../../src/FormInstaller/FormInstaller';
import { createJivsServicesForTesting, type configureOptions } from '../../TestSupport/CreateJivsServicesForTesting';
import { IntegrationTestContext, IntegrationTestRunner, TestHtmlBuilder } from '../Integration_Testing';
import { createDefaultTestFieldRepository, type FieldBlockOptions, type TestFieldRepository } from './TestFieldRepository';
import { TestPropertiesRules } from './TestPropertiesRules';

// Installs the builders factory on JivsServices.prototype.
new BuildersFactoryInstaller();

export interface TestFormOptions
{
    /** Defaults to the repository from createDefaultTestFieldRepository(). */
    repository?: TestFieldRepository;
    /** Per-field overrides for the companion elements, keyed by entry name. */
    blocks?: Record<string, FieldBlockOptions>;
    /** Passed to createJivsServicesForTesting. Defaults enable all conditions, parsers and formatters. */
    services?: configureOptions;
    /** Id of the form element. Defaults to 'test-form'. */
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
    form: TestHtmlBuilder;
    collector: SimpleDomElementCollector;
    /** Gathers the HTML for the names again, as for an AJAX replacement, using the same context. */
    buildFields(names: string[]): TestHtmlBuilder;
    /** Rebuilds the registry from the current document. */
    install(): void;
}

export function createTestForm(propertyNames: string[], options: TestFormOptions = {}): TestForm
{
    const repository = options.repository ?? createDefaultTestFieldRepository();
    const services = createJivsServicesForTesting({
        registerConditions: 'all',
        registerDataTypeParsers: true,
        registerFormatters: true,
        ariaService: true,
        ...options.services
    });
    const rules = new TestPropertiesRules(services, propertyNames, repository);
    const config = rules.configure();
    const vhm = new ValueHostsManager(config);

    const context = new IntegrationTestContext(vhm);
    const runner = new IntegrationTestRunner(context);
    const page = new TestHtmlBuilder(context);
    const form = page.form(options.formId ?? 'test-form');
    const addFields = (target: TestHtmlBuilder, names: string[]) =>
    {
        for (const name of names)
            repository.get(name).addToHtml(target, options.blocks?.[name]);
        return target;
    };
    addFields(form, propertyNames);

    const collector = new SimpleDomElementCollector();
    const install = () => { new FormInstaller(vhm, collector).install(); };
    if (options.install ?? true)
    {
        document.body.innerHTML = page.build();
        install();
    }
    return {
        services, config, vhm, context, runner, page, form, collector, install,
        buildFields: (names) => addFields(new TestHtmlBuilder(context), names)
    };
}
