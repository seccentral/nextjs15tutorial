import bcrypt from "bcrypt";
import { db } from "@vercel/postgres";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";

const client = await db.connect();

async function seedUsers() {
  await client.sql`create extension if not exists "uuid-ossp"`;
  await client.sql`
    create table if not exists users (
      id uuid default uuid_generate_v4() primary key,
      name varchar(255) not null,
      email text not null unique,
      password text not null
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedpassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        insert into users (id, name, email, password)
        values (${user.id}, ${user.name}, ${user.email}, ${hashedpassword})
        on conflict (id) do nothing;
      `;
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {
  await client.sql`create extension if not exists "uuid-ossp"`;

  await client.sql`
    create table if not exists invoices (
      id uuid default uuid_generate_v4() primary key,
      customer_id uuid not null,
      amount int not null,
      status varchar(255) not null,
      date date not null
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => client.sql`
        insert into invoices (customer_id, amount, status, date)
        values (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        on conflict (id) do nothing;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await client.sql`create extension if not exists "uuid-ossp"`;

  await client.sql`
    create table if not exists customers (
      id uuid default uuid_generate_v4() primary key,
      name varchar(255) not null,
      email varchar(255) not null,
      image_url varchar(255) not null
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => client.sql`
        insert into customers (id, name, email, image_url)
        values (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        on conflict (id) do nothing;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await client.sql`
    create table if not exists revenue (
      month varchar(4) not null unique,
      revenue int not null
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => client.sql`
        insert into revenue (month, revenue)
        values (${rev.month}, ${rev.revenue})
        on conflict (month) do nothing;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    await client.sql`BEGIN`;
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    await client.sql`COMMIT`;

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    await client.sql`ROLLBACK`;
    return Response.json({ error }, { status: 500 });
  }
}
