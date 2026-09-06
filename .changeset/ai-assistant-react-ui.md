---
'@tanstack/create': patch
---

Rebuild the React AI add-on's floating "AI Assistant" on the
`@tanstack/ai-react/ui` `createChatHook` registry pattern. The assistant now
registers layout/message/input chrome plus text and `recommendGuitar` tool
components instead of hand-rolling message rendering, matching the newer
react-ui chat architecture. Behaviour and styling are unchanged; the guitar
recommendation card still renders inline.
