# Database Setup Instructions

## Prerequisites
1. **PostgreSQL** must be installed on your system
2. **pgAdmin** or command line access to PostgreSQL

## Step 1: Create Database and User

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → Create → Database
4. Name: `mydb`
5. Right-click on "Login/Group Roles" → Create → Login/Group Role
6. Name: `admin`, Password: `admin123`
7. In Privileges tab, check "Can login?" and "Superuser?"

### Option B: Using Command Line (psql)
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE mydb;

-- Create user
CREATE USER admin WITH PASSWORD 'admin123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mydb TO admin;
ALTER USER admin CREATEDB;

-- Exit
\q
```

### Option C: Using SQL Commands in any PostgreSQL client
```sql
CREATE DATABASE mydb;
CREATE USER admin WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE mydb TO admin;
ALTER USER admin CREATEDB;
```

## Step 2: Verify Connection
Test the connection string: `postgresql://admin:admin123@localhost:5432/mydb`

## Step 3: Initialize Application Database
After creating the database, run:
```bash
cd server
node scripts/init-db.js
```

## Troubleshooting

### Error: "database does not exist"
- Make sure you created the database named `mydb`
- Check PostgreSQL is running on port 5432

### Error: "password authentication failed"
- Verify the user `admin` exists with password `admin123`
- Check pg_hba.conf allows password authentication

### Error: "connection refused"
- Ensure PostgreSQL service is running
- Check if PostgreSQL is listening on localhost:5432

## Default Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: mydb
- **Username**: admin
- **Password**: admin123
- **Connection String**: `postgresql://admin:admin123@localhost:5432/mydb`
