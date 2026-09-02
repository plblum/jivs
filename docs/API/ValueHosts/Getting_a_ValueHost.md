# Getting a ValueHost from the ValueHostsManager
Start with a `ValueHostsManager` instance. It should already be configured with ValueHosts. Supposing *vhm* has that `ValueHostsManager`, do this to get a `ValueHost`:

|Code|Notes|Not found|
|----|-----|---------|
|`vhm.getValueHost('name')`|Typed as the base class to all `ValueHosts`|Returns null|
|`vhm.getFieldValueHost('name')`|`FieldValueHost`|Returns null|
|`vhm.getStaticValueHost('name')`|`StaticValueHost`|Returns null|
|`vhm.getCalcValueHost('name')`|`CalcValueHost`|Returns null|
|`vhm.vh.field('name')`|`FieldValueHost`|Throws error|
|`vhm.vh.static('name')`|`StaticValueHost`|Throws error|
|`vhm.vh.calc('name')`|`CalcValueHost`|Throws error|
|`vhm.vh.any('name')`|Base to all `ValueHosts`|Throws error|
|`vhm.getFieldByElementIdentifier('element identifier')`|`FieldValueHost` by matching its `elementIdentifier` configuration property|Returns null|
|`vhm.getFieldByPropertyName('property name')`|`FieldValueHost` by matching its `propertyName` configuration property|Returns null|
---
Go to [ValueHost Home](./Home.md)

Go to [API Home](../Home.md)