/**
 * A reusable ValueHostRulesBase subclass for integration tests.
 * It is constructed with the names of entries in a TestFieldRepository and configures
 * a FieldValueHost for each.
 */
import { ValueHostRulesBase } from '@plblum/jivs-builder/build/ValueHostRules/ValueHostRules';
import type { IValueHostsManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';
import type { ValueHostRulesOptions } from '@plblum/jivs-builder/build/Interfaces/ValueHostRules';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { TestFieldRepository } from './TestFieldRepository';

export class TestPropertiesRules extends ValueHostRulesBase
{
    constructor(services: IJivsServices,
        public readonly propertyNames: string[],
        private readonly repository: TestFieldRepository)
    {
        super(services);
    }

    protected override configureRules(builder: IValueHostsManagerConfigBuilder, options?: ValueHostRulesOptions): void
    {
        for (const name of this.propertyNames)
            this.repository.get(name).addToConfig(builder);
    }

    // Different property sets must not share a cached configuration.
    protected override getValueHostRulesKey(): string
    {
        return `${ super.getValueHostRulesKey() }:${ this.propertyNames.join(',') }`;
    }
}
