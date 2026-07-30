import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { IValueHost, ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValidationManager } from "../../src/Validation/ValidationManager";



export class Publicify_ValidationManager extends ValidationManager
{
    public getValueHostConfig(valueHostName: string): ValueHostConfig | null
    {
        return this.valueHostConfigs.get(valueHostName) ?? null;
    }    
    public get publicify_config(): ValidationManagerConfig
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