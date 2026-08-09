import { ValueHostsManagerConfig } from "../../src/Interfaces/ValueHostsManager";
import { IValueHost, ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostsManager } from "../../src/Validation/ValueHostsManager";



export class Publicify_ValueHostsManager extends ValueHostsManager
{
    public getValueHostConfig(valueHostName: string): ValueHostConfig | null
    {
        return this.valueHostConfigs.get(valueHostName) ?? null;
    }    
    public get publicify_config(): ValueHostsManagerConfig
    {
        return this.config;
    }
    public get publicify_valueHosts(): Map<string, IValueHost> {
        return this.valueHosts;
    }    
    public get publicify_valueHostConfigs(): Map<string, ValueHostConfig> {
        return this.valueHostConfigs;
    }
 
    public publicify_invokeOnConfigChanged(): void
    {
        super.invokeOnConfigChanged();
    }
}