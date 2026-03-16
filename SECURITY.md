# Security Policy

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, email **security@kanava.in** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix (critical)**: Within 14 days
- **Fix (non-critical)**: Next scheduled release

## Scope

Security issues we care about:

- XSS in rendered HTML output
- Malicious content via clipboard paste
- NodeView injection attacks
- Schema bypass leading to arbitrary DOM manipulation
- Dependency vulnerabilities in `@kanava/editor` or `@kanava/editor-react`

## Supported Versions

| Version | Supported |
|---|---|
| 0.1.x-beta | Yes (latest beta always gets patches) |

## Disclosure

We follow coordinated disclosure. Once a fix is released, we will:
1. Publish a security advisory on GitHub
2. Credit the reporter (unless they prefer anonymity)
