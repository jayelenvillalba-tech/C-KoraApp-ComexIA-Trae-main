import { initDatabase, sqliteDb, saveDatabase } from '../db-sqlite.js';
import crypto from 'crypto';

console.log('=== SEED: 50 Empresas + 200 Empleados ===\n');

const COMPANY_TYPES = ['Frigorífico', 'Exportadora', 'Importadora', 'Distribuidora', 'Procesadora', 'Comercializadora'];
const COUNTRIES = ['AR', 'BR', 'CL', 'UY', 'PY', 'US', 'CN', 'ES', 'DE', 'IT'];
const CITIES_AR = ['Buenos Aires', 'Rosario', 'Córdoba', 'Mendoza', 'Santa Fe'];
const CITIES_BR = ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Porto Alegre'];
const CITIES_US = ['Miami', 'New York', 'Los Angeles', 'Chicago'];
const CITIES_CN = ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen'];

const EMPLOYEE_ROLES = [
  'CEO', 'Sales Manager', 'Export Manager', 'Logistics Manager',
  'Quality Manager', 'Operations Director', 'Commercial Director',
  'International Trade Specialist'
];

const PRODUCTS = [
  'Carne Bovina', 'Carne Porcina', 'Pollo', 'Soja', 'Maíz', 'Trigo',
  'Aceite de Soja', 'Harina de Soja', 'Vino', 'Frutas Frescas',
  'Maquinaria Agrícola', 'Autopartes', 'Textiles', 'Cuero'
];

function generateCompanies(count: number) {
  const companies = [];
  
  for (let i = 0; i < count; i++) {
    const country = COUNTRIES[i % COUNTRIES.length];
    const type = COMPANY_TYPES[i % COMPANY_TYPES.length];
    const companyName = `${type} ${String.fromCharCode(65 + (i % 26))}${i + 1}`;
    
    let city = CITIES_AR[i % CITIES_AR.length];
    if (country === 'BR') city = CITIES_BR[i % CITIES_BR.length];
    if (country === 'US') city = CITIES_US[i % CITIES_US.length];
    if (country === 'CN') city = CITIES_CN[i % CITIES_CN.length];
    
    companies.push({
      id: crypto.randomUUID(),
      name: companyName,
      legal_name: `${companyName} S.A.`,
      tax_id: `${country}-${String(i).padStart(8, '0')}`,
      business_type: type,
      country,
      city,
      address: `Av. Principal ${i + 100}, ${city}`,
      email: `contact@${companyName.toLowerCase().replace(/ /g, '')}.com`,
      phone: `+${i}${String(i).padStart(10, '0')}`,
      website: `https://www.${companyName.toLowerCase().replace(/ /g, '')}.com`,
      description: `${companyName} es una empresa líder en ${type.toLowerCase()} con más de ${10 + (i % 30)} años de experiencia en comercio internacional.`,
      products: JSON.stringify(PRODUCTS.slice(i % 5, (i % 5) + 3)),
      certifications: JSON.stringify(['HACCP', 'ISO 9001', 'BRC']),
      verified: i % 3 === 0 ? 1 : 0, // 1/3 verificadas
      employee_count: `${50 + (i * 10)}-${100 + (i * 20)}`,
      established_year: 1980 + (i % 40),
      rating: 4.0 + (i % 10) / 10,
      total_reviews: 10 + (i * 5),
      followers: `${i + 1}k`,
      created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return companies;
}

function generateEmployees(companies: any[], employeesPerCompany: number) {
  const employees = [];
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofia', 'Miguel', 'Elena'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez'];
  
  for (const company of companies) {
    for (let i = 0; i < employeesPerCompany; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const role = EMPLOYEE_ROLES[i % EMPLOYEE_ROLES.length];
      
      employees.push({
        id: crypto.randomUUID(),
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/ /g, '')}.com`,
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456', // Mock hashed password
        role,
        company_id: company.id,
        company: company.name,
        verified: company.verified,
        created_at: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  return employees;
}

async function main() {
  try {
    await initDatabase();
    
    console.log('🏢 Generando 50 empresas...');
    const companies = generateCompanies(50);
    
    console.log('👥 Generando 200 empleados (4 por empresa)...');
    const employees = generateEmployees(companies, 4);
    
    console.log('\n📊 Insertando empresas...');
    let companiesInserted = 0;
    for (const company of companies) {
      try {
        sqliteDb.run(
          `INSERT INTO companies (
            id, name, legal_name, tax_id, business_type, country, city, address,
            email, phone, website, description, products, certifications, verified,
            employee_count, established_year, rating, total_reviews, followers, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            company.id, company.name, company.legal_name, company.tax_id, company.business_type,
            company.country, company.city, company.address, company.email, company.phone,
            company.website, company.description, company.products, company.certifications,
            company.verified, company.employee_count, company.established_year, company.rating,
            company.total_reviews, company.followers, company.created_at
          ]
        );
        companiesInserted++;
        if (companiesInserted % 10 === 0) process.stdout.write('.');
      } catch (error: any) {
        if (!error.message.includes('UNIQUE constraint')) {
          console.error(`Error insertando empresa ${company.name}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ ${companiesInserted} empresas insertadas`);
    
    console.log('\n📊 Insertando empleados...');
    let employeesInserted = 0;
    for (const employee of employees) {
      try {
        sqliteDb.run(
          `INSERT INTO users (
            id, name, email, password, role, company_id, company, verified, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employee.id, employee.name, employee.email, employee.password, employee.role,
            employee.company_id, employee.company, employee.verified, employee.created_at
          ]
        );
        employeesInserted++;
        if (employeesInserted % 20 === 0) process.stdout.write('.');
      } catch (error: any) {
        if (!error.message.includes('UNIQUE constraint')) {
          console.error(`Error insertando empleado ${employee.name}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ ${employeesInserted} empleados insertados`);
    
    saveDatabase();
    
    // Verificar totales
    const totalCompanies = sqliteDb.exec('SELECT COUNT(*) FROM companies')[0]?.values[0][0] || 0;
    const totalUsers = sqliteDb.exec('SELECT COUNT(*) FROM users')[0]?.values[0][0] || 0;
    const verifiedCompanies = sqliteDb.exec('SELECT COUNT(*) FROM companies WHERE verified = 1')[0]?.values[0][0] || 0;
    
    console.log(`\n📊 TOTALES:`);
    console.log(`   - Empresas: ${totalCompanies}`);
    console.log(`   - Empresas verificadas: ${verifiedCompanies}`);
    console.log(`   - Empleados: ${totalUsers}`);
    console.log('💾 Database saved\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
