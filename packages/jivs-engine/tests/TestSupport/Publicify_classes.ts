import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { IValueHost, ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "../../src/Interfaces/ValueHostsManager";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { ValueHostsManager } from "../../src/ValueHosts/ValueHostsManager";

export class Publicify_ValueHostsManager extends ValueHostsManager<ValueHostsManagerInstanceState>
{
    public getValueHostConfig(valueHostName: string): ValueHostConfig | null
    {
        return this.valueHostConfigs.get(valueHostName) ?? null;
    }
    public get publicify_config(): ValueHostsManagerConfig
    {
        return super.config;
    }
    public get publicify_valueHosts(): Map<string, IValueHost> {
        return super.valueHosts;
    }    
    public get publicify_valueHostConfigs(): Map<string, ValueHostConfig> {
        return super.valueHostConfigs;
    }
 
    public publicify_invokeOnConfigChanged(): void
    {
        super.invokeOnConfigChanged();
    }
}

export class Publicify_ValidationManager extends ValidationManager
{
    public getValueHostConfig(valueHostName: string): ValueHostConfig | null
    {
        return this.valueHostConfigs.get(valueHostName) ?? null;
    }    
    public get publicify_config(): ValidationManagerConfig
    {
        return super.config;
    }
    public get publicify_valueHosts(): Map<string, IValueHost> {
        return super.valueHosts;
    }    
    public get publicify_valueHostConfigs(): Map<string, ValueHostConfig> {
        return super.valueHostConfigs;
    }
 
    public publicify_invokeOnConfigChanged(): void
    {
        super.invokeOnConfigChanged();
    }
}