# Auth Service - Product Requirements Document

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope](#2-scope)
3. [User Stories](#3-user-stories)
4. [Functional Requirements](#4-functional-requirements)
5. [Traceability Matrix](#5-traceability-matrix)
6. [Non-Functional Requirements](#6-non-functional-requirements)

---

## 1. Executive Summary

### 1.1 Purpose

The Auth Service is a core microservice within the xshopai e-commerce platform responsible for authentication, authorization, and identity management. It serves as the central security gateway for the entire platform, issuing JWT tokens and managing user authentication lifecycle.

### 1.2 Business Objectives

| Objective                     | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| **Secure Authentication**     | Provide secure login/logout with industry-standard JWT tokens  |
| **User Registration**         | Enable new user registration with email verification           |
| **Password Management**       | Support password reset, change, and recovery workflows         |
| **Session Management**        | Manage user sessions with secure token issuance and validation |
| **Role-Based Access Control** | Support customer and admin roles with appropriate permissions  |
| **Account Lifecycle**         | Handle account activation, deactivation, and deletion          |

### 1.3 Success Metrics

| Metric                      | Target  | Description                                          |
| --------------------------- | ------- | ---------------------------------------------------- |
| Login Response Time (p95)   | < 200ms | 95th percentile response time for login requests     |
| Token Validation Time (p95) | < 50ms  | 95th percentile response time for token verification |
| Authentication Success Rate | > 99%   | Percentage of valid login attempts that succeed      |
| Service Availability        | 99.9%   | Uptime during business hours                         |
| Failed Login Detection      | 100%    | All failed login attempts are logged for security    |

### 1.4 Target Users

| User                     | Interaction                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| **Customer UI**          | Login, register, password reset, email verification via web interface |
| **Admin UI**             | Admin login and user management operations                            |
| **Web BFF**              | Token validation, JWT secret configuration retrieval                  |
| **User Service**         | User creation during registration, user lookup for authentication     |
| **Notification Service** | Receives events for email verification, password reset emails         |

---

## 2. Scope

### 2.1 In Scope

- User authentication (login/logout)
- User registration with email verification
- JWT token issuance and validation
- Password management (forgot, reset, change)
- Email verification workflow
- Account reactivation
- Account deletion (self-service and admin)
- Role-based authorization middleware
- Authentication event publishing
- JWT configuration endpoint for BFF services

### 2.2 Out of Scope

- User profile management (handled by user-service)
- Address/payment method management (handled by user-service)
- Multi-factor authentication (future enhancement)
- OAuth/social login providers (future enhancement)
- Session revocation/blacklisting (future enhancement)
- Rate limiting (handled at API gateway level)
- User analytics and reporting

---

## 3. User Stories

### 3.1 User Login

**As a** Customer  
**I want to** log in with my email and password  
**So that** I can access my account and make purchases

**Acceptance Criteria:**

- [ ] User can login with valid email and password
- [ ] Returns JWT token on successful authentication
- [ ] Returns appropriate error for invalid credentials
- [ ] Rejects login for deactivated accounts
- [ ] Rejects login for unverified email addresses
- [ ] Publishes `auth.login` event on successful login
- [ ] Sets HTTP-only cookie with token for web clients

---

### 3.2 User Registration

**As a** Visitor  
**I want to** create a new account  
**So that** I can shop on the platform

**Acceptance Criteria:**

- [ ] User can register with email, password, first name, and last name
- [ ] System validates required fields before creating user
- [ ] System creates user via User Service
- [ ] System generates email verification token
- [ ] System publishes `auth.user.registered` event
- [ ] System publishes `auth.email.verification.requested` event
- [ ] Returns success message indicating verification email sent
- [ ] Prevents duplicate email registration

---

### 3.3 Password Reset

**As a** Customer  
**I want to** reset my password if I forget it  
**So that** I can regain access to my account

**Acceptance Criteria:**

- [ ] User can request password reset by providing email
- [ ] System generates time-limited reset token (1 hour)
- [ ] System publishes `auth.password.reset.requested` event
- [ ] User can reset password with valid token
- [ ] System publishes `auth.password.reset.completed` event
- [ ] Invalid or expired tokens are rejected

---

### 3.4 Email Verification

**As a** New User  
**I want to** verify my email address  
**So that** I can complete my registration and log in

**Acceptance Criteria:**

- [ ] User receives verification email after registration
- [ ] Verification link contains time-limited token (24 hours)
- [ ] Clicking valid link marks email as verified in User Service
- [ ] User can request resend of verification email
- [ ] Invalid or expired tokens are rejected
- [ ] Already verified emails return appropriate message

---

### 3.5 Password Change

**As a** Logged-in Customer  
**I want to** change my password  
**So that** I can maintain account security

**Acceptance Criteria:**

- [ ] Authenticated user can change their password
- [ ] New password must meet security requirements
- [ ] New password must be different from old password
- [ ] System forwards password change to User Service
- [ ] Returns success message on completion

---

### 3.6 Account Reactivation

**As a** Customer with Deactivated Account  
**I want to** request account reactivation  
**So that** I can use the platform again

**Acceptance Criteria:**

- [ ] User can request reactivation by providing email
- [ ] System generates time-limited reactivation token (1 hour)
- [ ] System publishes `auth.account.reactivation.requested` event
- [ ] User can reactivate account with valid token
- [ ] Already active accounts return appropriate message

---

### 3.7 Account Deletion

**As a** Customer  
**I want to** delete my account  
**So that** my data is removed from the platform (GDPR compliance)

**Acceptance Criteria:**

- [ ] Authenticated user can delete their own account
- [ ] System forwards deletion to User Service
- [ ] Returns 204 No Content on success
- [ ] Admin can delete any user by ID

---

### 3.8 Token Verification

**As a** Web BFF  
**I want to** verify JWT tokens  
**So that** I can authenticate requests to backend services

**Acceptance Criteria:**

- [ ] Endpoint validates JWT token from Authorization header or cookie
- [ ] Returns user ID, email, and roles on valid token
- [ ] Returns 401 for invalid or expired tokens
- [ ] Supports standard JWT claims (sub, iss, aud, iat, exp)

---

## 4. Functional Requirements

### 4.1 User Login

**Description:**  
The system shall provide an API endpoint for users to authenticate with email and password.

**Functional Details:**

| Aspect   | Specification                         |
| -------- | ------------------------------------- |
| Endpoint | `POST /api/auth/login`                |
| Input    | Email and password in request body    |
| Output   | JWT token and user profile on success |
| Auth     | None (public endpoint)                |

**Acceptance Criteria:**

- [ ] Validates email and password are provided
- [ ] Queries User Service for user by email
- [ ] Verifies password using bcrypt comparison
- [ ] Checks user is active and email is verified
- [ ] Issues JWT token with standard claims
- [ ] Sets HTTP-only cookie for web clients
- [ ] Publishes `auth.login` event

**Notes:** Primary authentication endpoint used by Customer UI and Admin UI.

---

### 4.2 User Logout

**Description:**  
The system shall provide an API endpoint for users to end their session.

**Functional Details:**

| Aspect   | Specification                      |
| -------- | ---------------------------------- |
| Endpoint | `POST /api/auth/logout`            |
| Input    | None                               |
| Output   | Success message                    |
| Auth     | JWT required (clears token cookie) |

**Acceptance Criteria:**

- [ ] Clears the token cookie
- [ ] Returns success message
- [ ] Works with or without valid token

---

### 4.3 User Registration

**Description:**  
The system shall provide an API endpoint for new user registration.

**Functional Details:**

| Aspect   | Specification                                     |
| -------- | ------------------------------------------------- |
| Endpoint | `POST /api/auth/register`                         |
| Input    | Email, password, firstName, lastName, phoneNumber |
| Output   | Created user info (without password)              |
| Auth     | None (public endpoint)                            |

**Acceptance Criteria:**

- [ ] Validates required fields (email, password, firstName, lastName)
- [ ] Creates user via User Service with `isEmailVerified: false`
- [ ] Generates 24-hour verification token
- [ ] Publishes `auth.user.registered` event
- [ ] Publishes `auth.email.verification.requested` event
- [ ] Returns 201 with user info and verification required message

---

### 4.4 Forgot Password

**Description:**  
The system shall provide an API endpoint to request password reset.

**Functional Details:**

| Aspect   | Specification                    |
| -------- | -------------------------------- |
| Endpoint | `POST /api/auth/password/forgot` |
| Input    | Email address                    |
| Output   | Success message                  |
| Auth     | None (public endpoint)           |

**Acceptance Criteria:**

- [ ] Validates email is provided
- [ ] Looks up user by email in User Service
- [ ] Generates 1-hour reset token
- [ ] Publishes `auth.password.reset.requested` event
- [ ] Returns success message (even if email not found, for security)

---

### 4.5 Reset Password

**Description:**  
The system shall provide an API endpoint to reset password using a token.

**Functional Details:**

| Aspect   | Specification                                |
| -------- | -------------------------------------------- |
| Endpoint | `POST /api/auth/password/reset`              |
| Input    | Reset token and new password                 |
| Output   | Success message                              |
| Auth     | None (public endpoint with token validation) |

**Acceptance Criteria:**

- [ ] Validates token and new password are provided
- [ ] Verifies token is valid and not expired
- [ ] Updates password via User Service
- [ ] Publishes `auth.password.reset.completed` event
- [ ] Returns success message

---

### 4.6 Change Password

**Description:**  
The system shall provide an API endpoint for authenticated users to change their password.

**Functional Details:**

| Aspect   | Specification                    |
| -------- | -------------------------------- |
| Endpoint | `POST /api/auth/password/change` |
| Input    | Old password and new password    |
| Output   | Success message                  |
| Auth     | JWT required                     |

**Acceptance Criteria:**

- [ ] Validates both passwords are provided
- [ ] Validates new password meets security requirements
- [ ] Validates new password differs from old password
- [ ] Updates password via User Service PATCH endpoint
- [ ] Returns success message

---

### 4.7 Verify Email

**Description:**  
The system shall provide an API endpoint to verify email address using a token.

**Functional Details:**

| Aspect   | Specification                                |
| -------- | -------------------------------------------- |
| Endpoint | `GET /api/auth/email/verify?token=...`       |
| Input    | Verification token as query parameter        |
| Output   | Success message                              |
| Auth     | None (public endpoint with token validation) |

**Acceptance Criteria:**

- [ ] Validates token is provided
- [ ] Verifies token is valid and not expired
- [ ] Updates user `isEmailVerified: true` via User Service
- [ ] Returns appropriate message if already verified
- [ ] Returns error for invalid/expired tokens

---

### 4.8 Resend Verification Email

**Description:**  
The system shall provide an API endpoint to resend email verification.

**Functional Details:**

| Aspect   | Specification                 |
| -------- | ----------------------------- |
| Endpoint | `POST /api/auth/email/resend` |
| Input    | Email address                 |
| Output   | Success message               |
| Auth     | None (public endpoint)        |

**Acceptance Criteria:**

- [ ] Validates email is provided
- [ ] Verifies user exists and email is not already verified
- [ ] Generates new 24-hour verification token
- [ ] Publishes `auth.email.verification.requested` event
- [ ] Returns success message

---

### 4.9 Verify Token

**Description:**  
The system shall provide an API endpoint to verify JWT tokens.

**Functional Details:**

| Aspect   | Specification                         |
| -------- | ------------------------------------- |
| Endpoint | `GET /api/auth/verify`                |
| Input    | JWT in Authorization header or cookie |
| Output   | Token validity and user info          |
| Auth     | JWT required                          |

**Acceptance Criteria:**

- [ ] Extracts token from header or cookie
- [ ] Validates token signature and expiration
- [ ] Returns user ID, email, and roles
- [ ] Returns 401 for invalid tokens

---

### 4.10 Get Current User

**Description:**  
The system shall provide an API endpoint to get current authenticated user info.

**Functional Details:**

| Aspect   | Specification                            |
| -------- | ---------------------------------------- |
| Endpoint | `GET /api/auth/me`                       |
| Input    | JWT in Authorization header or cookie    |
| Output   | User profile from token                  |
| Auth     | JWT required with customer or admin role |

**Acceptance Criteria:**

- [ ] Returns user info from decoded JWT
- [ ] Requires valid authentication
- [ ] Requires customer or admin role

---

### 4.11 Request Account Reactivation

**Description:**  
The system shall provide an API endpoint to request account reactivation.

**Functional Details:**

| Aspect   | Specification               |
| -------- | --------------------------- |
| Endpoint | `POST /api/auth/reactivate` |
| Input    | Email address               |
| Output   | Success message             |
| Auth     | None (public endpoint)      |

**Acceptance Criteria:**

- [ ] Validates email is provided
- [ ] Verifies user exists and is deactivated
- [ ] Generates 1-hour reactivation token
- [ ] Publishes `auth.account.reactivation.requested` event
- [ ] Returns success message

---

### 4.12 Reactivate Account

**Description:**  
The system shall provide an API endpoint to reactivate account using a token.

**Functional Details:**

| Aspect   | Specification                                |
| -------- | -------------------------------------------- |
| Endpoint | `GET /api/auth/reactivate?token=...`         |
| Input    | Reactivation token as query parameter        |
| Output   | Success message                              |
| Auth     | None (public endpoint with token validation) |

**Acceptance Criteria:**

- [ ] Validates token is provided
- [ ] Verifies token is valid and not expired
- [ ] Updates user `isActive: true` via User Service
- [ ] Returns appropriate message if already active
- [ ] Returns error for invalid/expired tokens

---

### 4.13 Delete Own Account

**Description:**  
The system shall provide an API endpoint for users to delete their own account.

**Functional Details:**

| Aspect   | Specification              |
| -------- | -------------------------- |
| Endpoint | `DELETE /api/auth/account` |
| Input    | None                       |
| Output   | 204 No Content             |
| Auth     | JWT required               |

**Acceptance Criteria:**

- [ ] Extracts user from JWT token
- [ ] Deletes user via User Service
- [ ] Returns 204 No Content on success
- [ ] Returns 404 if user not found

---

### 4.14 Admin Delete User

**Description:**  
The system shall provide an API endpoint for admins to delete any user.

**Functional Details:**

| Aspect   | Specification                      |
| -------- | ---------------------------------- |
| Endpoint | `DELETE /api/admin/auth/users/:id` |
| Input    | User ID as path parameter          |
| Output   | 204 No Content                     |
| Auth     | JWT required with admin role       |

**Acceptance Criteria:**

- [ ] Requires admin role
- [ ] Deletes user by ID via User Service
- [ ] Returns 204 No Content on success
- [ ] Returns 404 if user not found

---

### 4.15 Get JWT Configuration

**Description:**  
The system shall provide an API endpoint for BFF services to retrieve JWT configuration.

**Functional Details:**

| Aspect   | Specification              |
| -------- | -------------------------- |
| Endpoint | `GET /api/auth/config/jwt` |
| Input    | None                       |
| Output   | JWT secret and algorithm   |
| Auth     | None (internal endpoint)   |

**Acceptance Criteria:**

- [ ] Returns JWT secret from Dapr secret store
- [ ] Returns JWT algorithm (HS256)
- [ ] Used by Web BFF for token validation

**Notes:** This endpoint should be secured in production (internal network only).

---

## 5. Traceability Matrix

| Req ID | Requirement           | User Story | Endpoint                         | Test Case   |
| ------ | --------------------- | ---------- | -------------------------------- | ----------- |
| 4.1    | User Login            | 3.1        | POST /api/auth/login             | TC-AUTH-001 |
| 4.2    | User Logout           | 3.1        | POST /api/auth/logout            | TC-AUTH-002 |
| 4.3    | User Registration     | 3.2        | POST /api/auth/register          | TC-AUTH-003 |
| 4.4    | Forgot Password       | 3.3        | POST /api/auth/password/forgot   | TC-AUTH-004 |
| 4.5    | Reset Password        | 3.3        | POST /api/auth/password/reset    | TC-AUTH-005 |
| 4.6    | Change Password       | 3.5        | POST /api/auth/password/change   | TC-AUTH-006 |
| 4.7    | Verify Email          | 3.4        | GET /api/auth/email/verify       | TC-AUTH-007 |
| 4.8    | Resend Verification   | 3.4        | POST /api/auth/email/resend      | TC-AUTH-008 |
| 4.9    | Verify Token          | 3.8        | GET /api/auth/verify             | TC-AUTH-009 |
| 4.10   | Get Current User      | 3.8        | GET /api/auth/me                 | TC-AUTH-010 |
| 4.11   | Request Reactivation  | 3.6        | POST /api/auth/reactivate        | TC-AUTH-011 |
| 4.12   | Reactivate Account    | 3.6        | GET /api/auth/reactivate         | TC-AUTH-012 |
| 4.13   | Delete Own Account    | 3.7        | DELETE /api/auth/account         | TC-AUTH-013 |
| 4.14   | Admin Delete User     | 3.7        | DELETE /api/admin/auth/users/:id | TC-AUTH-014 |
| 4.15   | Get JWT Configuration | 3.8        | GET /api/auth/config/jwt         | TC-AUTH-015 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement                | Target                                           |
| -------------------------- | ------------------------------------------------ |
| Login response time (p95)  | < 200ms                                          |
| Token validation time      | < 50ms                                           |
| Registration response time | < 500ms (includes User Service call)             |
| Concurrent users           | Support 1000+ concurrent authentication requests |

### 6.2 Security

| Requirement          | Implementation                                    |
| -------------------- | ------------------------------------------------- |
| Password hashing     | bcrypt with cost factor 10+                       |
| JWT signing          | HS256 algorithm with secure secret                |
| Token expiration     | Configurable (default 1 hour)                     |
| HTTP-only cookies    | Prevent XSS token theft                           |
| Secure cookies       | HTTPS only in production                          |
| Input validation     | All inputs validated and sanitized                |
| Failed login logging | All failed attempts logged with IP and user agent |

### 6.3 Reliability

| Requirement           | Target                                        |
| --------------------- | --------------------------------------------- |
| Service availability  | 99.9% uptime                                  |
| Error handling        | Graceful error responses with correlation IDs |
| Event publishing      | At-least-once delivery via Dapr Pub/Sub       |
| Dependency resilience | Service continues if event publishing fails   |

### 6.4 Observability

| Requirement        | Implementation                                 |
| ------------------ | ---------------------------------------------- |
| Structured logging | JSON format with trace context                 |
| Correlation IDs    | W3C Trace Context via Dapr                     |
| Health checks      | /health, /health/ready, /health/live endpoints |
| Metrics            | /metrics endpoint with memory, uptime stats    |

### 6.5 Scalability

| Requirement        | Implementation                          |
| ------------------ | --------------------------------------- |
| Stateless design   | No session state stored in service      |
| Horizontal scaling | Multiple instances behind load balancer |
| Token-based auth   | JWT enables distributed validation      |
