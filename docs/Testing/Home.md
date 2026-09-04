# Testing your work
Because it is a service separated from your UI code, Jivs is easier to test that your validation is working correctly. Jivs also has its own services contained in the `JivsServices object`, where you might replace one of its services with a mock, as its services all start as interfaces.

There are two possible places to test:
1. Against the fully configured `ValueHostsManager object`, which is what your app will use. Use your testing framework.
    [Test Validation Requests](./Test_Validation_Requests.md)
2. Against just the configuration that will be used by the ValueHostsManager. Use **Jivs-ConfigAnalysis service** to catch configuration errors and get a report that details how Dependency Injection should resolve objects. 
    [Testing Configurations with Jivs-ConfigAnalysis](./Testing_Configurations.md)

You can use any testing framework you like. Jivs itself uses [Jest](https://www.npmjs.com/package/jest). So examples here will use Jest as well.