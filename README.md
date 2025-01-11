# PayGuard System

PayGuard is a very simple payment and document management system with user and admin dashboards.

## Links

[PayGuard System BE Live](https://payguard-server.vercel.app/)

[Frontend Codebase](https://github.com/hkeva/payguard-client).

## Features

### Admin Dashboard

- **Login**: Admin can log in using the credentials below.
- **Admin Features**:
  - View and filter payment, document, and user lists.
  - Update payment/document status (this triggers an email to the user).
  - Download payment invoices.

#### Admin Login

- **Email**: `humayraeva@gmail.com`
- **Password**: `12345678`

### User Dashboard

- **Register**: Users need to register first.
- **Login**: Users need to verify their email before logging in.
- **User Features**:
  - Create new payments and documents.
  - View a list of their created payments and documents.

## Technologies Used

- **Supabase** for authentication
- **Stripe** for payment integration
- **MongoDB** for database
- **Nodemailer**: for sending emails
- **Joi**: for data validation

### Run project

```bash
yarn or npm install
yarn dev or npm run dev

```
