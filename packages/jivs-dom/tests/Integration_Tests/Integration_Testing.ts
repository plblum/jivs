/** Integration testing helpers for Jivs-DOM. Test infrastructure, not production API.
 * Descriptors refer to the currently installed DOM. Rebuilding a subtree requires
 * rebuilding its descriptors and rerunning the collector/installer before assertions.
 */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IEditorElementRegistryRecord, ElementRegistryRecord } from '../../src/Interfaces/ElementRegistry';
import type { IFieldPresentation } from '../../src/Interfaces/FieldPresentations';
import type { IFormPresentation } from '../../src/Interfaces/FormPresentations';
import { ElementRole } from '../../src/Interfaces/Types';

export interface TestFailure {
    id: string;
    role: ElementRole | string;
    fieldName: string | null;
    propertyName: string;
    message: string;
    expected?: unknown;
    actual?: unknown;
    [key: string]: unknown;
}

/** Options passed through to the editor method that a Field Identity chooses. */
export interface FieldEditorOptions {
    presentationName?: string | null;
    adapterKey?: string | null;
    additionalAttributes?: string;
}

/**
 * Supplies Field Identities and templates to TestHtmlBuilder.field() and formTemplate().
 * Implemented by the repository in TestingSupport so this file does not depend on it.
 */
export interface IFieldTemplateSource {
    buildField(page: TestHtmlBuilder, name: string, templateName?: string | null, editorOptions?: FieldEditorOptions): void;
    buildForm(page: TestHtmlBuilder, templateName: string): void;
}

export class IntegrationTestContext {
    public containerIdentifier: string | null = null;
    public fieldTemplateSource: IFieldTemplateSource | null = null;
    public runner: IntegrationTestRunner | null = null;
    public readonly failures: TestFailure[] = [];
    /** Field Identity names used through TestHtmlBuilder.field(), in first-use order. Feeds the manager's rules. */
    public readonly fieldNames: string[] = [];
    private readonly fieldStack: string[] = [];
    private nextNumber = 0;

    constructor(public readonly domServices: IJivsDomServices) {}

    public nextId(base: string): string { return `${base}-${++this.nextNumber}`; }
    /** The Field Identity name of the innermost running field() call, or null outside of one. */
    public get currentFieldName(): string | null { return this.fieldStack.at(-1) ?? null; }
    /** Records the name, makes it current while run executes, then restores the previous current name. */
    public withField(name: string, run: () => void): void {
        if (!this.fieldNames.includes(name)) this.fieldNames.push(name);
        this.fieldStack.push(name);
        try { run(); } finally { this.fieldStack.pop(); }
    }
}

function printable(value: unknown): unknown {
    if (value === undefined) return '<undefined>';
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.map(printable);
    if (typeof value === 'object') return (value as object).constructor?.name ?? 'Object';
    return String(value);
}

export abstract class RoleTestDescriptorBase {
    public abstract readonly role: ElementRole | string;
    public readonly domServices: IJivsDomServices;
    public readonly containerIdentifier: string | null;
    public presentationName: string | null = null;
    public adapterKey: string | null = null;
    public duringEdit: boolean | undefined;
    public validationGroup: string | undefined;
    public expectedPresentation: IFieldPresentation | IFormPresentation | null = null;

    constructor(public readonly id: string, public readonly fieldName: string | null, context: IntegrationTestContext) {
        this.domServices = context.domServices;
        this.containerIdentifier = context.containerIdentifier;
        this.failures = context.failures;
    }
    private readonly failures: TestFailure[];

    protected addFailure(propertyName: string, message: string, expected?: unknown, actual?: unknown,
        additionalProperties?: Record<string, unknown>): void {
        this.failures.push({ id: this.id, role: this.role, fieldName: this.fieldName,
            propertyName, message, expected: printable(expected), actual: printable(actual), ...additionalProperties });
    }
    protected checkEqual(propertyName: string, expected: unknown, actual: unknown): void {
        if (expected !== actual) this.addFailure(propertyName, 'Values do not match', expected, actual);
    }
    protected checkDefined(propertyName: string, actual: unknown): void {
        if (actual === undefined) this.addFailure(propertyName, 'Value is undefined', 'defined', actual);
    }
    protected checkPresentation(propertyName: string, expected: IFieldPresentation | IFormPresentation | null,
        actual: IFieldPresentation | IFormPresentation | null | undefined): void {
        // The installer does not assign a presentation to roles without one (such as aria-error), leaving undefined.
        if (expected === null ? actual !== null : !actual || expected.constructor !== actual.constructor)
            this.addFailure(propertyName, 'Presentation does not match', expected, actual);
    }
    protected checkAriaUpdater(element: IJivsElement): void {
        const ariaService = this.domServices.ariaService;
        if (!ariaService) this.checkEqual('JivsElement.jivsAriaValidationStateUpdater', undefined, element.jivsAriaValidationStateUpdater);
        else
        {
            // resolveValidationStateUpdater creates a new instance each call, so compare types.
            const expected = ariaService.resolveValidationStateUpdater(element);
            const actual = element.jivsAriaValidationStateUpdater;
            if (!expected || !actual ? expected !== actual : expected.constructor !== actual.constructor)
                this.addFailure('JivsElement.jivsAriaValidationStateUpdater', 'Values do not match', expected, actual);
        }
    }
    protected checkUndefinedProperties(element: IJivsElement, names: (keyof IJivsElement)[]): void {
        for (const name of names) this.checkEqual(`JivsElement.${String(name)}`, undefined, element[name]);
    }
    protected checkFieldPresentation(element: IJivsElement, installed: boolean): void {
        if (!installed) this.checkEqual('JivsElement.jivsFieldPresentation', undefined, element.jivsFieldPresentation);
        else this.checkPresentation('JivsElement.jivsFieldPresentation', this.expectedPresentation as IFieldPresentation | null,
            element.jivsFieldPresentation);
    }
    protected checkFieldNegatives(element: IJivsElement): void {
        this.checkUndefinedProperties(element, ['jivsEditorAdapterDefinition', 'jivsTextValueAdapter', 'jivsValueAdapter',
            'jivsFormPresentation', 'jivsFormPresentationGroup', 'jivsErrorMessageId']);
    }
    protected checkFormProperties(element: IJivsElement): void {
        // With no presentation registered for the role (such as submit) the installer leaves the property undefined.
        if (!(this.expectedPresentation === null && element.jivsFormPresentation === undefined))
            this.checkPresentation('JivsElement.jivsFormPresentation', this.expectedPresentation as IFormPresentation | null,
                element.jivsFormPresentation);
        this.checkEqual('JivsElement.jivsFormPresentationGroup', this.expectedPresentation === null ? undefined : this.validationGroup, element.jivsFormPresentationGroup);
        this.checkUndefinedProperties(element, ['jivsEditorAdapterDefinition', 'jivsTextValueAdapter', 'jivsValueAdapter',
            'jivsFieldPresentation', 'jivsErrorMessageId', 'jivsAriaValidationStateUpdater']);
    }
    public testAriaInstallation(element: IJivsElement, participates: boolean): void {
        if (participates && this.domServices.ariaService) this.checkAriaUpdater(element);
        else this.checkEqual('JivsElement.jivsAriaValidationStateUpdater', undefined, element.jivsAriaValidationStateUpdater);
    }
    public checkEqualErrorMessageIdUndefined(element: IJivsElement): void {
        this.checkEqual('JivsElement.jivsErrorMessageId', undefined, element.jivsErrorMessageId);
    }
    public checkUnmatched(element: IJivsElement): void {
        this.checkEqual('JivsElement.jivsElementRole', this.role, element.jivsElementRole);
        this.checkEqual('JivsElement.jivsEditorAdapterDefinition', undefined, element.jivsEditorAdapterDefinition);
        this.checkEqual('JivsElement.jivsFieldPresentation', undefined, element.jivsFieldPresentation);
    }
    /** Test installed properties, not the markup authored by TestHtmlBuilder. */
    public testElement(element: IJivsElement): void {
        this.checkEqual('JivsElement.jivsElementRole', this.role, element.jivsElementRole);
    }
    public testRegistryRecord(record: ElementRegistryRecord): void {
        this.checkEqual('RegRecord.role', this.role, record.role);
        this.checkEqual('RegRecord.kind', this.fieldName === null ? 'form' : 'field', record.kind);
        this.checkEqual('RegRecord.elementIdentifier', this.fieldName, record.elementIdentifier);
        if (this.fieldName === null) this.checkEqual('RegRecord.fieldValueHost', null, record.fieldValueHost);
    }
    /** Resolve a comparison instance without retaining the factory's temporary DOM element. */
    public resolveExpectedPresentation(tagName: string, presentationName: string | null = this.presentationName): void {
        const element = document.createElement(tagName) as IJivsElement;
        const factory = this.fieldName === null ? this.domServices.formPresentationFactory : this.domServices.fieldPresentationFactory;
        this.expectedPresentation = factory.create(element, this.role, presentationName) as IFieldPresentation | IFormPresentation | null;
    }
    public report(propertyName: string, message: string, expected?: unknown, actual?: unknown): void {
        this.addFailure(propertyName, message, expected, actual);
    }
}

export class EditorTestDescriptor extends RoleTestDescriptorBase {
    public readonly role = ElementRole.editor;
    /** Text/value adapter creation is owned and separately tested by EditorAdapterDefinition. */
    public expectedDefinition: unknown = null;
    public override testElement(element: IJivsElement): void {
        super.testElement(element);
        this.checkEqual('JivsElement.jivsEditorAdapterDefinition', this.expectedDefinition,
            element.jivsEditorAdapterDefinition);
        this.checkFieldPresentation(element, true);
        this.checkUndefinedProperties(element, ['jivsFormPresentation', 'jivsFormPresentationGroup']);
    }
    public override testRegistryRecord(record: ElementRegistryRecord): void {
        super.testRegistryRecord(record);
        if (record.role !== ElementRole.editor) return;
        const editor = record as IEditorElementRegistryRecord;
        this.checkEqual('RegRecord.editorOptions.adapterKey', this.explicitAdapterKey ? this.adapterKey : undefined,
            editor.editorOptions?.adapterKey);
        this.checkEqual('RegRecord.editorOptions.presentationName', this.presentationName ?? null,
            editor.editorOptions?.presentationName ?? null);
        this.checkEqual('RegRecord.editorOptions.duringEdit', this.duringEdit, editor.editorOptions?.duringEdit);
        // A missing installation target is reported once by IntegrationTestRunner.
        if (!record.fieldValueHost) this.checkEqual('RegRecord.jivsElement', null, editor.jivsElement);
    }
    public explicitAdapterKey = false;
}

export abstract class FieldRoleTestDescriptor extends RoleTestDescriptorBase {
    public override testElement(element: IJivsElement): void {
        super.testElement(element);
        this.checkFieldPresentation(element, true);
        this.checkFieldNegatives(element);
        // ARIA service processes only eligible field anchors; the runner determines applicability.
    }
    public override testRegistryRecord(record: ElementRegistryRecord): void {
        super.testRegistryRecord(record);
        if ('presentationOptions' in record) this.checkEqual('RegRecord.presentationOptions.presentationName',
            this.presentationName ?? undefined, record.presentationOptions?.presentationName);
    }
}
export class LabelTestDescriptor extends FieldRoleTestDescriptor { public readonly role = ElementRole.label; }
export class RequiredTestDescriptor extends FieldRoleTestDescriptor { public readonly role = ElementRole.required; }
export class ErrorTestDescriptor extends FieldRoleTestDescriptor { public readonly role = ElementRole.error; }
export class AriaErrorTestDescriptor extends FieldRoleTestDescriptor {
    public readonly role = ElementRole.ariaError;
    // The installer leaves the presentation unset (undefined) for aria-error; null is also accepted.
    protected override checkFieldPresentation(element: IJivsElement, installed: boolean): void {
        if (element.jivsFieldPresentation === undefined) return;
        super.checkFieldPresentation(element, installed);
    }
}
export class FieldContainerTestDescriptor extends FieldRoleTestDescriptor { public readonly role = ElementRole.container; }

export abstract class FormRoleTestDescriptor extends RoleTestDescriptorBase {
    public override testElement(element: IJivsElement): void { super.testElement(element); this.checkFormProperties(element); }
    public override testRegistryRecord(record: ElementRegistryRecord): void {
        super.testRegistryRecord(record);
        if ('presentationOptions' in record) {
            this.checkEqual('RegRecord.presentationOptions.presentationName', this.presentationName ?? undefined,
                record.presentationOptions?.presentationName);
            this.checkEqual('RegRecord.presentationOptions.group', this.validationGroup,
                'group' in (record.presentationOptions ?? {}) ? (record.presentationOptions as { group?: string }).group : undefined);
        }
    }
}
export class SummaryTestDescriptor extends FormRoleTestDescriptor { public readonly role = ElementRole.summary; }
export class SubmitTestDescriptor extends FormRoleTestDescriptor { public readonly role = ElementRole.submit; }

export class IntegrationTestRunner {
    public readonly descriptors: RoleTestDescriptorBase[] = [];
    constructor(public readonly context: IntegrationTestContext) { context.runner = this; }
    public add(descriptor: RoleTestDescriptorBase): void { this.descriptors.push(descriptor); }
    /** Remove expectations for a subtree before replacing its DOM nodes. */
    public removeDescriptorsIn(root: Element | DocumentFragment): void {
        const ids = new Set(Array.from(root.querySelectorAll<HTMLElement>('[id]'), element => element.id));
        if (root instanceof Element && root.id) ids.add(root.id);
        for (let i = this.descriptors.length - 1; i >= 0; i--) {
            if (ids.has(this.descriptors[i].id)) this.descriptors.splice(i, 1);
        }
    }
    public assertFormInstallation(doc: Document, valueHostsManager: IValueHostsManager): void {
        const failures = this.context.failures;
        failures.length = 0;
        const containerIdentifier = valueHostsManager.getContainerIdentifier() ?? null;
        const chosen = this.descriptors.filter(d => d.containerIdentifier === containerIdentifier);
        const registry = this.context.domServices.getElementRegistry(valueHostsManager);
        if (!chosen.length) failures.push({ id: '', role: '', fieldName: null, propertyName: 'containerIdentifier',
            message: 'No descriptors matched this manager', expected: printable(containerIdentifier) });
        for (const descriptor of chosen) {
            const element = doc.getElementById(descriptor.id) as IJivsElement | null;
            if (!element) { descriptor.report('HTMLElement', 'Element not found'); continue; }
            const record = registry.getRecordForElement(element);
            if (!record) { descriptor.report('RegRecord', 'Registry record not found'); continue; }
            descriptor.testRegistryRecord(record);
            if (record.kind === 'field' && descriptor.fieldName !== null) {
                const found = valueHostsManager.getFieldByElementIdentifier(descriptor.fieldName) != null;
                if (found !== (record.fieldValueHost !== null))
                    descriptor.report('RegRecord.fieldValueHost', 'FieldValueHost presence does not match', found ? 'defined' : null, record.fieldValueHost ? 'defined' : null);
            }
            if (record.kind === 'form') {
                // Form presentation installation does not require FieldValueHost.
                descriptor.testElement(element);
                continue;
            }
            const isEditor = record.role === ElementRole.editor;
            const target = isEditor ? (record as IEditorElementRegistryRecord).jivsElement : element;
            if (!record.fieldValueHost) {
                descriptor.checkUnmatched(element);
                continue;
            }
            if (!target) {
                descriptor.report('RegRecord.jivsElement', 'Installed editor element missing', 'defined', null);
                continue;
            }
            if (isEditor && descriptor instanceof EditorTestDescriptor) {
                const definition = descriptor.explicitAdapterKey
                    ? this.context.domServices.editorAdapterDefinitionFactory.getDefinition(descriptor.adapterKey!)
                    : this.context.domServices.editorAdapterDefinitionFactory.findDefinition(record.fieldValueHost, element);
                descriptor.expectedDefinition = definition;
                // An explicit presentation name overrides the adapter's recommendation;
                // otherwise the adapter recommendation takes precedence over the role default.
                const recommendation = (definition as { recommendedFieldPresentationName?: string | null } | null)
                    ?.recommendedFieldPresentationName ?? null;
                descriptor.resolveExpectedPresentation(target.tagName.toLowerCase(),
                    descriptor.presentationName ?? recommendation);
            }
            descriptor.testElement(target);
            const ariaService = this.context.domServices.ariaService;
            let participates = false;
            if (ariaService) {
                const anchors = registry.getFieldAriaElementAnchors(record.elementIdentifier);
                participates = target === anchors.editorJivsElement || target === anchors.errorMessageElement;
                if (isEditor) {
                    const shouldHaveId = participates && anchors.errorMessageElement !== null;
                    const hasId = target.jivsErrorMessageId !== undefined;
                    if (shouldHaveId !== hasId)
                        descriptor.report('JivsElement.jivsErrorMessageId', 'Error message ID presence does not match',
                            shouldHaveId ? 'defined' : '<undefined>', target.jivsErrorMessageId);
                }
            } else if (isEditor) {
                descriptor.checkEqualErrorMessageIdUndefined(target);
            }
            descriptor.testAriaInstallation(target, participates);
        }
        expect(failures).toEqual([]);
    }
}

/** Mutable, composable HTML builder. Child builders retain the shared context and ID counter. */
export class TestHtmlBuilder {
    private readonly segments: Array<string | TestHtmlBuilder> = [];
    constructor(public readonly context: IntegrationTestContext) {}
    public raw(html: string): this { this.segments.push(html); return this; }
    public append(builder: TestHtmlBuilder): this { this.segments.push(builder); return this; }
    public children(tagName: string, attributes: string = ''): TestHtmlBuilder {
        this.raw(`<${tagName}${attributes ? ' ' + attributes : ''}>`);
        const child = new TestHtmlBuilder(this.context);
        this.segments.push(child, `</${tagName}>`);
        return child;
    }
    public setContainerIdentifier(value: string | null): this { this.context.containerIdentifier = value; return this; }
    public build(): string { return this.segments.map(s => typeof s === 'string' ? s : s.build()).join(''); }
    /**
     * Builds the HTML and replaces the content of the target with it.
     * A Document target uses its body. Defaults to document.body. Returns the HTML.
     */
    public assign(target: Document | HTMLElement = document): string {
        const html = this.build();
        (target instanceof Document ? target.body : target).innerHTML = html;
        return html;
    }
    private addRole<T extends RoleTestDescriptorBase>(descriptor: T, tag: string, attrs: string,
        content: string = '', voidTag: boolean = false, presentationName: string | null = null): T {
        descriptor.presentationName = presentationName;
        if (this.context.runner) {
            // Editors resolve expected presentations at assertion time, after the adapter
            // definition and FieldValueHost are available.
            if (descriptor.role !== ElementRole.editor) descriptor.resolveExpectedPresentation(tag);
            this.context.runner.add(descriptor);
        }
        const roleAttrs = `id='${descriptor.id}' data-jivs-role='${descriptor.role}'` +
            (descriptor.fieldName === null ? '' : ` data-field='${descriptor.fieldName}'`) +
            (presentationName ? ` data-jivs-presentation='${presentationName}'` : '');
        this.raw(`<${tag} ${roleAttrs}${attrs ? ' ' + attrs : ''}${voidTag ? '>' : `>${content}</${tag}>`}`);
        return descriptor;
    }
    private makeId(role: string, fieldName: string | null, detail: string = ''): string {
        return this.context.nextId([role, detail, fieldName].filter(Boolean).join('-').toLowerCase());
    }
    // A null field name means "the field() currently being built".
    private resolveField(fieldName: string | null): string {
        const resolved = fieldName ?? this.context.currentFieldName;
        if (resolved === null)
            throw new Error('A null field name needs a current field. Call this inside field() or pass the name.');
        return resolved;
    }
    private editorTag(tag: string, fieldName: string | null, expectedKey: string, presentation: string | null,
        explicitKey: string | null, attrs: string, type?: string, content: string = '', voidTag: boolean = false): this {
        const field = this.resolveField(fieldName);
        const d = new EditorTestDescriptor(this.makeId('editor', field, expectedKey), field, this.context);
        d.adapterKey = explicitKey ?? expectedKey;
        d.explicitAdapterKey = explicitKey !== null;
        this.addRole(d, tag, `${type ? `type='${type}' ` : ''}${explicitKey !== null ? `data-jivs-adapterkey='${explicitKey}' ` : ''}${attrs}`,
            content, voidTag, presentation);
        return this;
    }
    public editor(tagName: string, fieldName: string | null, adapterKey: string, presentationName: string | null = null,
        additionalAttributes: string = '', explicitAdapterKey: boolean = false): this {
        return this.editorTag(tagName, fieldName, adapterKey, presentationName,
            explicitAdapterKey ? adapterKey : null, additionalAttributes);
    }
    public inputEditor(fieldName: string | null, type: string = 'text', presentationName: string | null = null,
        adapterKey: string | null = null, additionalAttributes: string = ''): this {
        return this.editorTag('input', fieldName, `input:${type}`, presentationName, adapterKey, additionalAttributes, type, '', true);
    }
    public checkboxEditor(fieldName: string | null, presentationName: string | null = null,
        adapterKey: string | null = null, additionalAttributes: string = ''): this {
        return this.inputEditor(fieldName, 'checkbox', presentationName, adapterKey, additionalAttributes);
    }
    public fileInputEditor(fieldName: string | null, presentationName: string | null = null,
        adapterKey: string | null = null, additionalAttributes: string = ''): this {
        return this.inputEditor(fieldName, 'file', presentationName, adapterKey, additionalAttributes);
    }
    public radioEditor(fieldName: string | null, groupName: string, values: string[], presentationName: string | null = null,
        adapterKey: string | null = null, additionalAttributes: string = ''): this {
        values.forEach((value, i) => {
            if (!i) this.editorTag('input', fieldName, 'input:radio', presentationName, adapterKey,
                `name='${groupName}' value='${value}' ${additionalAttributes}`, 'radio', '', true);
            else this.raw(`<input type='radio' name='${groupName}' value='${value}'>`);
        });
        return this;
    }
    public textAreaEditor(fieldName: string | null, presentationName: string | null = null,
        adapterKey: string | null = null, additionalAttributes: string = ''): this {
        return this.editorTag('textarea', fieldName, 'textarea', presentationName, adapterKey, additionalAttributes);
    }
    public selectEditor(fieldName: string | null, options: { value: string; text: string }[], presentationName: string | null = null,
        adapterKey: string | null = null, additionalAttributes: string = ''): this {
        const content = options.map(o => `<option value='${o.value}'>${o.text}</option>`).join('');
        return this.editorTag('select', fieldName, 'select', presentationName, adapterKey, additionalAttributes,
            undefined, content);
    }
    private fieldRole<T extends RoleTestDescriptorBase>(ctor: new (id: string, field: string | null, context: IntegrationTestContext) => T,
        name: string, fieldNameOrNull: string | null, presentationName: string | null, attributes: string,
        tag: string, content: string = ''): this {
        const fieldName = this.resolveField(fieldNameOrNull);
        const descriptor = new ctor(this.makeId(name, fieldName), fieldName, this.context);
        this.addRole(descriptor, tag, attributes, content, false, presentationName);
        return this;
    }
    public label(fieldName: string | null, content: string, presentationName: string | null = null,
        additionalAttributes: string = ''): this {
        return this.fieldRole(LabelTestDescriptor, 'label', fieldName, presentationName, additionalAttributes, 'label', content);
    }
    public requiredIndicator(fieldName: string | null, content: string = '', presentationName: string | null = null,
        additionalAttributes: string = ''): this {
        return this.fieldRole(RequiredTestDescriptor, 'required', fieldName, presentationName, additionalAttributes, 'span', content);
    }
    public errorDisplay(fieldName: string | null, presentationName: string | null = null, additionalAttributes: string = ''): this {
        return this.fieldRole(ErrorTestDescriptor, 'error', fieldName, presentationName, additionalAttributes, 'div');
    }
    public ariaError(fieldName: string | null): this {
        return this.fieldRole(AriaErrorTestDescriptor, 'aria-error', fieldName, null, "class='jivs-visually-hidden'", 'div');
    }
    public fieldContainer(fieldNameOrNull: string | null, presentationName: string | null = null,
        additionalAttributes: string = '', tagName: string = 'div'): TestHtmlBuilder {
        const fieldName = this.resolveField(fieldNameOrNull);
        const descriptor = new FieldContainerTestDescriptor(this.makeId('fieldcontainer', fieldName), fieldName, this.context);
        descriptor.presentationName = presentationName;
        if (this.context.runner) { descriptor.resolveExpectedPresentation(tagName); this.context.runner.add(descriptor); }
        const attrs = `id='${descriptor.id}' data-jivs-role='${descriptor.role}' data-field='${fieldName}'` +
            (presentationName ? ` data-jivs-presentation='${presentationName}'` : '') +
            (additionalAttributes ? ` ${additionalAttributes}` : '');
        return this.children(tagName, attrs);
    }
    private formRole<T extends RoleTestDescriptorBase>(ctor: new (id: string, field: string | null, context: IntegrationTestContext) => T,
        name: string, presentation: string | null, group: string | null, attrs: string, tag: string, content: string,
        voidTag: boolean = false): this {
        const descriptor = new ctor(this.makeId(name, null), null, this.context);
        descriptor.validationGroup = group ?? undefined;
        return this.addFormRole(descriptor, tag, presentation, group, attrs, content, voidTag);
    }
    private addFormRole(d: RoleTestDescriptorBase, tag: string, presentation: string | null, group: string | null,
        attrs: string, content: string, voidTag: boolean): this {
        this.addRole(d, tag, `${group !== null ? `data-jivs-group='${group}' ` : ''}${attrs}`, content, voidTag, presentation);
        return this;
    }
    public validationSummary(presentationName: string | null = null, validationGroup: string | null = null,
        additionalAttributes: string = '', tagName: string = 'div'): this {
        return this.formRole(SummaryTestDescriptor, 'summary', presentationName, validationGroup, additionalAttributes, tagName, '');
    }
    public submit(presentationName: string | null = null, validationGroup: string | null = null,
        content: string = 'Submit', additionalAttributes: string = '', useButton: boolean = false): this {
        return this.formRole(SubmitTestDescriptor, 'submit', presentationName, validationGroup,
            `${useButton ? "type='submit'" : `type='submit' value='${content}'`} ${additionalAttributes}`,
            useButton ? 'button' : 'input', useButton ? content : '', !useButton);
    }
    public form(id: string = 'test-form', additionalAttributes: string = ''): TestHtmlBuilder {
        return this.children('form', `id='${id}' novalidate${additionalAttributes ? ' ' + additionalAttributes : ''}`);
    }
    private requireTemplateSource(): IFieldTemplateSource {
        if (!this.context.fieldTemplateSource)
            throw new Error('context.fieldTemplateSource is not assigned. Assign a TestFieldRepository.');
        return this.context.fieldTemplateSource;
    }
    /** Adds all HTML for one Field Identity using a named field template ('default' when omitted). */
    public field(name: string, templateName: string | null = null, editorOptions?: FieldEditorOptions): this {
        this.context.withField(name, () =>
            this.requireTemplateSource().buildField(this, name, templateName, editorOptions));
        return this;
    }
    /** Runs a registered form template, which is a recipe of calls on this builder. */
    public formTemplate(templateName: string): this {
        this.requireTemplateSource().buildForm(this, templateName);
        return this;
    }
}
