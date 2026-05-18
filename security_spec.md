# Security Specification - DentaCare Pro

## 1. Data Invariants
- Appointments must be linked to a valid Patient document.
- Only Admins and Staff can view all patients and appointments.
- Patients can only view and manage their own appointments.
- Users cannot change their own roles (privilege escalation protection).
- Testimonials must be approved by an Admin before appearing in public views.
- Blog posts can only be created/edited by Staff or Admins.

## 2. The "Dirty Dozen" Payloads (Deny Cases)
1. **Privilege Escalation**: A patient attempts to update their `role` to 'admin' in the `users` collection.
2. **Identity Spoofing**: A user tries to create an appointment for another user's `patientId`.
3. **Orphaned Write**: Creating an appointment with a non-existent `patientId`.
4. **Shadow Update**: Adding an `isVerified: true` field to a user profile update.
5. **State Shortcut**: Changing an appointment status from 'pending' directly to 'completed' without staff confirmation (if enforced). Actually, let's focus on: Patient changing status to 'completed'.
6. **ID Poisoning**: Injecting a 2KB string as a `projectId` or similar document ID.
7. **Cross-Tenant Leak**: User A tries to `get` User B's record in the `patients` collection.
8. **PII Exposure**: Unauthenticated user trying to `list` the `users` collection.
9. **Spam Attack**: Creating a testimonial with a 1MB content string.
10. **Time Spoofing**: Setting a future `createdAt` date from the client.
11. **Immutable Violation**: Changing the `patientId` of an existing appointment.
12. **Admin Spoofing**: Unauthenticated user trying to `list` the `staff` collection.

## 3. Test Runner Scenarios
- `test('Admin can access everything')`
- `test('Patient can only read their own profile')`
- `test('Guest can only read blog and portfolio')`
- `test('Patient cannot read other patients records')`
- `test('Patient cannot delete confirmed appointments')`
