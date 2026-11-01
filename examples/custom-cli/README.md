## Scenarios

There are three customizing scenarios we should support:

- Augmenting an exsting CTA framework - Take an existing framework like `react` then allow for base template customization, removal of add-ons, and addition of new custom add-ons.
- Customized UI - Build up a new UI from components of the base UI.
- New framework - Build up a new framework from with base and add-ons as well as a new CLI.

## Customers

There are two types of customers for this work:

- Infrastructure teams - Infrastructure teams at companies who want to create a template for new applications as well as optional add-ons with a friendly CLI and UI.
- OSS framework authors - OSS framework authors who want to build a friendly CLI and UI for their framework.

## Examples

| Project                                | Description                                                           |
| -------------------------------------- | --------------------------------------------------------------------- |
| [customized-react](./customized-react) | Shows a small customization of the existing `react` framework.    |
| [create-qwik-app](./create-qwik-app)   | Show support for an entire framework (Qwik) with a custom CLI and UI. |
