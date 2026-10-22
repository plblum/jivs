import { ElementCollectorBase } from '../../src/FormInstaller/ElementCollectorBase';
import { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import { ElementRole } from '../../src/Interfaces/Types';

/**
 * Minimal SimpleDom-style collector for integration tests, NOT the production jivs-simpledom implementation.
 * Reads real markup independently of TestHtmlBuilder and the test descriptors.
 * Supported attributes: data-jivs-role, data-field, data-jivs-adapterkey,
 * data-jivs-presentation, and provisional data-jivs-group.
 * During-edit configuration is deferred until the SimpleDom syntax is established.
 */
export class ElementCollectorForTests extends ElementCollectorBase
{
    public collect(root: HTMLElement, registry: IElementRegistry): void
    {
        const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-jivs-role]'));
        if (root.hasAttribute('data-jivs-role')) elements.unshift(root);
        for (const element of elements)
        {
            const role = element.getAttribute('data-jivs-role')!;
            const presentationName = element.getAttribute('data-jivs-presentation') ?? undefined;
            if (role === ElementRole.summary || role === ElementRole.submit)
            {
                const group = element.getAttribute('data-jivs-group') ?? undefined;
                registry.addForm(element, role, {
                    ...(presentationName !== undefined ? { presentationName } : {}),
                    ...(group !== undefined ? { group } : {})
                });
                continue;
            }
            const fieldName = element.getAttribute('data-field');
            if (!fieldName) throw new Error(`Missing data-field for role '${ role }' on element '${ element.id }'`);
            if (role === ElementRole.editor)
            {
                const adapterKey = element.getAttribute('data-jivs-adapterkey') ?? undefined;
                registry.addEditor(element, fieldName, {
                    ...(adapterKey !== undefined ? { adapterKey } : {}),
                    ...(presentationName !== undefined ? { presentationName } : {})
                });
            } else
            {
                registry.addField(element, fieldName, role,
                    presentationName === undefined ? {} : { presentationName });
            }
        }
    }
}