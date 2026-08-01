# Privacy and security

> DataPermit EU is an independent fictional portfolio prototype. It is not affiliated with the
> European Commission, the EHDS, HealthData@EU or any national Health Data Access Body.

A prototype about data minimisation that quietly shipped your draft application to a backend would
be making an argument it did not intend. The privacy posture here is therefore part of the design,
not an afterthought.

## What the application does with data

**Nothing leaves your browser.**

| Question | Answer |
| --- | --- |
| Is there a backend? | No. There is no server-side data store, no API and no database. |
| Are there accounts? | No. There is no authentication and no user identity of any kind. |
| Is there analytics or telemetry? | No. No analytics script, no tracking pixel, no error reporting service. |
| Are there third-party requests at runtime? | No. No CDN fonts, no external images, no embedded widgets. |
| Are there cookies? | No cookies are set. |
| Where is state stored? | `localStorage`, under the single key `datapermit-eu:workspace:v1`. |
| Can anyone else see my projects? | No. There is no sharing, no sync and no multi-device support. |

### Clearing your data

Clearing site data for the origin removes everything. On the next visit the demo projects are
restored. There is no copy anywhere else, and no way to recover a deleted project — which is the
correct behaviour for something with no backend, but worth knowing before you invest effort in a
draft.

### What is stored

Only what you type, plus your dataset selections, dismissed-recommendation ids, the audit trail and
your mock role. Documents are **never uploaded** — marking one "attached" records that you hold it
and stores the reference text you enter, nothing more.

## Do not enter real personal data

This is a demonstration. It has no security controls appropriate to personal data — no encryption at
rest beyond whatever the browser provides, no access control, no audit of access, no retention
policy, no breach process.

**Do not enter:**

- Real patient data, in any form, identifiable or otherwise
- Real special-category data about yourself or anyone else
- Credentials, tokens or API keys
- Confidential protocol content or unpublished research you are not willing to keep in browser
  storage on this machine

The demo content is entirely fictional and is meant to be sufficient for exploring the product.

## Security posture

Appropriate to what this is — a static client-side prototype — and stated so the limits are visible.

### Attack surface

Minimal by construction. No server means no server-side vulnerabilities: no injection into a data
store, no authentication bypass, no privilege escalation, no server-side request forgery. The
remaining surface is the client bundle and the browser origin.

### What is in place

- **No `dangerouslySetInnerHTML` anywhere.** All user-entered text renders as React text nodes, so
  it is escaped by default and stored content cannot execute.
- **No `eval`, no `Function` constructor, no dynamic code execution.**
- **No runtime dependencies beyond React and Next.** Fewer transitive packages, smaller supply-chain
  surface.
- **Defensive deserialisation.** `loadWorkspace` treats stored data as untrusted: malformed JSON, an
  unrecognised schema version, a missing project array or an unexpected role value all fall back to
  a clean demo workspace rather than throwing or propagating bad state.
- **`poweredByHeader: false`** to avoid advertising the framework version.
- **External links** carry `rel="noopener noreferrer external"` and `target="_blank"`.
- **Dependencies audited** at build time; the project pins a patched Next.js line.

### Known limitations

Stated rather than omitted:

1. **`localStorage` is not a security boundary.** Anything stored there is readable by any script
   running on the origin, and by anyone with access to the machine and browser profile. It is not
   encrypted.
2. **No Content Security Policy is configured.** A production deployment should add one; the
   application needs no external origins, so a restrictive policy would be straightforward.
3. **The mock role switch is not access control.** Switching between researcher and reviewer changes
   which controls appear and nothing else. There is no authentication, no authorisation, and no data
   separation between the two views. It demonstrates the *shape* of a two-sided workflow, and the
   interface says so wherever the control appears.
4. **No rate limiting, no abuse controls, no logging.** There is nothing to rate-limit, but this is
   worth knowing if the prototype is ever extended with a backend.
5. **Remaining `npm audit` advisories** concern packages bundled inside Next.js itself. They are not
   resolvable without downgrading the framework to an unsupported major version, and they do not
   affect a static client-side deployment. They are left visible rather than suppressed.

## If this became a real system

The privacy and security requirements would change completely. Handling real applications — which
contain research plans, institutional detail and, in a permit context, references to identifiable
datasets — would require at minimum:

- **Real authentication and authorisation**, most likely federated through existing research identity
  infrastructure, with genuine separation between applicant and reviewer.
- **Server-side storage with encryption at rest**, access logging, and a defined retention and
  deletion policy.
- **A data protection impact assessment** for the tool itself, not merely a feature that helps users
  write one.
- **Formal security review**, dependency scanning in CI, and a documented vulnerability disclosure
  process.
- **A Content Security Policy**, security headers, and hardened session handling.
- **Clear controllership**: who is the controller for application content, on what basis, and for how
  long.

None of that is in place here, because none of it is needed for a prototype that stores fictional
data in one browser. It would all be needed the moment that changed.

## Reporting a problem

This is a portfolio project with no security guarantees. If you find something worth flagging, open
an issue on the repository. Please do not include real personal data in the report.
