# Element collector for integration tests

`ElementCollectorForTests`, exported from this file, is a small `ElementCollectorBase` subclass that collects markup created by `TestHtmlBuilder` or authored directly. It deliberately reads the DOM, not the descriptors, so it exercises the boundary between HTML and `ElementRegistry` independently. It is a test double, not the planned production jivs-simpledom implementation.
```ts
const collector = new ElementCollectorForTests();
const formInstaller = new FormInstaller(valueHostsManager, collector);
formInstaller.install();
runner.assertFormInstallation(document, valueHostsManager);
```
It scans the supplied root (including the root itself when marked) and its descendant elements with data-jivs-role, in document order. editor elements call registry.addEditor, summary/submit call registry.addForm, and all other roles call registry.addField. Field and editor roles must have data-field; a missing or empty field name throws. Only elements with role attributes are registered; for radio groups, the HTML builder marks one radio input.

Supported HTML attributes are data-jivs-role, data-field, optional data-jivs-adapterkey, optional data-jivs-presentation, and provisional data-jivs-group on form roles. The collector passes only explicitly supplied options, leaving automatic adapter or default presentation selection to the Jivs installers. duringEdit is intentionally not inferred: the SimpleDom attribute convention has not yet been settled. A future production collector may implement additional validation and conventions.

The accompanying Jest suite includes collector tests for role dispatch, optional attributes, scoping, the radio group convention, and missing field association. The integration-tool suites have been run and type-checked in the full Jivs repository.