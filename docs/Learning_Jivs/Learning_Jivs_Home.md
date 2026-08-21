# Learning Jivs

Welcome to the **Jivs Learning library**.

Jivs helps applications manage and validate values. It can participate in client applications and Node.js servers, and client-side Jivs can integrate with servers that use other validation systems.

Jivs separates validation rules from UI presentation while fitting into the application's existing approaches to input, Models, server requests, and error handling.

These documents are not an API reference. They introduce the value-management and validation workflows already present in an application, then show where Jivs participates.

## Follow the Learning Path

First-time readers should follow the documents in order. Each document builds on concepts introduced earlier.

Experienced Jivs users can also jump directly to the workflow they need.

Client presentation appears at the end because it builds on the validation state and client/server workflows introduced earlier.

### Foundations

1. [Understanding Value Management](Understanding_Value_Management.md)

   Start with the technology-independent Value Manager concept. Learn how obtaining values, parsing, formatting, validating, and communicating errors fit into client-side and server-side applications.

2. [Understanding Jivs](Understanding_Jivs.md)

   See how Jivs implements the Value Manager and become familiar with its core concepts: `ValueHost`, `FieldValueHost`, `ValueHostsManager`, and `JivsServices`.

### Create and Use Jivs on the Client

3. [Intro to Creating a ValueHostsManager](Intro_to_Creating_a_ValueHostsManager.md)

   Learn the basic creation pattern and how the Builder API turns a rules class into the configuration used by a `ValueHostsManager`.

4. [Using the ValueHostsManager within the Client](Using_the_ValueHostsManager_within_the_Client.md)

   Connect a configured `ValueHostsManager` to the interactive parts of the client. Send input values to Jivs and respond when Jivs reports value or validation changes.

5. [Initializing the Client Form](Initializing_the_Client_Form.md)

   Initialize the UI and `ValueHostsManager` with the same starting values, whether they come from an API, server-rendered HTML, or an existing application process.

6. [Submitting the Client Form](Submitting_the_Client_Form.md)

   Follow the complete submission process: validate with Jivs, build the Model, perform additional business validation, send the request, and integrate server validation results.

7. [Client Presentation of Jivs Validation](./Presentation/Client_Presentation_of_Jivs_Validation.md)

    Build the client validation presentation, including Field Error Displays, Required Indicators, validation styling, Validation Summaries, and Submit / Save Controls. This guide introduces Jivs SimpleDom as a complete working approach while preserving Jivs' independence from the UI.

### Validate on the Server

8. [Understanding Server-Side Validation](Understanding_Server_Side_Validation.md)

   Begin with the technology-independent server workflow. Learn why the server must validate every request and how validation issues differ from operational failures.

9. [Using Jivs for Server-Side Validation](Using_Jivs_for_Server_Side_Validation.md)

   Use Jivs on a Node.js server to prepare and validate request values, build Models, and share Model validation rules between the client and server.

10. [Integrating Non-Jivs Server Validation](Integrating_Non_Jivs_Server_Validation.md)

   Keep an existing server validation system while translating its validation results into the information Jivs needs on the client.

### Special configurations

11. [Using Jivs with server generated pages](./Server_Pages/Using_Jivs_with_server_generated_pages.md)

    Use server generated pages together with Jivs. Includes guidelines, code snippets, and workflows.

---
Get started with [Understanding Value Management](Understanding_Value_Management.md).